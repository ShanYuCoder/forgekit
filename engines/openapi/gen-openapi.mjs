#!/usr/bin/env node
/**
 * One OpenAPI 3.0.3 generator for the docs hub.
 * Input: 01-backend-spec.yaml → sibling 02-openapi.yaml
 * Bundle/UI remain: openapi:render (merge) + Redocly bundle.
 */
import { existsSync } from 'node:fs'
import { mkdir, readdir, readFile, stat, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { parse, stringify } from 'yaml'

const SCALAR = {
  integer: 'integer',
  int: 'integer',
  number: 'number',
  float: 'number',
  boolean: 'boolean',
  datetime: 'string',
  date: 'string',
  string: 'string',
  text: 'string',
}

const ERROR_RESPONSE_REF = {
  '#err:unauthorized': 'UnauthorizedError',
  '#err:permission-denied': 'PermissionError',
  '#err:idor-violation': 'IdorViolationError',
  '#err:not-found': 'NotFoundError',
  '#err:validation': 'ValidationError',
  '#err:system': 'ServerError',
  '#err:conflict': 'ConflictError',
  '#err:maintenance': 'ServerError',
}

function schemaFromFields(fields = []) {
  const properties = {}
  const required = []
  for (const field of fields) {
    const name = field.name ?? field.key
    if (!name) continue
    properties[name] = { type: SCALAR[field.type] ?? 'string' }
    if (field.readOnly) properties[name].readOnly = true
    if (field.nullable) properties[name].nullable = true
    if (field.required === true) required.push(name)
  }
  return {
    type: 'object',
    properties,
    ...(required.length ? { required } : {}),
  }
}

function collectEntitySchemas(spec) {
  const schemas = {}
  for (const mod of spec.modules ?? []) {
    for (const entity of mod.entities ?? []) {
      const name = entity.name
      if (!name) continue
      schemas[name] = schemaFromFields(entity.fields)
    }
  }
  for (const [name, def] of Object.entries(spec.requests ?? {})) {
    schemas[name] = schemaFromFields(def.fields)
  }
  for (const [name, def] of Object.entries(spec.responses ?? {})) {
    if (def?.envelope) {
      const itemRef = String(def.data ?? '').match(/of\s+(\w+)/)?.[1]
      schemas[name] = {
        type: 'object',
        properties: {
          data: itemRef
            ? { type: 'array', items: { $ref: `#/components/schemas/${itemRef}` } }
            : { type: 'array', items: { type: 'object' } },
          meta: { type: 'object' },
        },
      }
      continue
    }
    if (def?.fields) schemas[name] = schemaFromFields(def.fields)
  }
  return schemas
}

function ensureCollectionSchema(schemas, responseName) {
  if (!responseName || schemas[responseName]) return
  const entity = String(responseName).replace(/Collection$/, '')
  if (entity && entity !== responseName && schemas[entity]) {
    schemas[responseName] = {
      type: 'object',
      properties: {
        data: { type: 'array', items: { $ref: `#/components/schemas/${entity}` } },
      },
    }
  }
}

function responseSchemaRef(responseName, schemas) {
  if (!responseName) return { type: 'object' }
  ensureCollectionSchema(schemas, responseName)
  if (schemas[responseName]) return { $ref: `#/components/schemas/${responseName}` }
  return { type: 'object' }
}

function errorResponses(endpoint) {
  const responses = {}
  for (const row of endpoint.errorStorming ?? []) {
    const tag = String(row.tag ?? '')
    const name = ERROR_RESPONSE_REF[tag]
    const code = String(row.code ?? '')
    if (!code) continue
    responses[code] = name
      ? { $ref: `#/components/responses/${name}` }
      : { description: row.reason ?? tag ?? 'Error' }
  }
  return responses
}

function standardComponents() {
  return {
    UnauthorizedError: {
      description: 'Unauthorized (#err:unauthorized)',
      content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
    },
    PermissionError: {
      description: 'Forbidden (#err:permission-denied)',
      content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
    },
    IdorViolationError: {
      description: 'Forbidden (#err:idor-violation)',
      content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
    },
    NotFoundError: {
      description: 'Not Found (#err:not-found)',
      content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
    },
    ValidationError: {
      description: 'Validation failed (#err:validation)',
      content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
    },
    ServerError: {
      description: 'Server error (#err:system)',
      content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
    },
    ConflictError: {
      description: 'Conflict (#err:conflict)',
      content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
    },
  }
}

export function buildOpenApiFromBackendSpec(spec) {
  const schemas = collectEntitySchemas(spec)
  schemas.ErrorResponse ??= {
    type: 'object',
    required: ['code', 'message'],
    properties: { code: { type: 'string' }, message: { type: 'string' } },
  }

  const paths = {}
  const tagNames = new Set()

  for (const endpoint of spec.api?.endpoints ?? []) {
    const pathKey = endpoint.path ?? '/'
    const method = String(endpoint.method ?? 'GET').toLowerCase()
    const tag = endpoint.module ?? spec.codegen?.module ?? 'API'
    tagNames.add(tag)

    const operation = {
      operationId: endpoint.id ?? `${spec.codegen?.entity ?? 'op'}.${endpoint.action ?? 'custom'}`,
      tags: [tag],
      summary: endpoint.purpose ?? `${endpoint.action ?? method} ${pathKey}`,
      responses: {
        '200': {
          description: 'OK',
          content: {
            'application/json': {
              schema: responseSchemaRef(endpoint.response, schemas),
            },
          },
        },
        ...errorResponses(endpoint),
      },
    }

    if (method === 'get') {
      const filters = endpoint.query?.filters ?? []
      const parameters = []
      if (endpoint.query?.pagination) {
        parameters.push(
          { name: 'page', in: 'query', schema: { type: 'integer' } },
          { name: 'perPage', in: 'query', schema: { type: 'integer' } },
        )
      }
      for (const filter of filters) {
        const name = typeof filter === 'string' ? filter : filter.name
        if (name) parameters.push({ name, in: 'query', schema: { type: 'string' } })
      }
      if (parameters.length) operation.parameters = parameters
    } else if (['post', 'patch', 'put'].includes(method) && endpoint.request) {
      ensureCollectionSchema(schemas, endpoint.request)
      operation.requestBody = {
        required: true,
        content: {
          'application/json': {
            schema: schemas[endpoint.request]
              ? { $ref: `#/components/schemas/${endpoint.request}` }
              : { type: 'object' },
          },
        },
      }
    }

    paths[pathKey] = paths[pathKey] ?? {}
    paths[pathKey][method] = operation
  }

  const title = spec.feature?.title ?? `${spec.codegen?.module ?? 'API'}`
  return {
    openapi: '3.0.3',
    info: {
      title,
      version: spec.feature?.version ?? '0.1.0',
      description: 'Generated by `docskit openapi:gen` from 01-backend-spec.yaml.',
    },
    servers: [{ url: process.env.OPENAPI_SERVER_URL || 'http://localhost', description: 'Local API' }],
    tags: [...tagNames].map((name) => ({ name })),
    paths,
    components: {
      securitySchemes: {
        bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      },
      responses: standardComponents(),
      schemas,
    },
    security: [{ bearerAuth: [] }],
    ...(spec.i18n ? { 'x-i18n': spec.i18n } : {}),
  }
}

function parseArgs(argv) {
  const options = { spec: null, dryRun: false, force: false }
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (arg === '--dry-run' || arg === '--dry') options.dryRun = true
    else if (arg === '--force') options.force = true
    else if (arg === '--spec') options.spec = argv[++i]
    else if (!arg.startsWith('-') && !options.spec) options.spec = arg
  }
  return options
}

