export function foo<T extends (string extends T ? never : string)>(arg: T): T {
  return arg;
}
