# ts-normalizr

## Install

Install from the NPM repository using yarn or npm:

```shell
yarn add ts-normalizr
```

```shell
npm install ts-normalizr
```

## What does it do?

**ts-normalizr** is a typescript-first utility based on [Paul Armstrong's normalizr library](https://github.com/paularmstrong/normalizr). It will convert nested object structures containing multiple entities into a normalized structure, where each entity type is keyed by its ID, and the nested entities are replaced by those IDs.

## Advantages of ts-normalizr over normalizr

**ts-normalizr** changes how entities are processed from the regular _normalizr_ library. It does this to make interacting with normalized entities easier when using typescript. This is done by adding:

* **Strict type checking**
  * It is impossible to add a property to a schema that doesn't exist on its input type
  * It is impossible to call `normalize` on a schema that can't fully process an input of its input type, including processing any sub-schemas
* **Strong type inference**
  * By defining only the initial input type and using the builder, all other types are automatically inferred, including complex entities output types

## Quick Start

Consider a typical blog post. The API response for a single post might look something like this:

```json
{
  "id": "123",
  "author": {
    "id": "1",
    "name": "Paul"
  },
  "title": "My awesome blog post",
  "comments": [
    {
      "id": "324",
      "commenter": {
        "id": "2",
        "name": "Nicole"
      }
    }
  ]
}
```

We have two nested entity types within our `article`: `users` and `comments`. Using various `schema`, we can normalize all three entity types down:

```js
import { buildSchema, entity } from 'ts-normalizr';

interface User {
  id: string
  name: string
}

interface Comment {
  id: string,
  commenter: User
}

interface Article {
  id: string
  author: User
  title: string
  comments: Comment[]
}

// Define a users schema
const userSchema = buildSchema(
  entity<User>().id('id').name('users')
);

// Define your comments schema
const commentSchema = buildSchema(
  entity<Comment>().id('id').name('comments')
    .prop('commenter', userSchema)
);

// Define your article
const articleSchema = buildSchema(
  entity<Article>().id('id').name('articles')
    .prop('author', userSchema)
    .prop('comments', commentsSchema)
);

const normalizedData = articleSchema.normalize(originalData);
```

Now, `normalizedData` will be:

```js
{
  result: "123",
  entities: {
    "articles": {
      "123": {
        id: "123",
        author: "1",
        title: "My awesome blog post",
        comments: [ "324" ]
      }
    },
    "users": {
      "1": { "id": "1", "name": "Paul" },
      "2": { "id": "2", "name": "Nicole" }
    },
    "comments": {
      "324": { id: "324", "commenter": "2" }
    }
  }
}
```

## Dependencies

None.

## Credits

Normalizr was originally created by [Dan Abramov](http://github.com/gaearon) and inspired by a conversation with [Jing Chen](https://twitter.com/jingc). Since v3, it was completely rewritten and maintained by [Paul Armstrong](https://twitter.com/paularmstrong). This typescript version was rewritten and maintained by [Matthew Butt](https://github.com/grandivory)
