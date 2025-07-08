import { type SchemaOptions, type Static, type TImport, type TSchema, type TUnsafe, Type } from '@sinclair/typebox'
import type { FastifyPluginAsync } from 'fastify'
import fp from 'fastify-plugin'

declare module 'fastify' {
  interface FastifyInstance {
    typeboxModule: FastifyTypeboxModuleInstance
  }
}

export type FastifyTypeboxModulePlugin = FastifyPluginAsync<FastifyTypeboxModuleOptions>

// biome-ignore lint/suspicious/noEmptyInterface: this is a declaration
export interface FastifyTypeboxModule {
  // schemas: Record<string, TSchema>
}

export type FastifyTypeboxModuleSchemas = FastifyTypeboxModule extends { schemas: infer T }
  ? T extends Record<string, TSchema>
    ? T
    : Record<string, TSchema>
  : Record<string, TSchema>

export interface FastifyTypeboxModuleOptions {
  schemas: FastifyTypeboxModuleSchemas
}

type Module = ReturnType<typeof Type.Module<FastifyTypeboxModuleSchemas>>
type ImportModule = Module['Import']
type ImportModuleKeys = Parameters<ImportModule>[0]

export type SchemaType<K extends ImportModuleKeys> = ImportModule extends (key: K, options?: SchemaOptions) => infer R
  ? R extends TImport<infer T>
    ? Static<TImport<T, K>>
    : never
  : never

export interface FastifyTypeboxModuleInstance {
  import: ImportModule
  ref: <K extends ImportModuleKeys>(key: K, options?: SchemaOptions) => TUnsafe<SchemaType<K>>
}

const fastifyTypeboxModulePlugin: FastifyTypeboxModulePlugin = async (app, options) => {
  const Module = Type.Module(options.schemas)

  const { $defs } = Module as unknown as { $defs: Record<string, TSchema> }
  Object.entries($defs).forEach(([key, schema]) => {
    try {
      app.addSchema(schema)
    } catch (error) {
      throw new Error(`Failed to add schema ${key}: ${(error as Error).message}`)
    }
  })

  const extend = {
    import: Module.Import,
    ref: <K extends ImportModuleKeys>(key: K, options?: SchemaOptions) =>
      Type.Unsafe<SchemaType<K>>(Type.Ref(key as string, options)),
  }

  app.decorate('typeboxModule', extend)
}

export default fp(fastifyTypeboxModulePlugin, {
  name: 'fastify-typebox-module',
})
