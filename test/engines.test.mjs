import test from 'node:test'
import assert from 'node:assert'
import path from 'node:path'
import { runEngine } from '../dist/docs/cli/engines.js'

test('docs engines mapping', async (t) => {
  await t.test('runEngine split returns command array containing split-bundle.mjs', async () => {
    // We pass invalid args so it fails quickly but returns the constructed command
    const res = await runEngine('split', ['--fake-flag-to-fail-fast'])
    assert.ok(res.command.some((c) => c.includes('split-bundle.mjs')))
  })

  await t.test('runEngine openapi_render contains render-openapi.mjs', async () => {
    const res = await runEngine('openapi_render', ['--fake-flag-to-fail-fast'])
    assert.ok(res.command.some((c) => c.includes('render-openapi.mjs')))
  })

  await t.test('runEngine check adds --check argument', async () => {
    const res = await runEngine('check', ['--fake-flag-to-fail-fast'])
    assert.ok(res.command.some((c) => c === '--check'))
    assert.ok(res.command.some((c) => c.includes('split-bundle.mjs')))
  })

  await t.test('runEngine publish contains publish.mjs', async () => {
    const res = await runEngine('publish', ['--fake-flag-to-fail-fast'])
    assert.ok(res.command.some((c) => c.includes('publish.mjs')))
  })

  await t.test('runEngine split_all contains split-all.mjs', async () => {
    const res = await runEngine('split_all', ['--fake-flag-to-fail-fast'])
    assert.ok(res.command.some((c) => c.includes('split-all.mjs')))
  })
})