export async function listBackendSpecs(dir) {
  const files = []
  let entries = []
  try {
    entries = await readdir(dir, { withFileTypes: true })
  } catch {
    return files
  }
  for (const entry of entries) {
    const entryPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      if (entry.name.startsWith('_')) continue
      files.push(...(await listBackendSpecs(entryPath)))
      continue
    }
    if (entry.isFile() && entry.name === '01-backend-spec.yaml') files.push(entryPath)
  }
  return files.sort()
}

async function resolveSpecFiles(options, cwd) {
  if (options.spec) {
    const abs = path.resolve(cwd, options.spec)
    const st = existsSync(abs) ? await stat(abs) : null
    if (!st) throw new Error(`Not found: ${abs}`)
    if (st.isDirectory()) {
      const found = await listBackendSpecs(abs)
      if (!found.length) throw new Error(`No 01-backend-spec.yaml under ${abs}`)
      return found
    }
    if (path.basename(abs) !== '01-backend-spec.yaml') {
      throw new Error(`Expected 01-backend-spec.yaml, got ${abs}`)
    }
    return [abs]
  }
  const surfaces = path.join(cwd, 'product', 'surfaces')
  const found = await listBackendSpecs(surfaces)
  if (!found.length) {
    throw new Error('No 01-backend-spec.yaml under product/surfaces. Pass --spec <path>.')
  }
  return found
}

export async function generateOpenApiFiles(options, cwd = process.cwd()) {
  const specs = await resolveSpecFiles(options, cwd)
  const written = []
  for (const specPath of specs) {
    const spec = parse(await readFile(specPath, 'utf8')) ?? {}
    const document = buildOpenApiFromBackendSpec(spec)
    const yamlContent = stringify(document)
    const outputPath = path.join(path.dirname(specPath), '02-openapi.yaml')
    if (options.dryRun) {
      console.log(`[dry] ${path.relative(cwd, specPath)} → ${path.relative(cwd, outputPath)}`)
      written.push(outputPath)
      continue
    }
    if (existsSync(outputPath) && !options.force) {
      const existing = await readFile(outputPath, 'utf8')
      if (existing.trim() !== yamlContent.trim()) {
        throw new Error(
          `Refusing to overwrite ${path.relative(cwd, outputPath)}. Use --force after reviewing.`,
        )
      }
      console.log(`skip: ${path.relative(cwd, outputPath)} (unchanged)`)
      continue
    }
    await mkdir(path.dirname(outputPath), { recursive: true })
    await writeFile(outputPath, yamlContent, 'utf8')
    console.log(`write: ${path.relative(cwd, outputPath)}`)
    written.push(outputPath)
  }
  return written
}

async function main() {
  const options = parseArgs(process.argv.slice(2))
  await generateOpenApiFiles(options, process.cwd())
}

if (path.resolve(process.argv[1] ?? '') === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error.message ?? error)
    process.exit(1)
  })
}
