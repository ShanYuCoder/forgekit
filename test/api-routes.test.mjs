import test from 'node:test'
import assert from 'node:assert'
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { parseSpecFile, detectDuplicateRoutes } from '../dist/graph/analyze/api-routes.js'

test('api-routes', async (t) => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'api-routes-test-'))
  
  await t.test('parseSpecFile: OpenAPI 3.x format', () => {
    const yaml = `
paths:
  /users:
    get:
      operationId: listUsers
    post:
      operationId: storeUser
  /users/{id}:
    get:
      operationId: showUser
    delete:
      operationId: destroyUser
`
    const absPath = path.join(tmpDir, '02-openapi.yaml')
    fs.writeFileSync(absPath, yaml)
    const res = parseSpecFile(absPath, tmpDir)
    
    assert.strictEqual(res.length, 4)
    const listRoute = res.find(r => r.method === 'GET' && r.path === '/users')
    assert.strictEqual(listRoute.action, 'list')
    
    const delRoute = res.find(r => r.method === 'DELETE' && r.path === '/users/{id}')
    assert.strictEqual(delRoute.action, 'delete')
  })

  await t.test('parseSpecFile: Custom endpoints format', () => {
    const yaml = `
endpoints:
  - path: /products/create
    method: POST
  - path: /products/update
    method: PUT
`
    const absPath = path.join(tmpDir, '01-backend-spec.yaml')
    fs.writeFileSync(absPath, yaml)
    const res = parseSpecFile(absPath, tmpDir)
    
    assert.strictEqual(res.length, 2)
    assert.strictEqual(res[0].action, 'create')
    assert.strictEqual(res[1].action, 'update')
  })

  await t.test('detectDuplicateRoutes', () => {
    const routes = [
      { path: '/auth/login', method: 'POST', action: 'create', sourceFile: 'fileA.yaml', surface: 'auth' },
      { path: '/auth/login', method: 'POST', action: 'create', sourceFile: 'fileB.yaml', surface: 'auth' },
      { path: '/users', method: 'GET', action: 'list', sourceFile: 'fileC.yaml', surface: 'users' },
    ]
    const conflicts = detectDuplicateRoutes(routes)
    assert.strictEqual(conflicts.length, 1)
    assert.strictEqual(conflicts[0].path, '/auth/login')
    assert.strictEqual(conflicts[0].sources.length, 2)
    assert.ok(conflicts[0].sources.includes('fileA.yaml'))
  })
})
