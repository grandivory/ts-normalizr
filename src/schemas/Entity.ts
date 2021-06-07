import { mergeRecursive } from "../mergeRecurseive";
import { NormalizationOutput, ValidKey, ValueOf } from "../types";

type NormalizableEntity<IdAttribute extends ValidKey> = {
    [key in IdAttribute]: ValidKey
};

// This can be extended later as more schema types are added (arrays, objects, multi-value schemas, etc.)
type ValidSchemaProp<T extends string> = T;

type AnySchema = EntitySchema<any, any, any, any, any, any>;

type ExtractResultType<T extends AnySchema> =
    T extends EntitySchema<infer Input, infer Id, any, any, any, any> ? Input[Id] : never;

type ExtractSchemaOutputType<T extends AnySchema> =
    T extends EntitySchema<any, any, any, any, any, infer O> ? O : never;

type ExtractPropNames<T extends ValidSchemaProp<string>> = T extends ValidSchemaProp<infer P> ? P : never;

class EntitySchema<
    Input extends NormalizableEntity<IdAttribute>,
    IdAttribute extends ValidKey,
    Name extends string,
    PropsType extends Record<string, ValidSchemaProp<string>>,
    SchemasType extends Record<string, AnySchema>,
    EntitiesOutput extends Record<ExtractPropNames<ValueOf<PropsType>> | Name, Record<string, any>>
