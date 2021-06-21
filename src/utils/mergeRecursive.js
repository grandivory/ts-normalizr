export function mergeRecursive(a, b) {
  const result = Object.assign(Object.create(Object.getPrototypeOf(a)), a);

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
