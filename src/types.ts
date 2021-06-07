export type NormalizationOutput<ResultType, Entities> = {
    result: ResultType,
    entities: Entities
};

export type ValidKey = string | number | symbol;

export type ValueOf<T> = T[keyof T];
