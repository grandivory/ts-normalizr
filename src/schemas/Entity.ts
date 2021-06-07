import { mergeRecursive } from "../mergeRecurseive";
import { NormalizationOutput, ValidKey, ValueOf } from "../types";

type NormalizableEntity<IdAttribute extends ValidKey> = {
    [key in IdAttribute]: string | number
};

// This can be extended later as more schema types are added (arrays, objects, multi-value schemas, etc.)
type ValidSchemaProp<T extends string> = T;

type AnySchema = EntitySchema<any, any, any, any, any>;

type ExtractSchemaOutputType<T extends AnySchema> =
    T extends EntitySchema<any, any, any, any, infer O> ? O : never;

type ExtractPropNames<T extends ValidSchemaProp<string>> = T extends ValidSchemaProp<infer P> ? P : never;

type IdFunction<T> = (input: T, parent: unknown, key: string | undefined) => string;

class EntitySchema<
    Input extends Record<ValidKey, any>,
    Name extends string,
    PropsType extends Record<string, ValidSchemaProp<string>>,
    SchemasType extends Record<string, AnySchema>,
    EntitiesOutput extends Record<ExtractPropNames<ValueOf<PropsType>> | Name, Record<string, any>>
> {
    nameProp: Name;
    idFunction: IdFunction<Input>;
    props: PropsType;
    schemas: SchemasType;

    constructor(name: Name, idFunction: IdFunction<Input>, props: PropsType, schemas: SchemasType) {
        this.nameProp = name;
        this.idFunction = idFunction;
        this.props = props;
        this.schemas = {
            ...schemas,
            [name]: this
        };
    }

    normalizeWith(
        input: Input,
        parent: any,
        objectKey: string | undefined
    ): NormalizationOutput<string, EntitiesOutput> {
        const {"entities": subEntities, processedObject} = Object.entries(input).reduce(
            ({entities, "processedObject": partialObject}, [key, value]) => {
                if (key in this.props) {
                    const propType = this.props[key];
                    const schema = this.schemas[propType] as SchemasType[typeof propType];
                    if (Array.isArray(value)) {
                        const { "keys": arrayIds, "entities": arrayEntities } = value.reduce<{
                            keys: Array<string>,
                            entities: Record<string, Record<string, any>>
                        }>(({ keys, "entities": currentEntities}, nextVal) => {
                            const { result, "entities": keyEntities } = schema.normalizeWith(nextVal, input, key) as ExtractSchemaOutputType<typeof schema>;

                            return {
                                "keys": keys.concat([result]),
                                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                                "entities": mergeRecursive(currentEntities, keyEntities)
                            };
                        }, {
                            "keys": [],
                            "entities": {}
                        });

                        return {
                            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                            "entities": arrayEntities,
                            "processedObject": {
                                ...partialObject,
                                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                                [key]: arrayIds
                            }
                        };
                    }

                    const { result, "entities": keyEntities } = schema.normalizeWith(value, input, key) as ExtractSchemaOutputType<typeof schema>;

                    // merge the current entities with the results of the normalize
                    return {
                        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                        "entities": mergeRecursive(entities, keyEntities),
                        "processedObject": {
                            ...partialObject,
                            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                            [key]: result
                        }
                    };
                }

                return {
                    entities,
                    "processedObject": {
                        ...partialObject,
                        [key]: value as Input[typeof key]
                    }
                };
            },
            {"entities": {}, "processedObject": {}
        });

        const thisId = this.idFunction(input, parent, objectKey);

        return {
            "result": thisId,
            "entities": mergeRecursive(subEntities, {
                [this.nameProp]: {
                    [thisId]: processedObject
                }
            }) as EntitiesOutput
        };
    }

    normalize(input: Input) {
        return this.normalizeWith(input, null, undefined);
    }
}

class EntityBuilder<
    InputType,
    IdType extends IdFunction<InputType> | null,
    NameProp extends (string extends NameProp ? never : string) | null,
    PropKeys extends string & keyof InputType,
    PropValues extends string,
    PropsType extends Record<string, ValidSchemaProp<string>>,
    SchemasType extends Record<string, AnySchema> = Record<never, never>,
    ThisOutputType = InputType,
    SubEntitiesOutputType extends Record<string, Record<string, any>> = Record<never, never>
