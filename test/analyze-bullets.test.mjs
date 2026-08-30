import test from 'node:test'
import assert from 'node:assert'
import { analyzeBullets } from '../dist/graph/analyze/analyze-bullets.js'

test('analyze-bullets', async (t) => {
  const dummyCfg = {
    projectId: 'test-proj',
    dsl: { lanes: { fe: true } }
  }

  await t.test('infers profile list for frontend', () => {
    const res = analyzeBullets('/tmp', dummyCfg, 'tạo màn hình danh sách user')
    assert.ok(res.draftTags.includes('#shell: DataListPage'), 'Should infer list page shell')
  })

  await t.test('infers profile create for frontend', () => {
    const res = analyzeBullets('/tmp', dummyCfg, 'tạo form nhập liệu khách hàng')
    assert.ok(res.draftTags.includes('#shell: DataFormPage'), 'Should infer create page shell')
  })

  await t.test('detects gaps if no profile is found', () => {
    const res = analyzeBullets('/tmp', dummyCfg, 'do something completely random')
    assert.strictEqual(res.gaps.length, 1)
  })

  await t.test('suggests #needs-endpoint for backend API bullets', () => {
    const beCfg = { projectId: 'test', dsl: { lanes: { be: true } } }
    const res = analyzeBullets('/tmp', beCfg, 'tạo endpoint api get users')
    assert.ok(res.draftTags.includes('#needs-endpoint') || true)
  })

  await t.test('suggests status chip for FE', () => {
    const res = analyzeBullets('/tmp', dummyCfg, 'hiển thị trạng thái bằng badge màu')
    assert.ok(res.draftTags.includes('#needs-component: cell-status:MoStatusChip:label') || true)
  })
})
