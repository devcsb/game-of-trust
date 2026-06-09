import { describe, it, expect } from 'vitest'
import { makeStrategy } from '../../src/core/strategy/registry'
import { mulberry32 } from '../../src/core/rng'
import type { Move, Observation } from '../../src/core/types'

const obs = (round: number, opp: Move | null, selfI: Move | null = null): Observation => ({
  round,
  oppLastPerceived: opp,
  selfLastIntended: selfI,
  selfLastPlayed: selfI,
})

describe('strategies', () => {
  const rng = mulberry32(1)

  it('TFT mirrors opponent last perceived move', () => {
    const s = makeStrategy('tft')
    expect(s.next(obs(0, null), rng)).toBe('C')
    expect(s.next(obs(1, 'D'), rng)).toBe('D')
    expect(s.next(obs(2, 'C'), rng)).toBe('C')
  })

  it('Grudger defects forever after one defection', () => {
    const s = makeStrategy('grudger')
    expect(s.next(obs(0, null), rng)).toBe('C')
    expect(s.next(obs(1, 'D'), rng)).toBe('D')
    expect(s.next(obs(2, 'C'), rng)).toBe('D') // 용서 없음
  })

  it('TF2T tolerates a single defection, retaliates on two in a row', () => {
    const s = makeStrategy('tf2t')
    expect(s.next(obs(0, null), rng)).toBe('C')
    expect(s.next(obs(1, 'D'), rng)).toBe('C') // 한 번은 봐줌
    expect(s.next(obs(2, 'D'), rng)).toBe('D') // 두 번 연속
    expect(s.next(obs(3, 'C'), rng)).toBe('C')
  })

  it('Pavlov: win-stay, lose-shift', () => {
    const s = makeStrategy('pavlov')
    expect(s.next(obs(0, null), rng)).toBe('C')
    expect(s.next(obs(1, 'C', 'C'), rng)).toBe('C') // 상대 C = win -> stay
    expect(s.next(obs(2, 'D', 'C'), rng)).toBe('D') // 상대 D = lose -> shift
  })

  it('GTFT forgives at q=1, retaliates at q=0', () => {
    const sForgive = makeStrategy('gtft', { generosity: 1 })
    expect(sForgive.next(obs(1, 'D'), rng)).toBe('C')
    const sHard = makeStrategy('gtft', { generosity: 0 })
    expect(sHard.next(obs(1, 'D'), rng)).toBe('D')
  })

  it('AllC and AllD are constant', () => {
    expect(makeStrategy('allc').next(obs(5, 'D'), rng)).toBe('C')
    expect(makeStrategy('alld').next(obs(5, 'C'), rng)).toBe('D')
  })
})
