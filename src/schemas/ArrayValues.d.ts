import { NormalizationOutput, Schema, SchemaPropBuilder, ValidKey , PropBuilder } from "../types";
import { EntitySchema } from "./Entity";

export class ArrayValuesSchema<
  Input extends Record<ValidKey, any>,
  Name extends string,
  EntitiesOutput extends Record<string, Record<string, any>>
> implements Schema<Input, Name, string[], EntitiesOutput> {
  nameProp: Name;
  entitySchema: EntitySchema<any, any, Name, any, EntitiesOutput>;

  constructor(entitySchema: EntitySchema<any, any, Name, any, EntitiesOutput>)

  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  normalizeWith(input: Input, parent: any): NormalizationOutput<string[], EntitiesOutput>
}

export class ArrayValuesBuilder<T extends string>
  extends PropBuilder<T, string[]> {}

export class ArrayValuesSchemaBuilder<T extends string, S extends EntitySchema<any, any, T, any, any>> extends ArrayValuesBuilder<T> implements SchemaPropBuilder<T, string[], S> {
  schema: S;

  constructor(input: S)
  basePropBuilder(): ArrayValuesBuilder<T>;
}
