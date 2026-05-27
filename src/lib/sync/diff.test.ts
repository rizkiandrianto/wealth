import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { computeDiff } from './diff'

describe('computeDiff', () => {
  const base = { accountId: 'a1', accountName: 'Sinarmas' }

  it('returns topup when sheet > db', () => {
    const r = computeDiff({ ...base, dbBalance: 100, sheetBalance: 150 })
    assert.equal(r.delta, 50)
    assert.equal(r.action, 'topup')
  })

  it('returns withdrawal when sheet < db', () => {
    const r = computeDiff({ ...base, dbBalance: 200, sheetBalance: 150 })
    assert.equal(r.delta, -50)
    assert.equal(r.action, 'withdrawal')
  })

  it('returns no-op when balances are equal', () => {
    const r = computeDiff({ ...base, dbBalance: 100, sheetBalance: 100 })
    assert.equal(r.delta, 0)
    assert.equal(r.action, 'no-op')
  })

  it('treats sub-cent differences as no-op', () => {
    const r = computeDiff({ ...base, dbBalance: 100, sheetBalance: 100.001 })
    assert.equal(r.action, 'no-op')
  })

  it('flags cent-level differences', () => {
    const r = computeDiff({ ...base, dbBalance: 100, sheetBalance: 100.5 })
    assert.equal(r.action, 'topup')
  })

  it('passes input fields through to the result', () => {
    const r = computeDiff({ ...base, dbBalance: 100, sheetBalance: 200 })
    assert.equal(r.accountId, 'a1')
    assert.equal(r.accountName, 'Sinarmas')
    assert.equal(r.dbBalance, 100)
    assert.equal(r.sheetBalance, 200)
  })
})
