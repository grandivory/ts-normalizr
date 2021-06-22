import { EntitySchema, EntityBuilder } from "./schemas/Entity";
import { ArrayValuesBuilder, ArrayValuesSchemaBuilder } from "./schemas/ArrayValues";
import { identity } from "./utils/identity";
import { ObjectValuesBuilder, ObjectValuesSchemaBuilder } from "./schemas/ObjectValues";

export function entity(processFunction) {
  if (!processFunction) {
    return new EntityBuilder(null, null, {}, {}, identity);
  }

  return new EntityBuilder(null, null, {}, {}, processFunction);
}

export function arrayValues(schemaType) {
  if (typeof schemaType === 'string') {
    return new ArrayValuesBuilder(schemaType);
  }

  return new ArrayValuesSchemaBuilder(schemaType);
}

export function objectValues(schemaType) {
  if (typeof schemaType === 'string') {
    return new ObjectValuesBuilder(schemaType);
  }

  return new ObjectValuesSchemaBuilder(schemaType);
}

export function buildSchema(builder) {
  return new EntitySchema(
    builder.nameProp,
    builder.idFunction,
    builder.props,
    builder.schemas,
    builder.processFunction
  );
}
