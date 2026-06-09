import { describe, it, expect } from 'vitest'
import { trustFromHistory, trustDelta, TRUST_START } from '../../src/game/trust'
import { round } from '../_fixtures'

describe('trust', () => {
  it('빈 히스토리 = 시작값', () => {
    expect(trustFromHistory([])).toBe(TRUST_START)
  })
  it('상호협력 누적은 100으로 clamp', () => {
    const h = Array.from({ length: 10 }, (_, i) => round('C', 'C', i))
    expect(trustFromHistory(h)).toBe(100)
  })
  it('일방 배신이 상호배신보다 신뢰를 더 깎는다', () => {
    expect(trustDelta(round('C', 'D'))).toBeLessThan(trustDelta(round('D', 'D')))
  })
  it('일방 배신 누적은 0으로 clamp', () => {
    const h = Array.from({ length: 10 }, (_, i) => round('C', 'D', i))
    expect(trustFromHistory(h)).toBe(0)
  })
})
