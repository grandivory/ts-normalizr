import { EntitySchema, EntityBuilder } from "./Entity";
import { identity } from "./utils/identity";

export function entity(processFunction) {
  if (!processFunction) {
    return new EntityBuilder(null, null, {}, {}, identity);
  }

  return new EntityBuilder(null, null, {}, {}, processFunction);
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
