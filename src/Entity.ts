import { mergeRecursive } from "./utils/mergeRecurseive";
import { NormalizationOutput, ValidKey, ValueOf } from "./types";
import { identity } from "./utils/identity";

type NormalizableEntity<IdAttribute extends ValidKey> = {
    [key in IdAttribute]: string | number
};

// This can be extended later as more schema types are added (arrays, objects, multi-value schemas, etc.)
type ValidSchemaProp<T extends string> = T;

type AnySchema = EntitySchema<any, any, any, any, any, any>;

type ExtractSchemaOutputType<T extends AnySchema> =
    T extends EntitySchema<any, any, any, any, any, infer O> ? O : never;

type ExtractPropNames<T extends ValidSchemaProp<string>> = T extends ValidSchemaProp<infer P> ? P : never;

type IdFunction<T> = (input: T, parent: unknown, key: string | undefined) => string;

type ProcessFunction<I, O> = (input: I, parent: any, key: string | undefined) => O;

class EntitySchema<
    Input extends Record<ValidKey, any>,
    ProcessedType extends Record<ValidKey, any>,
    Name extends string,
    PropsType extends Record<string, ValidSchemaProp<string>>,
    SchemasType extends Record<string, AnySchema>,
    EntitiesOutput extends Record<ExtractPropNames<ValueOf<PropsType>> | Name, Record<string, any>>
