/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable jest/expect-expect */
import { arrayValues, buildSchema, entity, objectValues } from ".";
import { NormalizationResultType } from "./types";

describe('Entity normalization', () => {
  it('normalizes an entity', () => {
    interface Basic {
      id: number
    }
    const entityBuilder = entity<Basic>().id('id').name('items');
    const schema = buildSchema(entityBuilder);
    expect(schema.normalize({ "id": 1 })).toEqual({
      "result": '1',
      "entities": {
        "items": { "1": { "id": 1 } }
      }
    });
  });
  it('allows for other entities to be added', () => {
    interface User {
      name: string
    }
    interface Post {
      id: number
      title: string
      author: User
    }

    const userBuilder = entity<User>().id('name').name('users');
    const userSchema = buildSchema(userBuilder);

    const postBuilder = entity<Post>()
    .id('id')
    .name('posts')
    .prop('author', userSchema);
    const postSchema = buildSchema(postBuilder);

    const testPost = {
      "id": 1,
      "title": 'Test Post',
      "author": {
        "name": 'Jack'
      }
    };

    const output: {
      result: string,
      entities: {
        posts: Record<string, Omit<Post, 'author'> & { author: string }>,
        users: Record<string, User>
      }
    } = postSchema.normalize(testPost);

    expect(output).toEqual({
      "result": '1',
      "entities": {
        "posts": {
          "1": { "id": 1, "title": 'Test Post', "author": 'Jack'}
        },
        'users': {
          'Jack': { "name": 'Jack' }
        }
      }
    });
  });
  it('allows for recursive schemas', () => {
    interface User {
      name: string
      bestFriend?: User
    }

    const testUser = {
      "name": 'Jack',
      "bestFriend": {
        "name": 'Jill'
      }
    };

    const userBuilder = entity<User>()
    .id('name')
    .name('users')
    .prop('bestFriend', 'users');
    const userSchema = buildSchema(userBuilder);

    expect(userSchema.normalize(testUser)).toEqual({
      "result": 'Jack',
      "entities": {
        "users": {
          'Jack': {"name": 'Jack', "bestFriend": 'Jill'},
          'Jill': {"name": 'Jill'}
        }
      }
    });
  });
  it('allows for array and object attributes', () => {
    interface Post {
      id: number
      title: string
    }

    interface User {
      name: string
      posts: Post[]
      bestPosts: Record<string, Post>
    }

    const testUser = {
      "name": 'Jack',
      "posts": [
        {
          "id": 1,
          "title": 'Test Post 1'
        },
        {
          "id": 2,
          "title": 'Test Post 2'
        }
      ],
      "bestPosts": {
        "stuff": {
          "id": 3,
          "title": 'Test Post 3'
        }
      }
    };

    const postBuilder = entity<Post>().id('id').name('posts');
    const postSchema = buildSchema(postBuilder);

    const userBuilder = entity<User>()
      .id('name')
      .name('users')
      .prop('posts', arrayValues(postSchema))
      .prop('bestPosts', objectValues('posts'));
    const userSchema = buildSchema(userBuilder);

    const result: {
      result: string,
      entities: {
        users: Record<string, Omit<User, 'posts' | 'bestPosts'> & { posts: string[], bestPosts: Record<string, NormalizationResultType>}>,
        posts: Record<string, Post>,
      }
    } = userSchema.normalize(testUser);

    expect(result).toEqual({
      "result": 'Jack',
      "entities": {
        "users": {
          'Jack': {"name": 'Jack', "posts": ['1', '2'], "bestPosts": { "stuff": '3' } },
        },
        "posts": {
          "1": {"id": 1, "title": 'Test Post 1'},
          "2": {"id": 2, "title": 'Test Post 2'},
          "3": {"id": 3, "title": 'Test Post 3'}
        }
      }
    });
  });
  it('allows for empty entities', () => {
    interface User {
      name: string
      favoriteFood?: Food
    }

    interface Food {
      name: string
    }

    const testUser = {
      "name": 'Jack'
    };

    const foodSchema = buildSchema(
      entity<Food>().id('name').name('foods')
    );
    const userSchema = buildSchema(
      entity<User>().id('name').name('users')
        .prop('favoriteFood', 'foods')
        .define(foodSchema)
    );
    const { entities } = userSchema.normalize(testUser);

    expect(entities.foods).toEqual({});
  });

  describe('idAttribute', () => {
    interface Test {
      foo: string
      bar: string
    }
    it('can compute an id', () => {
      const testBuilder = entity<Test>()
        .name('tests')
        .id((input: Test) => input.foo + input.bar);
      const testSchema = buildSchema(testBuilder);

      const test = {
        "foo": 'baz',
        "bar": 'qux'
      };

      expect(testSchema.normalize(test)).toEqual({
        "result": 'bazqux',
        "entities": {
          "tests": {
            'bazqux': { "foo": 'baz', "bar": 'qux' }
          }
        }
      });
    });

    it('can build the entity\'s ID from the parent object', () => {
      interface TestHolder {
        id: number
        a: Test
        b: Test
      }

      const testBuilder = entity<Test>()
        .name('tests')
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        .id((input: Test, parent: any) => ['string', 'number'].includes(typeof parent.id) ?
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            `${parent.id as string}${input.foo}` :
            input.foo
        );
      const testSchema = buildSchema(testBuilder);

      const holderBuilder = entity<TestHolder>()
        .name('holders')
        .id('id')
        .prop('a', 'tests')
        .prop('b', 'tests')
        .define(testSchema);
      const holderSchema = buildSchema(holderBuilder);

      const test = {
        "foo": 'baz',
        "bar": 'qux'
      };
      const holder = {
        "id": 42,
        "a": test,
        "b": test
      };

      expect(holderSchema.normalize(holder)).toEqual({
        "result": '42',
        "entities": {
          'holders': {
            '42': {
              "id": 42,
              "a": '42baz',
              "b": '42baz'
            }
          },
          'tests': {
            '42baz': { "foo": 'baz', "bar": 'qux' },
          }
        }
      });
    });

    it('can normalize entity IDs based on their object key', () => {
      interface TestHolder {
        id: number
        a: Test
        b: Test
      }

      const testBuilder = entity<Test>()
        .name('tests')
        .id((input: Test, _parent: any, key: string | undefined) => key ? key + input.foo : input.foo);
      const testSchema = buildSchema(testBuilder);

      const holderBuilder = entity<TestHolder>()
        .name('holders')
        .id('id')
        .prop('a', 'tests')
        .prop('b', 'tests')
        .define(testSchema);
      const holderSchema = buildSchema(holderBuilder);

      const test = {
        "foo": 'baz',
        "bar": 'qux'
      };
      const holder = {
        "id": 42,
        "a": test,
        "b": test
      };

      expect(holderSchema.normalize(holder)).toEqual({
        "result": '42',
        "entities": {
          'holders': {
            '42': {
              "id": 42,
              "a": 'abaz',
              "b": 'bbaz'
            }
          },
          'tests': {
            'abaz': { "foo": 'baz', "bar": 'qux' },
            'bbaz': { "foo": 'baz', "bar": 'qux' }
          }
        }
      });
    });
  });
  describe('mergeStrategy', () => {
    it('defaults to plain object merging', () => {});
    it('can use a custom merging strategy', () => {});
  });
  describe('processStrategy', () => {
    interface I {
      id: number
    }
    it('can use a custom processing strategy', () => {
      const processFunction = (i: I) => ({
          "foo": `${i.id}`
      });
      const iBuilder = entity(processFunction)
        .id('foo')
        .name('i');
      const iSchema = buildSchema(iBuilder);

      const testInput = {
        "id": 42
      };

      expect(iSchema.normalize(testInput)).toEqual({
        "result": '42',
        "entities": {
          "i": {
            '42': { "foo": '42' }
          }
        }
      });
    });
    it('can use information from the parent in the process strategy', () => {
      const processFunction = (i: I, parent: any, key: string | undefined) => ({
        "foo": `${i.id}`,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        "pid": parent.id ? parent.id as string : null,
        "pkey": key
      });
      const iBuilder = entity(processFunction)
        .id('foo')
        .name('i');
      const iSchema = buildSchema(iBuilder);

      interface P {
        id: string
        foo: I
      }

      const pBuilder = entity<P>()
        .id('id')
        .name('p')
        .prop('foo', iSchema);
      const pSchema = buildSchema(pBuilder);

      const testInput = {
        "id": 'test',
        "foo": {
          "id": 42
        }
      };

      expect(pSchema.normalize(testInput)).toEqual({
        "result": 'test',
        "entities": {
          'p': {
            'test': { "id": 'test', "foo": '42'}
          },
          'i': {
            '42': { "foo": '42', "pid": 'test', "pkey": 'foo'}
          }
        }
      });
    });
  });
});

