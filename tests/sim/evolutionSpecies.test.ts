import { describe, it, expect } from 'vitest'
import { runEvolution } from '../../src/sim/evolution'
import { STANDARD_PAYOFF } from '../../src/core/payoff'
import { DEFAULT_DEF } from '../../src/core/strategy/custom'

describe('evolution with custom species (진화 출전)', () => {
  it('커스텀 전략이 7번째 종으로 참가해도 각 세대 비율 합은 1', () => {
    const r = runEvolution({
      strategies: [
        'allc',
        'alld',
        'tft',
        'grudger',
        'gtft',
        'pavlov',
        { custom: { ...DEFAULT_DEF, name: '내 전략' } },
      ],
      rounds: 30,
      payoff: STANDARD_PAYOFF,
      executionNoise: 0.05,
      seed: 7,
      generations: 60,
    })
    expect(r.history[0]).toHaveLength(7)
    for (const gen of r.history) {
      expect(gen.reduce((a, b) => a + b, 0)).toBeCloseTo(1, 5)
    }
  })

  it('커스텀 TFT 동치는 빌트인 tft와 같은 운명을 맞는다 (결정성)', () => {
    const base = {
      rounds: 30,
      payoff: STANDARD_PAYOFF,
      executionNoise: 0.05,
      seed: 7,
      generations: 60,
    }
    const withBuiltin = runEvolution({ ...base, strategies: ['alld', 'gtft', 'tft'] })
    const withCustom = runEvolution({
      ...base,
      strategies: ['alld', 'gtft', { custom: DEFAULT_DEF }],
    })
    const fa = withBuiltin.history[withBuiltin.history.length - 1]
    const fb = withCustom.history[withCustom.history.length - 1]
    expect(fb[2]).toBeCloseTo(fa[2], 10)
  })
})
