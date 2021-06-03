export type NormalizationOutput<ResultType, Entities> = {
    result: ResultType,
    entities: Entities
};

export type ValidKey = string | number | symbol;

export type StringLiteral<T extends string> = string extends T ? never : T;
