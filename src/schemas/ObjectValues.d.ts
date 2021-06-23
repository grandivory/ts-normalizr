import { NormalizationOutput, Schema, SchemaPropBuilder, ValidKey , PropBuilder } from "../types";
import { EntitySchema } from "./Entity";

export class ObjectValuesSchema<
  Input extends Record<ValidKey, any>,
  Name extends string,
  EntitiesOutput extends Record<string, Record<string, any>>
> implements Schema<Input, Name, Record<string, string>, EntitiesOutput> {
  nameProp: Name;
  entitySchema: EntitySchema<any, any, Name, any, EntitiesOutput>;

  constructor(entitySchema: EntitySchema<any, any, Name, any, EntitiesOutput>)

  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  normalizeWith(input: Input, parent: any): NormalizationOutput<Record<string, string>, EntitiesOutput>
}

export class ObjectValuesBuilder<T extends string>
  extends PropBuilder<T, Record<string, string>> {}

export class ObjectValuesSchemaBuilder<T extends string, S extends EntitySchema<any, any, T, any, any>> extends ObjectValuesBuilder<T> implements SchemaPropBuilder<T, Record<string, string>, S> {
  schema: S;

  constructor(input: S)
  basePropBuilder(): ObjectValuesBuilder<T>;
}