describe('Entity denormalization', () => {
  it('denormalizes an entity', () => {});
  it('denormalizes deep entities', () => {});
  it('denormalizes to undefined for missing data', () => {});
  it('denormalizes deep entities with records', () => {});
  it('denormalizes recursive dependencies', () => {});
  it('can denormalize already partially denormalized data', () => {});
  it('denormalizes entities with referential equality', () => {});
  it('denormalizes with fallback strategy', () => {});
});

describe('Entity Builder', () => {
  interface Entity {
    id: string;
    index: number;
  }

  it('can set an ID prop that exists on its entity type', () => {
    const idEntity = entity<Entity>().id('id');
    const indexEntity = entity<Entity>().id('index');

    const testEntity = {
      "id": 'foo',
      "index": 42
    };

    expect(idEntity.idFunction(testEntity, null, undefined)).toBe('foo');
    expect(indexEntity.idFunction(testEntity, null, undefined)).toBe('42');
  });

  it('can set any name for the entity', () => {
    const fooEntity: {nameProp: 'foo'} = entity<Entity>().name('foo');
    const jarbledEntity: {nameProp: '/$%*(&@^\\'} = entity<Entity>().name('/$%*(&@^\\');

    expect(fooEntity.nameProp).toBe('foo');
    expect(jarbledEntity.nameProp).toBe('/$%*(&@^\\');
  });

  it('can set a name twice, overriding the original', () => {
    const entityBuilder = entity<Entity>().id('id').name('foo').name('bar');
    const entitySchema = buildSchema(entityBuilder);
    expect(entitySchema.nameProp).toBe('bar');
  });

  it('can set name and ID in either order', () => {
    const nameFirst = entity<Entity>().name('foo').id('id');
    const idFirst = entity<Entity>().id('index').name('bar');

    const testEntity = {
      "id": 'foo',
      "index": 42
    };

    expect(nameFirst.idFunction(testEntity, null, undefined)).toBe('foo');
    expect(nameFirst.nameProp).toBe('foo');

    expect(idFirst.idFunction(testEntity, null, undefined)).toBe('42');
    expect(idFirst.nameProp).toBe('bar');
  });

  it('can build from a complete builder', () => {
    const entityBuilder = entity<Entity>().id('id').name('foo');
    const schema = buildSchema(entityBuilder);

    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(schema.normalize).toBeDefined();
  });

  it('cannot build from an incomplete builder', () => {
    const noInfo = entity<Entity>();
    const idOnly = entity<Entity>().id('id');
    const missingSchemas = entity<Entity>().id('id').name('entities').prop('index', 'undefined');

    // @ts-expect-error Cannot build from an incomplete builder
    buildSchema(noInfo);
    // @ts-expect-error Cannot build from an incomplete builder
    buildSchema(idOnly);
    // @ts-expect-error Cannot build from an incomplete builder
    buildSchema(missingSchemas);
  });
});
/* eslint-enable @typescript-eslint/no-empty-function */
/* eslint-enable jest/expect-expect */
