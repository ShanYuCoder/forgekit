import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  inferSurfaceFromRepoPath,
  isLegacyModulesCmpPath,
} from '../dist/graph/analyze/product-paths.js'

describe('product-paths', () => {
  describe('inferSurfaceFromRepoPath', () => {
    it('should infer canonical surface paths correctly', () => {
      const repoRoot = '/home/user/workspace/repo'
      const absPath = '/home/user/workspace/repo/product/surfaces/search/CMP-123/src/index.ts'
      
      const result = inferSurfaceFromRepoPath(absPath, repoRoot)
      assert.strictEqual(result, 'search/CMP-123')
    })

    it('should infer legacy modules paths correctly', () => {
      const repoRoot = '/home/user/workspace/repo'
      const absPath = '/home/user/workspace/repo/product/surfaces/search/modules/CMP-456/src/index.ts'
      
      const result = inferSurfaceFromRepoPath(absPath, repoRoot)
      assert.strictEqual(result, 'search/CMP-456')
    })

    it('should handle fallback for standard paths', () => {
      const repoRoot = '/home/user/workspace/repo'
      const absPath = '/home/user/workspace/repo/src/components/Button.ts'
      
      const result = inferSurfaceFromRepoPath(absPath, repoRoot)
      assert.strictEqual(result, 'src/components')
    })
  })

  describe('isLegacyModulesCmpPath', () => {
    it('should return true for legacy paths', () => {
      const filePath = 'product/surfaces/shopping/modules/CMP-999/lib/index.ts'
      assert.strictEqual(isLegacyModulesCmpPath(filePath), true)
    })

    it('should return false for canonical paths', () => {
      const filePath = 'product/surfaces/shopping/CMP-999/lib/index.ts'
      assert.strictEqual(isLegacyModulesCmpPath(filePath), false)
    })

    it('should return false for arbitrary paths', () => {
      const filePath = 'src/components/Card/index.ts'
      assert.strictEqual(isLegacyModulesCmpPath(filePath), false)
    })
  })
})
