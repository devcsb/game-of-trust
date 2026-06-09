import { describe, it, expect } from 'vitest'
import { matchOutcome } from '../../src/game/outcome'

describe('outcome', () => {
  it('내 점수가 높으면 win', () => {
    expect(matchOutcome(30, 20)).toBe('win')
  })
  it('상대 점수가 높으면 lose', () => {
    expect(matchOutcome(20, 30)).toBe('lose')
  })
  it('같으면 draw', () => {
    expect(matchOutcome(25, 25)).toBe('draw')
  })
})
