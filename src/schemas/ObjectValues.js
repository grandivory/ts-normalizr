import { PropBuilder } from "../types.ts";
import { mergeRecursive } from "../utils/mergeRecursive";

export class ObjectValuesSchema {
  nameProp;
  entitySchema;

  constructor(entitySchema) {
    this.nameProp = entitySchema.nameProp;
    this.entitySchema = entitySchema;
  }

  normalizeWith(input, parent) {
    if (typeof input !== 'object') {
      throw new Error('Cannot process non-object input type as object values');
    }

    return Object.entries(input).reduce(
      ({ result, "entities": currentEntities }, [nextKey, nextVal]) => {
        const { "result": keyResult, "entities": keyEntities } =
          this.entitySchema.normalizeWith(nextVal, parent, nextKey);

        return {
          "result": { ...result, [nextKey]: keyResult },
          "entities": mergeRecursive(currentEntities, keyEntities)
        };
      }, {
        "result": {},
        "entities": {}
      }
    );
  }
}

export class ObjectValuesBuilder extends PropBuilder {
  build(schemas) {
    return new ObjectValuesSchema(schemas[this.schemaName]);
  }
}

export class ObjectValuesSchemaBuilder extends ObjectValuesBuilder {
  schema;

  constructor(input) {
    super(input.nameProp);
    this.schema = input;
  }

  basePropBuilder() {
    return new ObjectValuesBuilder(this.schemaName);
  }
}
