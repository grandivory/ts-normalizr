import { EntitySchema, ExtractSchemaOutputType } from "./schemas/Entity";

export type NormalizationResultType = string | string[] | NormalizationResultObject;

interface NormalizationResultObject extends Record<string, NormalizationResultType> {}

export type NormalizationOutput<ResultType, Entities> = {
  result: ResultType,
  entities: Entities
};

export type ValidKey = string | number | symbol;

export type ValueOf<T> = T[keyof T];

export interface Schema<
  Input extends Record<ValidKey, any>,
  Name extends string,
  ResultType extends NormalizationResultType,
  EntitiesOutput extends Record<string, Record<string, any>>
> {
  nameProp: Name;

  normalizeWith(
    input: Input,
    parent: any,
    objectKey: string | undefined
  ): NormalizationOutput<ResultType, EntitiesOutput>
}

export type ExtractSchemaResultType<T extends AnySchema> = T extends Schema<any, any, infer R, any> ? R : never;

export class PropBuilder<SchemaName extends string, ResultType extends NormalizationResultType> {
  schemaName: SchemaName;

  constructor(input: SchemaName) {
    this.schemaName = input;
  }

  // eslint-disable-next-line class-methods-use-this
  build<
    InputType extends Record<ValidKey, any>,
    EntitiesOutput extends Record<string, Record<string, any>>,
    S extends EntitySchema<InputType, any, SchemaName, any, EntitiesOutput>
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  >(schemas: Record<SchemaName, S>): Schema<InputType, SchemaName, ResultType, EntitiesOutput> {
    throw new Error("Method not implemented.");
  }
}

export type ExtractPropBuilderResultType<T extends PropBuilder<any, any>> =
  T extends PropBuilder<any, infer R> ? R : never;

export interface SchemaPropBuilder<
  SchemaName extends string,
  ResultType extends NormalizationResultType,
  SchemaType extends EntitySchema<any, any, SchemaName, any, any>
> extends PropBuilder<SchemaName, ResultType> {
  schema: SchemaType;

  basePropBuilder(): PropBuilder<SchemaName, ResultType>
}

export type ExtractSchemaPropResultType<T extends SchemaPropBuilder<any, any, any>> =
  T extends SchemaPropBuilder<any, infer R, any> ? R : never;

export type ExtractSchemaPropOutputType<T extends SchemaPropBuilder<any, any, any>> =
  T extends SchemaPropBuilder<any, any, infer S> ?
  ExtractSchemaOutputType<S> :
  never;

export type ValidSchemaProp<T extends string> = T | PropBuilder<T, any> | SchemaPropBuilder<T, any, any>;

export type ExtractSchemaNames<T extends AnySchema> = T extends Schema<any, infer N, any, any> ? N : never;

export type AnySchema = Schema<any, any, any, any>;