> {
    nameProp: Name;
    idProp: IdAttribute;
    props: PropsType;
    schemas: SchemasType;

    constructor(name: Name, idProp: IdAttribute, props: PropsType, schemas: SchemasType) {
        this.nameProp = name;
        this.idProp = idProp;
        this.props = props;
        this.schemas = {
            ...schemas,
            [name]: this
        };
    }

    normalize(
        input: Input
    ): NormalizationOutput<Input[IdAttribute], EntitiesOutput> {
        const {"entities": subEntities, processedObject} = Object.entries(input).reduce(
            ({entities, "processedObject": partialObject}, [key, value]) => {
                if (key in this.props) {
                    const propType = this.props[key];
                    const schema = this.schemas[propType] as SchemasType[typeof propType];
                    if (Array.isArray(value)) {
                        const { "keys": arrayIds, "entities": arrayEntities } = value.reduce<{
                            keys: Array<ExtractResultType<typeof schema>>,
                            entities: Record<string, Record<string, any>>
                        }>(({ keys, "entities": currentEntities}, nextVal) => {
                            const { result, "entities": keyEntities } = schema.normalize(nextVal) as ExtractSchemaOutputType<typeof schema>;

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

                    const { result, "entities": keyEntities } = schema.normalize(value) as ExtractSchemaOutputType<typeof schema>;

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
                        [key]: value
                    }
                };
            },
            {"entities": {}, "processedObject": {}
        });

        return {
            "result": input[this.idProp],
            "entities": mergeRecursive(subEntities, {
                [this.nameProp]: {
                    [input[this.idProp]]: processedObject
                }
            }) as EntitiesOutput
        };
    }
}

class EntityBuilder<
    InputType,
    IdProp extends ValidKey | null,
    NameProp extends (string extends NameProp ? never : string) | null,
    PropKeys extends string & keyof InputType,
    PropValues extends string,
    PropsType extends Record<string, ValidSchemaProp<string>>,
    SchemasType extends Record<string, AnySchema> = Record<never, never>,
    ThisOutputType = InputType,
    SubEntitiesOutputType extends Record<string, Record<string, any>> = Record<never, never>
> {
    idProp: IdProp;
    nameProp: NameProp;
    props: PropsType;
    schemas: SchemasType;

    constructor(id: IdProp, name: NameProp, props: PropsType, schemas: SchemasType) {
        this.idProp = id;
        this.nameProp = name;
        this.props = props;
        this.schemas = schemas;
    }

    name<N extends (string extends N ? never : string)>(name: N): EntityBuilder<
        InputType,
        IdProp,
        N,
        PropKeys,
        PropValues,
        PropsType,
        SchemasType,
        ThisOutputType,
        SubEntitiesOutputType
    > {
        return new EntityBuilder<
            InputType,
            IdProp,
            N,
            PropKeys,
            PropValues,
            PropsType,
            SchemasType,
            ThisOutputType,
            SubEntitiesOutputType
        >(this.idProp, name, this.props, this.schemas);
    }

    id<I extends (ValidKey & keyof InputType)>(idProp: InputType extends NormalizableEntity<I> ? I : never):
    EntityBuilder<
        InputType,
        I,
        NameProp,
        PropKeys,
        PropValues,
        PropsType,
        SchemasType,
        ThisOutputType,
        SubEntitiesOutputType
    > {
        return new EntityBuilder<
            InputType,
            I,
            NameProp,
            PropKeys,
            PropValues,
            PropsType,
            SchemasType,
            ThisOutputType,
            SubEntitiesOutputType
        >(idProp, this.nameProp, this.props, this.schemas);
    }

    prop<PropName extends string & keyof InputType, PropType extends (string extends PropType ? never : string)>
    (propName: PropName, propType: ValidSchemaProp<PropType>):
    EntityBuilder<
        InputType,
        IdProp,
        NameProp,
        PropKeys | PropName,
        PropValues | PropType,
        PropsType & { [k in PropName]: typeof propType },
        SchemasType,
        Omit<InputType, PropKeys | PropName>,
        SubEntitiesOutputType
    > {
        return new EntityBuilder<
            InputType,
            IdProp,
            NameProp,
            PropKeys | PropName,
            PropValues | PropType,
            PropsType & { [k in PropName]: typeof propType },
            SchemasType,
            Omit<InputType, PropKeys | PropName>,
            SubEntitiesOutputType
        >(
            this.idProp,
            this.nameProp,
            { ...this.props, [propName]: propType },
            this.schemas
        );
    }

    define<EntityName extends PropValues, SchemaType extends AnySchema>(entityName: EntityName, schema: SchemaType):
    EntityBuilder<
        InputType,
        IdProp,
        NameProp,
        PropKeys,
        PropValues,
        PropsType,
        SchemasType & { [k in EntityName]: SchemaType},
        ThisOutputType,
        SubEntitiesOutputType & ExtractSchemaOutputType<SchemaType>
    > {
        return new EntityBuilder<
            InputType,
            IdProp,
            NameProp,
            PropKeys,
            PropValues,
            PropsType,
            SchemasType & { [k in EntityName]: SchemaType},
            ThisOutputType,
            SubEntitiesOutputType & ExtractSchemaOutputType<SchemaType>
        >(
            this.idProp,
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
    InputType extends NormalizableEntity<IdProp>,
    IdProp extends ValidKey,
    NameProp extends (string extends NameProp ? never : string),
    PropKeys extends string & keyof InputType,
    PropValues extends string,
    PropsType extends Record<string, ValidSchemaProp<string>>,
    SchemasType extends Record<string, AnySchema>,
    ThisOutputType,
    SubEntitiesOutputType extends Record<string, Record<string, any>>
> = [PropValues] extends [keyof SchemasType | NameProp] ? EntityBuilder<InputType, IdProp, NameProp, PropKeys, PropValues, PropsType, SchemasType, ThisOutputType, SubEntitiesOutputType> : never;

export function entity<T>(): EntityBuilder<T, null, null, never, never, Record<never, never>> {
    return new EntityBuilder<T, null, null, never, never, Record<never, never>>(null, null, {}, {});
}

export function build<
    InputType extends NormalizableEntity<IdProp>,
    IdProp extends ValidKey,
    NameProp extends (string extends NameProp ? never : string),
    PropKeys extends string & keyof InputType,
    PropValues extends (string extends PropValues ? never : string),
    PropsType extends Record<string, ValidSchemaProp<string>>,
    SchemasType extends Record<string, AnySchema>,
    BuilderOutputType,
    SubEntitiesOutputType extends Record<string, Record<string, any>>
>(
    builder: CompleteEntityBuilder<InputType, IdProp, NameProp, PropKeys, PropValues, PropsType, SchemasType, BuilderOutputType, SubEntitiesOutputType>,
): EntitySchema<
    InputType,
    IdProp,
    NameProp,
    PropsType,
    SchemasType,
    SubEntitiesOutputType & { [k in NameProp]: Record<string, BuilderOutputType> }
> {
    return new EntitySchema<
        InputType,
        IdProp,
        NameProp,
        PropsType,
        SchemasType,
        SubEntitiesOutputType & { [k in NameProp]: Record<string, BuilderOutputType> }
    >(builder.nameProp, builder.idProp, builder.props, builder.schemas);
}
