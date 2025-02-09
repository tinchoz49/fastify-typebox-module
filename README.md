# fastify-typebox-module-types

> A plugin for Fastify that allows you to use TypeBox module types and register them as normal ajv schemas.

![Tests](https://github.com/tinchoz49/fastify-typebox-module-types/actions/workflows/test.yml/badge.svg)
[![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard--ext-05ae89.svg)](https://github.com/tinchoz49/eslint-config-standard-ext)
[![standard-readme compliant](https://img.shields.io/badge/readme%20style-standard-brightgreen.svg?style=flat)](https://github.com/RichardLitt/standard-readme)

## Install

```bash
$ npm install fastify-typebox-module-types
```

## Usage

```ts
import { type TypeBoxTypeProvider } from '@fastify/type-provider-typebox'
import { Type } from '@sinclair/typebox'
import fastify from 'fastify'
import fastifyTypeboxModuleTypes, { type FastifyTypeboxModuleTypesPlugin } from 'fastify-typebox-module-types'

const schemas = {
  UserParams: Type.Object({
    id: Type.String(),
  }),
  User: Type.Object({
    id: Type.String(),
    name: Type.String(),
    address: Type.Ref('Address'),
    phones: Type.Array(Type.Ref('Phone')),
  }),
  Address: Type.Object({
    street: Type.String(),
    city: Type.String(),
    zip: Type.String(),
  }),
  Phone: Type.Object({
    number: Type.String(),
  }),
}

declare module 'fastify' {
  interface FastifyInstance extends FastifyTypeboxModuleTypesPlugin<typeof schemas> {}
}

const app = fastify().withTypeProvider<TypeBoxTypeProvider>()

await app.register(fastifyTypeboxModuleTypes, {
  schemas,
})

app.get('/user/:id', {
  schema: {
    params: app.ref('UserParams'),
    response: {
      200: app.ref('User'),
    },
  },
  handler: async (request, reply) => {
    const { id } = request.params

    const user = {
      id,
      name: 'John Doe',
      address: { street: '123 Main St', city: 'Anytown', zip: '12345' },
      phones: [{ number: '123-456-7890' }],
    }

    return user
  },
})
```

The schemas are going to be register and available as normal ajv schemas, then you can reference any schema by using `app.ref` and it will
work as expected validating the request schemas, response schemas and their types.

## Issues

:bug: If you found an issue we encourage you to report it on [github](https://github.com/tinchoz49/fastify-typebox-module-types/issues). Please specify your OS and the actions to reproduce it.

## Contributing

:busts_in_silhouette: Ideas and contributions to the project are welcome. You must follow this [guideline](https://github.com/tinchoz49/fastify-typebox-module-types/blob/main/CONTRIBUTING.md).

## License

MIT © 2025 Martin Acosta
