import { describe, it, expect } from 'vitest'
import {
  detectBuiltinEquivalent,
  DEFAULT_DEF,
  ON_DEFECT_CARDS,
  ON_COOP_CARDS,
  FIRST_MOVE_CARDS,
} from '../../src/core/strategy/custom'
import type { CustomStrategyDef } from '../../src/core/strategy/custom'
import { resolveStrategy } from '../../src/core/strategy/registry'
import { runMatch } from '../../src/sim/match'
import { STANDARD_PAYOFF } from '../../src/core/payoff'
import { mulberry32 } from '../../src/core/rng'
import type { MatchConfig } from '../../src/core/types'

const cfg = (over: Partial<MatchConfig> = {}): MatchConfig => ({
  rounds: 50,
  payoff: STANDARD_PAYOFF,
  executionNoise: 0,
  perceptionNoise: 0,
  seed: 1,
  ...over,
})

const def = (over: Partial<CustomStrategyDef> = {}): CustomStrategyDef => ({
  ...DEFAULT_DEF,
  ...over,
})

describe('custom strategy (전략 공방)', () => {
  it('커스텀 TFT는 빌트인 tft와 동일한 점수를 낸다 (행동 동치 골든)', () => {
    const customTft = def() // C + reciprocate + retaliate
    for (const opp of ['allc', 'alld', 'tft', 'grudger', 'pavlov'] as const) {
      const a = runMatch({ custom: customTft }, { id: opp }, cfg(), mulberry32(1))
      const b = runMatch({ id: 'tft' }, { id: opp }, cfg(), mulberry32(1))
      expect(a.score).toEqual(b.score)
    }
  })

  it('노이즈 아래서 커스텀 gtft 동치도 빌트인과 일치한다 (RNG 소비 동일)', () => {
    const customGtft = def({ onDefect: 'forgive_some' })
    const a = runMatch(
      { custom: customGtft },
      { id: 'tft' },
      cfg({ executionNoise: 0.1, seed: 77 }),
      mulberry32(77),
    )
    const b = runMatch(
      { id: 'gtft' },
      { id: 'tft' },
      cfg({ executionNoise: 0.1, seed: 77 }),
      mulberry32(77),
    )
    expect(a.score).toEqual(b.score)
  })

  it('grudge 상태는 인스턴스 간 격리된다', () => {
    const d = def({ onDefect: 'grudge' })
    const first = runMatch({ custom: d }, { id: 'alld' }, cfg({ rounds: 10 }), mulberry32(1))
    const second = runMatch({ custom: d }, { id: 'allc' }, cfg({ rounds: 10 }), mulberry32(1))
    // 두 번째 매치는 새 인스턴스 — 원한이 이월되면 allc 상대로도 D만 낸다
    expect(second.rounds[0].played[0]).toBe('C')
    expect(first.rounds[9].played[0]).toBe('D')
  })

  it('모든 카드 조합이 컴파일되고 결정적이다', () => {
    for (const f of FIRST_MOVE_CARDS) {
      for (const c of ON_COOP_CARDS) {
        for (const dft of ON_DEFECT_CARDS) {
          const d = def({ firstMove: f.value, onCoop: c.value, onDefect: dft.value })
          const run = () =>
            runMatch({ custom: d }, { id: 'pavlov' }, cfg({ executionNoise: 0.1 }), mulberry32(5))
          expect(run().score).toEqual(run().score)
        }
      }
    }
  })

  it('재발명 감지 테이블', () => {
    expect(detectBuiltinEquivalent(def())).toBe('tft')
    expect(detectBuiltinEquivalent(def({ onDefect: 'forgive_some' }))).toBe('gtft')
    expect(detectBuiltinEquivalent(def({ onDefect: 'grudge' }))).toBe('grudger')
    expect(detectBuiltinEquivalent(def({ onDefect: 'forgive_all' }))).toBe('allc')
    expect(
      detectBuiltinEquivalent(def({ firstMove: 'D', onCoop: 'betray', onDefect: 'retaliate' })),
    ).toBe('alld')
    expect(detectBuiltinEquivalent(def({ firstMove: 'D' }))).toBeNull()
  })

  it('직렬화 왕복: JSON으로 저장해도 행동이 같다', () => {
    const original = def({ onDefect: 'forgive_some', name: '참을성 있는 복수자', glyph: '🦊' })
    const restored = JSON.parse(JSON.stringify(original)) as CustomStrategyDef
    const a = runMatch(
      { custom: original },
      { id: 'pavlov' },
      cfg({ executionNoise: 0.1, seed: 9 }),
      mulberry32(9),
    )
    const b = runMatch(
      { custom: restored },
      { id: 'pavlov' },
      cfg({ executionNoise: 0.1, seed: 9 }),
      mulberry32(9),
    )
    expect(a.score).toEqual(b.score)
  })

  it('resolveStrategy: 빌트인 리터럴과 커스텀 스펙을 모두 해석한다', () => {
    expect(resolveStrategy({ id: 'tft' }).id).toBe('tft')
    expect(resolveStrategy({ custom: def({ name: '테스트' }) }).id).toBe('custom:테스트')
  })
})
