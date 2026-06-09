import { describe, it, expect } from 'vitest'
import { sweepGenerosityNoise } from '../../src/sim/sweep'
import type { SweepOptions } from '../../src/sim/sweep'
import { STANDARD_PAYOFF, optimalGenerosity } from '../../src/core/payoff'
import type { StrategyId } from '../../src/core/strategy/Strategy'

const baseOpts = (): SweepOptions => ({
  payoff: STANDARD_PAYOFF,
  rounds: 150,
  seed: 1,
  qSteps: 21,
  noiseSteps: 11,
  maxNoise: 0.2,
  opponents: ['tft', 'alld', 'allc', 'pavlov', 'tf2t'] as StrategyId[],
})

describe('golden: generosity sweep dynamics', () => {
  it('optimal generosity rises with noise (≈0 at no noise, >0 at high noise)', () => {
    const r = sweepGenerosityNoise(baseOpts())
    const atZero = r.argmaxQByNoise[0]
    const atHigh = r.argmaxQByNoise[r.argmaxQByNoise.length - 1]
    // noise=0: AllD 착취 회피가 지배 -> 최적 관용 거의 0
    expect(atZero).toBeLessThanOrEqual(0.15)
    // 시끄러울수록 더 관대해야 한다
    expect(atHigh).toBeGreaterThan(atZero)
  })

  it('theoretical optimum is interior (0,1) for standard payoff', () => {
    const q = optimalGenerosity(STANDARD_PAYOFF)
    expect(q).toBeGreaterThan(0)
    expect(q).toBeLessThan(1)
  })

  it('grid dimensions are consistent', () => {
    const r = sweepGenerosityNoise(baseOpts())
    expect(r.scores.length).toBe(21)
    expect(r.scores[0].length).toBe(11)
    expect(r.argmaxQByNoise.length).toBe(11)
  })
})