> {
    nameProp: Name;
    idFunction: IdFunction<Input>;
    processFunction: ProcessFunction<Input, ProcessedType>;
    props: PropsType;
    schemas: SchemasType;

    constructor(
        name: Name,
        idFunction: IdFunction<Input>,
        props: PropsType,
        schemas: SchemasType,
        processFunction: ProcessFunction<Input, ProcessedType>
    ) {
        this.nameProp = name;
        this.idFunction = idFunction;
        this.props = props;
        this.schemas = {
            ...schemas,
            [name]: this
        };
        this.processFunction = processFunction;
    }

    normalizeWith(
        input: Input,
        parent: any,
        objectKey: string | undefined
    ): NormalizationOutput<string, EntitiesOutput> {
        const processedInput = this.processFunction(input, parent, objectKey);
        const {"entities": subEntities, processedObject} = Object.entries(processedInput).reduce(
            ({entities, "processedObject": partialObject}, [key, value]) => {
                if (key in this.props) {
                    const propType = this.props[key];
                    const schema = this.schemas[propType] as SchemasType[typeof propType];
                    if (Array.isArray(value)) {
                        const { "keys": arrayIds, "entities": arrayEntities } = value.reduce<{
                            keys: Array<string>,
                            entities: Record<string, Record<string, any>>
                        }>(({ keys, "entities": currentEntities}, nextVal) => {
                            const { result, "entities": keyEntities } = schema.normalizeWith(nextVal, processedInput, key) as ExtractSchemaOutputType<typeof schema>;

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

                    const { result, "entities": keyEntities } = schema.normalizeWith(value, processedInput, key) as ExtractSchemaOutputType<typeof schema>;

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

        const thisId = this.idFunction(processedInput, parent, objectKey);

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
    InputType extends Record<ValidKey, any>,
    ProcessedType extends Record<ValidKey, any>,
    IdType extends IdFunction<ProcessedType> | null,
    NameProp extends (string extends NameProp ? never : string) | null,
    PropKeys extends string & keyof ProcessedType,
    PropValues extends string,
    PropsType extends Record<string, ValidSchemaProp<string>>,
    SchemasType extends Record<string, AnySchema> = Record<never, never>,
    ThisOutputType = ProcessedType,
    SubEntitiesOutputType extends Record<string, Record<string, any>> = Record<never, never>
> {
    idFunction: IdType;
    processFunction: ProcessFunction<InputType, ProcessedType>;
    nameProp: NameProp;
    props: PropsType;
    schemas: SchemasType;

    constructor(
        id: IdType,
        name: NameProp,
        props: PropsType,
        schemas: SchemasType,
        processFunction: ProcessFunction<InputType, ProcessedType>
    ) {
        this.idFunction = id;
        this.nameProp = name;
        this.props = props;
        this.schemas = schemas;
        this.processFunction = processFunction;
    }

    name<N extends (string extends N ? never : string)>(name: N): EntityBuilder<
        InputType,
        ProcessedType,
        IdType,
        N,
        PropKeys,
        PropValues,
        PropsType,
        SchemasType,
        ThisOutputType,
        SubEntitiesOutputType
    > {
        return new EntityBuilder(this.idFunction, name, this.props, this.schemas, this.processFunction);
    }

    id<I extends (ValidKey & keyof ProcessedType)>
    (idProp: ProcessedType extends NormalizableEntity<I> ? I : never): EntityBuilder<
        InputType,
        ProcessedType,
        IdFunction<ProcessedType>,
        NameProp,
        PropKeys,
        PropValues,
        PropsType,
        SchemasType,
        ThisOutputType,
        SubEntitiesOutputType
    > {
        return new EntityBuilder(
            (input: ProcessedType) => `${input[idProp] as unknown as string | number}`,
            this.nameProp,
            this.props,
            this.schemas,
            this.processFunction
        );
    }

    computeId(idFunction: IdFunction<ProcessedType>): EntityBuilder<
        InputType,
        ProcessedType,
        IdFunction<ProcessedType>,
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
            this.schemas,
            this.processFunction
        );
    }

    prop<PropName extends string & keyof ProcessedType, PropType extends (string extends PropType ? never : string)>
    (propName: PropName, propType: ValidSchemaProp<PropType>): EntityBuilder<
        InputType,
        ProcessedType,
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
            this.schemas,
            this.processFunction
        );
    }

    define<EntityName extends PropValues, SchemaType extends AnySchema>(entityName: EntityName, schema: SchemaType):
    EntityBuilder<
        InputType,
        ProcessedType,
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
            },
            this.processFunction
        );
    }
}

type CompleteEntityBuilder<
    InputType extends Record<ValidKey, any>,
    ProcessedType extends Record<ValidKey, any>,
    IdType extends IdFunction<ProcessedType>,
    NameProp extends (string extends NameProp ? never : string),
    PropKeys extends string & keyof ProcessedType,
    PropValues extends string,
    PropsType extends Record<string, ValidSchemaProp<string>>,
    SchemasType extends Record<string, AnySchema>,
    ThisOutputType,
    SubEntitiesOutputType extends Record<string, Record<string, any>>
> = [PropValues] extends [keyof SchemasType | NameProp] ? EntityBuilder<InputType, ProcessedType, IdType, NameProp, PropKeys, PropValues, PropsType, SchemasType, ThisOutputType, SubEntitiesOutputType> : never;

export function entity<T>(): EntityBuilder<T, T, null, null, never, never, Record<never, never>> {
    return new EntityBuilder(null, null, {}, {}, identity);
}

export function processedEntity<T, P>(processFunction: ProcessFunction<T, P>):
EntityBuilder<T, P, null, null, never, never, Record<never, never>> {
    return new EntityBuilder(null, null, {}, {}, processFunction);
}

export function buildSchema<
    InputType extends Record<ValidKey, any>,
    ProcessedType extends Record<ValidKey, any>,
    IdType extends IdFunction<ProcessedType>,
    NameProp extends (string extends NameProp ? never : string),
    PropKeys extends string & keyof ProcessedType,
    PropValues extends (string extends PropValues ? never : string),
    PropsType extends Record<string, ValidSchemaProp<string>>,
    SchemasType extends Record<string, AnySchema>,
    BuilderOutputType,
    SubEntitiesOutputType extends Record<string, Record<string, any>>
>(
    builder: CompleteEntityBuilder<InputType, ProcessedType, IdType, NameProp, PropKeys, PropValues, PropsType, SchemasType, BuilderOutputType, SubEntitiesOutputType>,
): EntitySchema<
    InputType,
    ProcessedType,
    NameProp,
    PropsType,
    SchemasType,
    SubEntitiesOutputType & { [k in NameProp]: Record<string, BuilderOutputType> }
> {
    return new EntitySchema(builder.nameProp, builder.idFunction, builder.props, builder.schemas, builder.processFunction);
}
