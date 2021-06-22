import { ValidKey } from "../types";

export function mergeRecursive<T extends Record<ValidKey, any>>(a: T, b: T): T;
