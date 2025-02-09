import assert from 'node:assert'
import { test } from 'node:test'

import { type TypeBoxTypeProvider } from '@fastify/type-provider-typebox'
import { type Static, Type } from '@sinclair/typebox'
import { expectTypeOf } from 'expect-type'
import fastify from 'fastify'

import fastifyTypeboxModuleTypes, { type FastifyTypeboxModuleTypesPlugin } from '../src/index.js'

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

test('basic behavior', async () => {
  const app = fastify().withTypeProvider<TypeBoxTypeProvider>()

  await app.register(fastifyTypeboxModuleTypes, {
    schemas,
  })

  expectTypeOf(app).toHaveProperty('ref')
  expectTypeOf(app).toHaveProperty('module')

  const user: Static<ReturnType<typeof app.ref<'User'>>> = {
    id: '1',
    name: 'John Doe',
    address: { street: '123 Main St', city: 'Anytown', zip: '12345' },
    phones: [{ number: '123-456-7890' }],
  }

  expectTypeOf(user).toEqualTypeOf<{
    id: string
    name: string
    address: { street: string, city: string, zip: string }
    phones: Array<{ number: string }>
  }>()

  app.get('/user/:id', {
    schema: {
      params: app.ref('UserParams'),
      response: {
        200: app.ref('User'),
      },
    },
    handler: async (request, reply) => {
      expectTypeOf(request.params).toHaveProperty('id')
      expectTypeOf(request.params).toEqualTypeOf<{ id: string }>()

      return user
    },
  })

  const response = await app.inject({
    method: 'GET',
    url: '/user/1',
  })

  assert.equal(response.statusCode, 200)
  assert.deepEqual(response.json(), user)
})
