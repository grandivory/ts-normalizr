import { IdFunction, ProcessFunction } from "..";
import { AnySchema, ExtractSchemaNames, ExtractSchemaPropOutputType, NormalizationOutput, PropBuilder, Schema, SchemaPropBuilder, ValidKey, ValidSchemaProp, ValueOf } from "../types";

type NormalizableEntity<IdAttribute extends ValidKey> = {
  [key in IdAttribute]: string | number
};

type ExtractSchemaOutputType<T extends AnySchema> =
  T extends Schema<any, any, any, infer O> ? O : never;

declare class EntitySchema<
  Input extends Record<ValidKey, any>,
  ProcessedType extends Record<ValidKey, any>,
  Name extends string,
  PropsType extends Record<string, AnySchema>,
  EntitiesOutput extends Record<ExtractSchemaNames<ValueOf<PropsType>> | Name, Record<string, any>>
> implements Schema<Input, Name, string, EntitiesOutput> {
  nameProp: Name;
  idFunction: IdFunction<Input>;
  processFunction: ProcessFunction<Input, ProcessedType>;
  props: PropsType;

  constructor(
    name: Name,
    idFunction: IdFunction<Input>,
    props: PropsType,
    schemas: Record<Exclude<ExtractSchemaNames<ValueOf<PropsType>>, Name>, AnySchema>,
    processFunction: ProcessFunction<Input, ProcessedType>
  )

  normalizeWith(
    input: Input,
    parent: any,
    objectKey: string | undefined
  ): NormalizationOutput<string, EntitiesOutput>

  normalize(input: Input): NormalizationOutput<string, EntitiesOutput>

  normalizeManyWith(input: Input[] | Record<any, Input>, parent: any, objectKey: string | undefined): NormalizationOutput<string[], EntitiesOutput>

  normalizeMany(input: Input[] | Record<any, Input>): NormalizationOutput<string[], EntitiesOutput>
}

declare class EntityBuilder<
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
  )

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
  >

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
  >

  id(idFunction: IdFunction<ProcessedType>): EntityBuilder<
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
  >

  prop<PropName extends string & keyof ProcessedType, PropType extends (string extends PropType ? never : string)>
  (propName: PropName, propType: ValidSchemaProp<PropType>): EntityBuilder<
    InputType,
    ProcessedType,
    IdType,
    NameProp,
    PropKeys | PropName,
    PropValues | PropType,
    PropsType & { [k in PropName]: PropType },
    SchemasType,
    Omit<InputType, PropKeys | PropName>,
    SubEntitiesOutputType
  >

  prop<PropName extends string & keyof ProcessedType, SchemaType extends AnySchema>
  (propName: PropName, propType: SchemaType): EntityBuilder<
    InputType,
    ProcessedType,
    IdType,
    NameProp,
    PropKeys | PropName,
    PropValues | ExtractSchemaNames<SchemaType>,
    PropsType & { [k in PropName]: ExtractSchemaNames<SchemaType> },
    SchemasType & {
      [k in ExtractSchemaNames<SchemaType>]: SchemaType
    },
    Omit<InputType, PropKeys | PropName>,
    SubEntitiesOutputType & ExtractSchemaOutputType<SchemaType>
  >

  prop<PropName extends string & keyof ProcessedType, SchemaName extends string, SchemaType extends EntitySchema<any, any, SchemaName, any, any>, PropType extends SchemaPropBuilder<SchemaName, SchemaType>>
  (propName: PropName, propType: PropType): EntityBuilder<
    InputType,
    ProcessedType,
    IdType,
    NameProp,
    PropKeys | PropName,
    PropValues | SchemaName,
    PropsType & { [k in PropName]: PropBuilder<SchemaName> },
    SchemasType & { [k in SchemaName]: SchemaType },
    Omit<InputType, PropKeys | PropName>,
    SubEntitiesOutputType & ExtractSchemaPropOutputType<PropType>
  >

  prop<PropName extends string & keyof ProcessedType, SchemaName extends string, PropType extends PropBuilder<SchemaName>>
  (propName: PropName, propType: PropType): EntityBuilder<
    InputType,
    ProcessedType,
    IdType,
    NameProp,
    PropKeys | PropName,
    PropValues | SchemaName,
    PropsType & { [k in PropName]: SchemaName },
    SchemasType,
    Omit<InputType, PropKeys | PropName>,
    SubEntitiesOutputType
  >

  define<EntityName extends PropValues, SchemaType extends EntitySchema<any, any, EntityName, any, any>>
  (schema: SchemaType):
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
  >
}
