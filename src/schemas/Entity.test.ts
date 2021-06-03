import { build, entity } from "./Entity";

/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable jest/expect-expect */
describe('Entity normalization', () => {
  it('normalizes an entity', () => {
    interface Basic {
        id: number
    }
    const entityBuilder = entity<Basic>().id('id').name('items');
    const schema = build(entityBuilder);
    expect(schema.normalize({ "id": 1 })).toEqual({
        "result": 1,
        "entities": {
            "items": { "1": { "id": 1 } }
        }
    });
  });
  it('allows for other entities to be added as keys', () => {
    // interface User {
    //   name: string
    // }
    // interface Post {
    //   id: number
    //   title: string
    //   author: User
    // }

    // const userBuilder = entity<User>().id('name').name('users');
    // const userSchema = build(userBuilder);

    // const postBuilder = entity<Post>().id('id').name('posts');
    // const postSchema = build(postBuilder);

    // const testPost = {
    //   "id": 1,
    //   "title": 'Test Post',
    //   "author": {
    //     "name": 'Jack'
    //   }
    // };

    // expect(postSchema.normalize(testPost)).toEqual({
    //   "result": 1,
    //   "entities": {
    //     "posts": {
    //       "1": { "id": 1, "title": 'Test Post', "author": 'Jack'}
    //     },
    //     'users': {
    //       'Jack': { "name": 'Jack', "bestFriend": 'Jill'},
    //       'Jill': { "name": 'Jill' }
    //     }
    //   }
    // });
  });
  it('allows for recursive schemas', () => {
    // interface User {
    //   name: string
    //   bestFriend?: User
    // }

    // const testUser = {
    //   "name": 'Jack',
    //   "bestFriend": {
    //     "name": 'Jill'
    //   }
    // };
  });

  describe('idAttribute', () => {
    it('can use a custom idAttribute', () => {});
    it('can normalize entity IDs based on their object key', () => {});
    it('can build the entity\'s ID from the parent object', () => {});
  });
  describe('mergeStrategy', () => {
    it('defaults to plain object merging', () => {});
    it('can use a custom merging strategy', () => {});
  });
  describe('processStrategy', () => {
    it('can use a custom processing strategy', () => {});
    it('can use information from the parent in the process strategy', () => {});
    it('is run before and passed to the schema normalization', () => {});
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
        const idEntity: {idProp: "id"} = entity<Entity>().id('id');
        const indexEntity: {idProp: "index"} = entity<Entity>().id('index');

        expect(idEntity.idProp).toBe('id');
        expect(indexEntity.idProp).toBe('index');
    });

    it('can set any name for the entity', () => {
        const fooEntity: {nameProp: 'foo'} = entity<Entity>().name('foo');
        console.log(fooEntity);
        const jarbledEntity: {nameProp: '/$%*(&@^\\'} = entity<Entity>().name('/$%*(&@^\\');

        expect(fooEntity.nameProp).toBe('foo');
        expect(jarbledEntity.nameProp).toBe('/$%*(&@^\\');
    });

    it('can set name and ID in either order', () => {
        const nameFirst = entity<Entity>().name('foo').id('id');
        const idFirst = entity<Entity>().id('index').name('bar');

        expect(nameFirst.idProp).toBe('id');
        expect(nameFirst.nameProp).toBe('foo');

        expect(idFirst.idProp).toBe('index');
        expect(idFirst.nameProp).toBe('bar');
    });

    it('can build from a complete builder', () => {
        const entityBuilder = entity<Entity>().id('id').name('foo');
        const schema = build(entityBuilder);

        /* eslint-disable @typescript-eslint/unbound-method */
        expect(schema.normalize).toBeDefined();
        /* eslint-enable @typescript-eslint/unbound-method */
      });
});
