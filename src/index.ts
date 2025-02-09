/* eslint-disable ts/prefer-ts-expect-error */
/* eslint-disable ts/ban-ts-comment */
import type { FastifyPluginAsync } from 'fastify'

import { type SchemaOptions, type TSchema, Type } from '@sinclair/typebox'
import fp from 'fastify-plugin'

export interface FastifyTypeboxModuleTypesOptions {
  schemas: Record<string, TSchema>
}

const fastifyTypeboxModuleTypes: FastifyPluginAsync<FastifyTypeboxModuleTypesOptions> = async (app, options) => {
  const Module = Type.Module(options.schemas)

  const { $defs } = Module as unknown as { $defs: Record<string, TSchema> }
  Object.entries($defs).forEach(([key, schema]) => {
    try {
      app.addSchema(schema)
    } catch (error) {
      throw new Error(`Failed to add schema ${key}: ${(error as Error).message}`)
    }
  })

  // @ts-ignore
  app.decorate('module', Module)
  // @ts-ignore
  app.decorate('ref', (key: string, options: SchemaOptions) => Type.Ref(key, options))
}

export default fp(fastifyTypeboxModuleTypes, {
  name: 'fastify-typebox-module-types',
})

export interface FastifyTypeboxModuleTypesPlugin<S extends Record<string, TSchema>> {
  module: ReturnType<typeof Type.Module<S>>
  ref: ReturnType<typeof Type.Module<S>>['Import']
}
