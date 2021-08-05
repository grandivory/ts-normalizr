import { ArrayValuesBuilder, ArrayValuesSchemaBuilder } from "./schemas/ArrayValues";
import { EntityBuilder, EntitySchema } from "./schemas/Entity";
import { ObjectValuesBuilder, ObjectValuesSchemaBuilder } from "./schemas/ObjectValues";
import { AnySchema, ValidKey, ValidSchemaProp } from "./types";

type IdFunction<T> = (input: T, parent: unknown, key: string | undefined) => string;

type ProcessFunction<I, O> = (input: I, parent: unknown, key: string | undefined) => O;

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

export function arrayValues<T extends string>(input: T): ArrayValuesBuilder<T>;
export function arrayValues<T extends string, S extends EntitySchema<any, any, T, any, any>>(input: S & EntitySchema<any, any, T, any, any>): ArrayValuesSchemaBuilder<T, S>;

export function objectValues<T extends string>(input: T): ObjectValuesBuilder<T>;
export function objectValues<T extends string, S extends EntitySchema<any, any, T, any, any>>(input: S & EntitySchema<any, any, T, any, any>): ObjectValuesSchemaBuilder<T, S>;

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
  {[k in keyof PropsType | NameProp]: AnySchema},
  SubEntitiesOutputType & { [k in NameProp]: Record<string, BuilderOutputType> }
>;
