import { PropBuilder } from "../types.ts";
import { mergeRecursive } from "../utils/mergeRecursive";

export class EntitySchema {
  nameProp;
  idFunction;
  processFunction;
  props;

  constructor(name, idFunction, props, schemas, processFunction) {
    this.nameProp = name;
    this.idFunction = idFunction;
    this.processFunction = processFunction;

    const allSchemas = {
      ...schemas,
      [name]: this
    };

    // Convert the props into valid schemas
    const schemaProps = Object.entries(props).reduce(
      (propsObject, [nextKey, nextValue]) => {

        if (typeof nextValue === 'string') {
          return {
            ...propsObject,
            [nextKey]: allSchemas[nextValue]
          };
        }

        return {
          ...propsObject,
          [nextKey]: nextValue.build(allSchemas)
        };
      },
      {}
    );

    this.props = schemaProps;
  }

  normalizeWith(input, parent, objectKey) {
    // Initialize the entities object to ensure that all entity types are defined, even if empty
    const baseEntities = Object.values(this.props).reduce(
      (entities, nextSchema) => ({
        ...entities,
        [nextSchema.nameProp]: {}
      }),
      {}
    );


    const processedInput = this.processFunction(input, parent, objectKey);

    const { "entities": subEntities, processedObject } = Object.entries(processedInput).reduce(
      ({ entities, "processedObject": partialObject }, [inputKey, inputValue]) => {
        if (inputKey in this.props) {
          const schema = this.props[inputKey];

          const { "result": propResult, "entities": propEntities } =
            schema.normalizeWith(inputValue, processedInput, inputKey);

          // merge the current entities with the results of the normalize
          return {
            "entities": mergeRecursive(entities, propEntities),
            "processedObject": {
              ...partialObject,
              [inputKey]: propResult
            }
          };
        }

        return {
          entities,
          "processedObject": {
            ...partialObject,
            [inputKey]: inputValue
          }
        };
      },
      {
        "entities": baseEntities, "processedObject": {}
      }
    );

    const thisId = this.idFunction(processedInput, parent, objectKey);

    return {
      "result": thisId,
      "entities": mergeRecursive(subEntities, {
        [this.nameProp]: {
          [thisId]: processedObject
        }
      })
    };
  }

  normalize(input) {
    return this.normalizeWith(input, null);
  }

  normalizeManyWith(input, parent, objectKey) {
    const inputs = (() => {
      if (Array.isArray(input)) {
        return input.map(x => [objectKey, x]);
      } else if (typeof input === 'object') {
        return Object.entries(input);
      }

      throw new Error('Cannot process `normalizeMany` with a scalar input type');
    })();

    return inputs.reduce(
      ({ result, "entities": currentEntities }, [nextKey, nextVal]) => {
        const { "result": keyResult, "entities": keyEntities } = this.normalizeWith(nextVal, parent, nextKey);

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

  normalizeMany(input) {
    return this.normalizeManyWith(input, null);
  }
}

export class EntityBuilder {
  nameProp;
  idFunction;
  processFunction;
  props;
  schemas;

  constructor(id, name, props, schemas, processFunction) {
    this.idFunction = id;
    this.nameProp = name;
    this.props = props;
    this.schemas = schemas;
    this.processFunction = processFunction;
  }

  name(name) {
    return new EntityBuilder(this.idFunction, name, this.props, this.schemas, this.processFunction);
  }

  id(id) {
    if (typeof id === 'function') {
      return new EntityBuilder(id, this.nameProp, this.props, this.schemas, this.processFunction);
    }

    return new EntityBuilder(
      (input) => `${input[id]}`, this.nameProp, this.props, this.schemas, this.processFunction
    );
  }

  prop(propName, propValue) {
    const [updatedProps, updatedSchemas] = (() => {
      if (propValue instanceof EntitySchema) {
        return [
          { ...this.props, [propName]: propValue.nameProp },
          {
            ...this.schemas,
            [propValue.nameProp]: propValue
          }
        ];
      } else if (propValue instanceof PropBuilder) {
        if (propValue.schema) {
          return [
            // Remove the schema from the PropBuilder, and use just the name...
            { ...this.props, [propName]: propValue.basePropBuilder() },
            // ...then put the schema back into the schemas object
            { ...this.schemas, [propValue.schemaName]: propValue.schema }
          ];
        }

        return [
          { ...this.props, [propName]: propValue },
          this.schemas
        ];
      }

      return [
        { ...this.props, [propName]: propValue },
        this.schemas
      ];
    })();

    return new EntityBuilder(
      this.idFunction,
      this.nameProp,
      updatedProps,
      updatedSchemas,
      this.processFunction
    );
  }

  define(schema) {
    return new EntityBuilder(
      this.idFunction,
      this.nameProp,
      this.props,
      {
        ...this.schemas,
        [schema.nameProp]: schema
      },
      this.processFunction
    );
  }
}
