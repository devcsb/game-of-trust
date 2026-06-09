import { describe, it, expect } from 'vitest'
import { welfareMessage } from '../../src/game/welfareMessage'
import { round } from '../_fixtures'

describe('welfareMessage', () => {
  it('상호협력: bloom, +6, 손실 0', () => {
    const m = welfareMessage(round('C', 'C'))
    expect(m.tone).toBe('bloom')
    expect(m.delta).toBe(6)
    expect(m.lost).toBe(0)
  })

  it('내 배신: leak, +5, 손실 1', () => {
    const m = welfareMessage(round('D', 'C'))
    expect(m.tone).toBe('leak')
    expect(m.delta).toBe(5)
    expect(m.lost).toBe(1)
  })

  it('배신당함: leak, +5, 손실 1', () => {
    const m = welfareMessage(round('C', 'D'))
    expect(m.tone).toBe('leak')
    expect(m.lost).toBe(1)
  })

  it('상호배신: collapse, +2, 손실 4', () => {
    const m = welfareMessage(round('D', 'D'))
    expect(m.tone).toBe('collapse')
    expect(m.delta).toBe(2)
    expect(m.lost).toBe(4)
  })
})
