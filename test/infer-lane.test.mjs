import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  isFeStack,
  isBeStack,
  inferSuggestLane,
} from '../dist/graph/lexicon/infer-lane.js'

describe('infer-lane', () => {
  describe('isFeStack', () => {
    it('should return true if dsl.lanes.fe is true', () => {
      const cfg = { projectId: 'test', repoId: 'test', stack: 'unknown', dsl: { lanes: { fe: true } } }
      assert.strictEqual(isFeStack(cfg), true)
    })

    it('should return false if dsl.lanes.be is true and fe is undefined', () => {
      const cfg = { projectId: 'test', repoId: 'test', stack: 'unknown', dsl: { lanes: { be: true } } }
      assert.strictEqual(isFeStack(cfg), false)
    })

    it('should fall back to FE_STACKS Set', () => {
      assert.strictEqual(isFeStack({ projectId: 'test', repoId: 'test', stack: 'nuxt4' }), true)
      assert.strictEqual(isFeStack({ projectId: 'test', repoId: 'test', stack: 'nextjs-nest' }), true)
      assert.strictEqual(isFeStack({ projectId: 'test', repoId: 'test', stack: 'laravel' }), false)
    })
  })

  describe('isBeStack', () => {
    it('should return true if dsl.lanes.be is true', () => {
      const cfg = { projectId: 'test', repoId: 'test', stack: 'unknown', dsl: { lanes: { be: true } } }
      assert.strictEqual(isBeStack(cfg), true)
    })

    it('should return false if dsl.lanes.fe is true and be is undefined', () => {
      const cfg = { projectId: 'test', repoId: 'test', stack: 'unknown', dsl: { lanes: { fe: true } } }
      assert.strictEqual(isBeStack(cfg), false)
    })

    it('should fall back to BE_STACKS Set', () => {
      assert.strictEqual(isBeStack({ projectId: 'test', repoId: 'test', stack: 'laravel' }), true)
      assert.strictEqual(isBeStack({ projectId: 'test', repoId: 'test', stack: 'fastapi' }), true)
      assert.strictEqual(isBeStack({ projectId: 'test', repoId: 'test', stack: 'nuxt4' }), false)
    })
  })

  describe('inferSuggestLane', () => {
    it('should infer be lane for BE-only stack', () => {
      const cfg = { projectId: 'test', repoId: 'test', stack: 'laravel' }
      assert.strictEqual(inferSuggestLane(cfg), 'be')
    })

    it('should infer fe lane for FE-only stack', () => {
      const cfg = { projectId: 'test', repoId: 'test', stack: 'nextjs' }
      assert.strictEqual(inferSuggestLane(cfg), 'fe')
    })

    it('should infer fe lane by default for fullstack or unknown', () => {
      // both true
      const cfg1 = { projectId: 'test', repoId: 'test', stack: 'unknown', dsl: { lanes: { fe: true, be: true } } }
      assert.strictEqual(inferSuggestLane(cfg1), 'fe')

      // unknown stack
      const cfg2 = { projectId: 'test', repoId: 'test', stack: 'unknown' }
      assert.strictEqual(inferSuggestLane(cfg2), 'fe')
    })
  })
})
