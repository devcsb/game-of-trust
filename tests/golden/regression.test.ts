import { describe, it, expect } from 'vitest'
import { runMatch } from '../../src/sim/match'
import { STANDARD_PAYOFF } from '../../src/core/payoff'
import { mulberry32 } from '../../src/core/rng'
import type { MatchConfig } from '../../src/core/types'

const cfg = (over: Partial<MatchConfig> = {}): MatchConfig => ({
  rounds: 100,
  payoff: STANDARD_PAYOFF,
  executionNoise: 0,
  perceptionNoise: 0,
  seed: 1,
  ...over,
})

describe('golden: noise=0 deterministic outcomes', () => {
  it('TFT vs TFT = mutual cooperation (R every round)', () => {
    const r = runMatch({ id: 'tft' }, { id: 'tft' }, cfg(), mulberry32(1))
    expect(r.score).toEqual([3 * 100, 3 * 100])
  })

  it('TFT vs AllD = sucker once, then mutual punishment', () => {
    const rounds = 100
    const r = runMatch({ id: 'tft' }, { id: 'alld' }, cfg({ rounds }), mulberry32(1))
    // TFT: S + (rounds-1)*P = 0 + 99 ; AllD: T + (rounds-1)*P = 5 + 99
    expect(r.score).toEqual([0 + (rounds - 1) * 1, 5 + (rounds - 1) * 1])
  })

  it('AllD vs AllC = T*rounds vs S*rounds', () => {
    const rounds = 100
    const r = runMatch({ id: 'alld' }, { id: 'allc' }, cfg({ rounds }), mulberry32(1))
    expect(r.score).toEqual([5 * rounds, 0 * rounds])
  })
})

describe('golden: noise breaks strict TFT, generosity recovers', () => {
  it('two TFTs fall below mutual-cooperation average under execution noise', () => {
    const seed = 12345
    const r = runMatch(
      { id: 'tft' },
      { id: 'tft' },
      cfg({ executionNoise: 0.05, rounds: 400, seed }),
      mulberry32(seed),
    )
    // 보복 루프로 상호협력 평균(R=3) 아래로 떨어진다
    expect(r.avgPerRound[0]).toBeLessThan(3)
  })

  it('under noise, GTFT pair scores higher than TFT pair (core claim)', () => {
    const seed = 777
    const common = { executionNoise: 0.05, rounds: 500, seed }
    const tftPair = runMatch({ id: 'tft' }, { id: 'tft' }, cfg(common), mulberry32(seed))
    const gtftPair = runMatch({ id: 'gtft' }, { id: 'gtft' }, cfg(common), mulberry32(seed))
    expect(gtftPair.avgPerRound[0]).toBeGreaterThan(tftPair.avgPerRound[0])
  })
})

describe('golden: reproducibility', () => {
  it('same config + seed yields identical outcome', () => {
    const c = cfg({ executionNoise: 0.1, rounds: 200, seed: 9 })
    const r1 = runMatch({ id: 'gtft' }, { id: 'pavlov' }, c, mulberry32(9))
    const r2 = runMatch({ id: 'gtft' }, { id: 'pavlov' }, c, mulberry32(9))
    expect(r1.score).toEqual(r2.score)
  })
})