> {
    idFunction: IdType;
    nameProp: NameProp;
    props: PropsType;
    schemas: SchemasType;

    constructor(
        id: IdType,
        name: NameProp,
        props: PropsType,
        schemas: SchemasType
    ) {
        this.idFunction = id;
        this.nameProp = name;
        this.props = props;
        this.schemas = schemas;
    }

    name<N extends (string extends N ? never : string)>(name: N): EntityBuilder<
        InputType,
        IdType,
        N,
        PropKeys,
        PropValues,
        PropsType,
        SchemasType,
        ThisOutputType,
        SubEntitiesOutputType
    > {
        return new EntityBuilder(this.idFunction, name, this.props, this.schemas);
    }

    id<I extends (ValidKey & keyof InputType)>
    (idProp: InputType extends NormalizableEntity<I> ? I : never): EntityBuilder<
        InputType,
        IdFunction<InputType>,
        NameProp,
        PropKeys,
        PropValues,
        PropsType,
        SchemasType,
        ThisOutputType,
        SubEntitiesOutputType
    > {
        return new EntityBuilder(
            (input: InputType) => `${input[idProp] as unknown as string | number}`,
            this.nameProp,
            this.props,
            this.schemas
        );
    }

    computeId(idFunction: IdFunction<InputType>): EntityBuilder<
        InputType,
        IdFunction<InputType>,
        NameProp,
        PropKeys,
        PropValues,
        PropsType,
        SchemasType,
        ThisOutputType,
        SubEntitiesOutputType
    > {
        return new EntityBuilder(
            idFunction,
            this.nameProp,
            this.props,
            this.schemas
        );
    }

    prop<PropName extends string & keyof InputType, PropType extends (string extends PropType ? never : string)>
    (propName: PropName, propType: ValidSchemaProp<PropType>): EntityBuilder<
        InputType,
        IdType,
        NameProp,
        PropKeys | PropName,
        PropValues | PropType,
        PropsType & { [k in PropName]: typeof propType },
        SchemasType,
        Omit<InputType, PropKeys | PropName>,
        SubEntitiesOutputType
    > {
        return new EntityBuilder(
            this.idFunction,
            this.nameProp,
            { ...this.props, [propName]: propType },
            this.schemas
        );
    }

    define<EntityName extends PropValues, SchemaType extends AnySchema>(entityName: EntityName, schema: SchemaType):
    EntityBuilder<
        InputType,
        IdType,
        NameProp,
        PropKeys,
        PropValues,
        PropsType,
        SchemasType & { [k in EntityName]: SchemaType},
        ThisOutputType,
        SubEntitiesOutputType & ExtractSchemaOutputType<SchemaType>
    > {
        return new EntityBuilder(
            this.idFunction,
            this.nameProp,
            this.props,
            {
                ...this.schemas,
                [entityName]: schema
            }
        );
    }
}

type CompleteEntityBuilder<
    InputType extends Record<ValidKey, any>,
    IdType extends IdFunction<InputType>,
    NameProp extends (string extends NameProp ? never : string),
    PropKeys extends string & keyof InputType,
    PropValues extends string,
    PropsType extends Record<string, ValidSchemaProp<string>>,
    SchemasType extends Record<string, AnySchema>,
    ThisOutputType,
    SubEntitiesOutputType extends Record<string, Record<string, any>>
> = [PropValues] extends [keyof SchemasType | NameProp] ? EntityBuilder<InputType, IdType, NameProp, PropKeys, PropValues, PropsType, SchemasType, ThisOutputType, SubEntitiesOutputType> : never;

export function entity<T>(): EntityBuilder<T, null, null, never, never, Record<never, never>> {
    return new EntityBuilder<T, null, null, never, never, Record<never, never>>(null, null, {}, {});
}

export function build<
    InputType extends Record<ValidKey, any>,
    IdType extends IdFunction<InputType>,
    NameProp extends (string extends NameProp ? never : string),
    PropKeys extends string & keyof InputType,
    PropValues extends (string extends PropValues ? never : string),
    PropsType extends Record<string, ValidSchemaProp<string>>,
    SchemasType extends Record<string, AnySchema>,
    BuilderOutputType,
    SubEntitiesOutputType extends Record<string, Record<string, any>>
>(
    builder: CompleteEntityBuilder<InputType, IdType, NameProp, PropKeys, PropValues, PropsType, SchemasType, BuilderOutputType, SubEntitiesOutputType>,
): EntitySchema<
    InputType,
    NameProp,
    PropsType,
    SchemasType,
    SubEntitiesOutputType & { [k in NameProp]: Record<string, BuilderOutputType> }
> {
    return new EntitySchema<
        InputType,
        NameProp,
        PropsType,
        SchemasType,
        SubEntitiesOutputType & { [k in NameProp]: Record<string, BuilderOutputType> }
    >(builder.nameProp, builder.idFunction, builder.props, builder.schemas);
}
