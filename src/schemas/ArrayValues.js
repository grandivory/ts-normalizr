import { PropBuilder } from "../types.ts";
import { mergeRecursive } from "../utils/mergeRecursive";

export class ArrayValuesSchema {
  nameProp;
  entitySchema;

  constructor(entitySchema) {
    this.nameProp = entitySchema.nameProp;
    this.entitySchema = entitySchema;
  }

  normalizeWith(input, parent, objectKey) {
    if (!Array.isArray(input)) {
      throw new Error('Cannot process non-array input type as array values');
    }

    return input.reduce(
      ({ result, "entities": currentEntities }, nextVal) => {
        const { "result": keyResult, "entities": keyEntities } = this.entitySchema.normalizeWith(nextVal, parent, objectKey);

        return {
          "result": result.concat([keyResult]),
          "entities": mergeRecursive(currentEntities, keyEntities)
        };
      }, {
        "result": [],
        "entities": {}
      }
    );
  }
}

export class ArrayValuesBuilder extends PropBuilder {

  build(schemas) {
    return new ArrayValuesSchema(schemas[this.schemaName]);
  }
}

export class ArrayValuesSchemaBuilder extends ArrayValuesBuilder {
  schema;

  constructor(input) {
    super(input.nameProp);
    this.schema = input;
  }

  basePropBuilder() {
    return new ArrayValuesBuilder(this.schemaName);
  }
}
