import { NormalizationOutput, ValidKey, ValueOf } from "./types";

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

declare class EntitySchema<
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

type ExtractNameFromSchema<T> = T extends EntitySchema<any, any, infer N, any, any, any> ? N : never;

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
    PropValues | ExtractNameFromSchema<SchemaType>,
    PropsType & { [k in PropName]: ExtractNameFromSchema<SchemaType> },
    SchemasType & {
      [k in ExtractNameFromSchema<SchemaType>]: SchemaType
    },
    Omit<InputType, PropKeys | PropName>,
    SubEntitiesOutputType & ExtractSchemaOutputType<SchemaType>
  >

  define<EntityName extends PropValues, SchemaType extends EntitySchema<any, any, EntityName, any, any, any>>
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
> = [PropValues] extends [keyof SchemasType | NameProp] ?
  EntityBuilder<InputType, ProcessedType, IdType, NameProp, PropKeys, PropValues, PropsType, SchemasType, ThisOutputType, SubEntitiesOutputType> :
  never;

export function entity<T>(): EntityBuilder<T, T, null, null, never, never, Record<never, never>>;

export function entity<T, P>(processFunction: ProcessFunction<T, P>):
EntityBuilder<T, P, null, null, never, never, Record<never, never>>;

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
>;
