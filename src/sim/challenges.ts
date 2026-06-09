import type { AppConfig } from '../state/store'
import { runMatch } from './match'
import { mulberry32 } from '../core/rng'
import { optimalGenerosity } from '../core/payoff'

export interface Challenge {
  id: string
  title: string
  check: (config: AppConfig) => boolean
}

function tftPairAvg(c: AppConfig): number {
  const out = runMatch(
    { id: 'tft' },
    { id: 'tft' },
    {
      rounds: c.rounds,
      payoff: c.payoff,
      executionNoise: c.executionNoise,
      perceptionNoise: c.perceptionNoise,
      seed: c.seed,
    },
    mulberry32(c.seed),
  )
  return out.avgPerRound[0]
}

export const CHALLENGES: Challenge[] = [
  {
    id: 'c1',
    title: '노이즈 0에서 TFT 둘로 완전 협력(평균 ≥ 2.9) 만들기',
    check: (c) =>
      c.executionNoise === 0 &&
      c.strategyA === 'tft' &&
      c.strategyB === 'tft' &&
      tftPairAvg(c) >= 2.9,
  },
  {
    id: 'c2',
    title: '실행 노이즈를 올려 TFT 페어 평균을 2.7 아래로 떨어뜨리기 (보복 루프)',
    check: (c) =>
      c.strategyA === 'tft' &&
      c.strategyB === 'tft' &&
      c.executionNoise >= 0.05 &&
      tftPairAvg(c) < 2.7,
  },
  {
    id: 'c3',
    title: 'Generous TFT를 도입해 관용의 효과 보기',
    check: (c) => c.strategyA === 'gtft' || c.strategyB === 'gtft',
  },
  {
    id: 'c4',
    title: 'payoff를 조정해 이론 최적 관용도를 0.5 이상으로 만들기',
    check: (c) => optimalGenerosity(c.payoff) >= 0.5,
  },
]
