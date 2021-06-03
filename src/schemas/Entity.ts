import { NormalizationOutput, ValidKey } from "../types";

type NormalizableEntity<IdAttribute extends ValidKey> = {
    [key in IdAttribute]: ValidKey
};

class EntitySchema<Input extends NormalizableEntity<IdAttribute>, IdAttribute extends ValidKey, N extends (string extends N ? never : string)> {
    nameProp: N;
    idProp: IdAttribute;

    constructor(name: N, idProp: IdAttribute) {
        this.nameProp = name;
        this.idProp = idProp;
    }

    normalize(
        input: Input
    ): NormalizationOutput<Input[IdAttribute], Record<N, Record<string, Input>>> {
        return {
            "result": input[this.idProp],
            "entities": {
                [this.nameProp]: {
                    [input[this.idProp]]: input
                }
            } as Record<N, Record<string, Input>>
        };
    }
}

interface Name<N extends (string extends N ? never : string)> {
    nameProp: N
}

interface Id<T, I extends ValidKey & keyof T> {
    idProp: I
}

export class EntityBuilder<T> {
    name<N extends (string extends N ? never : string)>(name: N): this & Name<typeof name> {
        return Object.assign(Object.create(Object.getPrototypeOf(this)) as this, this, {
            "nameProp": name
        });
    }

    id<I extends ValidKey & keyof T>(idProp: T extends NormalizableEntity<I> ? I : never): this & Id<T, I> {
        return Object.assign(Object.create(Object.getPrototypeOf(this)) as this, this, {
            "idProp": idProp
        });
    }
}

type CompleteEntityBuilder<
    T extends NormalizableEntity<I>,
    I extends ValidKey,
    N extends (string extends N ? never : string)
> = EntityBuilder<T> & Id<T, I> & Name<N>;

export function entity<T>(): EntityBuilder<T> {
    return new EntityBuilder<T>();
}

export function build<
    T extends NormalizableEntity<I>,
    I extends ValidKey,
    N extends (string extends N ? never : string)>(
        builder: CompleteEntityBuilder<T, I, N>
): EntitySchema<T, I, N> {
    return new EntitySchema<T, I, N>(builder.nameProp, builder.idProp);
}
