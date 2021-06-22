import { EntitySchema } from "./schemas/Entity";

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
export class PropBuilder<SchemaName extends string> {
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
  >(schemas: Record<SchemaName, S>): Schema<InputType, SchemaName, any, EntitiesOutput> {
    throw new Error("Method not implemented.");
  }
}

export interface SchemaPropBuilder<
  SchemaName extends string,
  SchemaType extends EntitySchema<any, any, SchemaName, any, any>
> extends PropBuilder<SchemaName> {
  schema: SchemaType;

  basePropBuilder(): PropBuilder<SchemaName>
}

// This can be extended later as more schema types are added (arrays, objects, multi-value schemas, etc.)
export type ValidSchemaProp<T extends string> = T | PropBuilder<T> | SchemaPropBuilder<T, any>;

export type ExtractSchemaNames<T extends AnySchema> = T extends Schema<any, infer N, any, any> ? N : never;

export type AnySchema = Schema<any, any, any, any>;
