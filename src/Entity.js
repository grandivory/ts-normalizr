import { mergeRecursive } from "./utils/mergeRecursive";

/**
 * @class EntitySchema
 * @property {string} nameProp The name that will be used for normalized entities of this type
 * @property {Function} idFunction A function used to get the ID value for a single entity
 * @property {Function} processFunction A function used to convert the input type before normalizing
 * @property {Object<string, string>} props A map of properties of the entity type to the names of other schemas
 * @property {Object<string, EntitySchema>} schemas A map of the names of other schemas to their schema classes
 */
export class EntitySchema {
  /**
   * @type {string}
   */
  nameProp;
  /**
   * @type {Function}
   */
  idFunction;
  /**
   * @type {Function}
   */
  processFunction;
  /**
   * @type {Object<string, string>}
   */
  props;
  /**
   * @type {Object<string, EntitySchema>}
   */
  schemas;

  constructor(name, idFunction, props, schemas, processFunction) {
    this.nameProp = name;
    this.idFunction = idFunction;
    this.props = props;
    this.schemas = {
      ...schemas,
      [name]: this
    };
    this.processFunction = processFunction;
  }

  normalizeWith(input, parent, objectKey) {
    // Initialize the entities object to ensure that all entity types are defined, even if empty
    const baseEntities = Object.keys(this.schemas).reduce(
      (entities, nextKey) => ({
        ...entities,
        [nextKey]: {}
      }),
      {}
    );


    const processedInput = this.processFunction(input, parent, objectKey);

    const { "entities": subEntities, processedObject } = Object.entries(processedInput).reduce(
      ({ entities, "processedObject": partialObject }, [inputKey, inputValue]) => {
        if (inputKey in this.props) {
          const propType = this.props[inputKey];
          const schema = this.schemas[propType];

          let idResult, propEntities;

          if (Array.isArray(inputValue)) {
            ({ "result": idResult, "entities": propEntities } =
              schema.normalizeManyWith(inputValue, processedInput, inputKey));
          } else {
            ({ "result": idResult, "entities": propEntities } =
              schema.normalizeWith(inputValue, processedInput, inputKey));
          }

          // merge the current entities with the results of the normalize
          return {
            "entities": mergeRecursive(entities, propEntities),
            "processedObject": {
              ...partialObject,
              [inputKey]: idResult
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

/**
 * @class EntityBuilder
 * @property {Function} idFunction A function used to get the ID value for a single entity
 * @property {Function} processFunction A function used to convert the input type before normalizing
 * @property {string} nameProp The name that will be used for normalized entities of this type
 * @property {Object<string, string>} props A map of properties of the entity type to the names of other schemas
 * @property {Object<string, EntitySchema>} schemas A map of the names of other schemas to their schema classes
 */
export class EntityBuilder {
  /**
   * @type {string}
   */
  nameProp;
  /**
   * @type {Function}
   */
  idFunction;
  /**
   * @type {Function}
   */
  processFunction;
  /**
   * @type {Object<string, string>}
   */
  props;
  /**
   * @type {Object<string, EntitySchema>}
   */
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
      }

      return [{ ...this.props, [propName]: propValue }, this.schemas];
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
