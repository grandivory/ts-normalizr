import { ValidKey } from '../types';

export function mergeRecursive<T extends Record<ValidKey, any>>(a: T, b: T): T {
  const result: T = Object.assign(Object.create(Object.getPrototypeOf(a)), a) as T;

  for (const key in b) {
    if (!result[key]) result[key] = b[key];

    if (Array.isArray(result[key])) {
      if (!Array.isArray(b[key])) throw new Error('The two entities have mismatched structures and cannot be merged.');

      result[key] = b[key];
    } else if (typeof result[key] === 'object') {
      if (typeof b[key] !== 'object') throw new Error('The two entities have mismatched structures and cannot be merged.');

      result[key] = mergeRecursive(result[key], b[key]);
    } else {
      result[key] = b[key];
    }
  }

  return result;
}
