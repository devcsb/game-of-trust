import type { PayoffMatrix } from '../core/types'
import { runMatch } from './match'
import { mulberry32 } from '../core/rng'
import type { StrategyId } from '../core/strategy/Strategy'
import type { StrategySpec } from '../core/strategy/registry'

/** 종(種) 지칭: 빌트인 id 문자열 또는 StrategySpec(커스텀 포함). */
export type SpeciesRef = StrategyId | StrategySpec

export function toSpec(ref: SpeciesRef): StrategySpec {
  return typeof ref === 'string' ? { id: ref } : ref
}

export interface EvolutionConfig {
  strategies: SpeciesRef[]
  rounds: number // 전략쌍 매치당 라운드 수
  payoff: PayoffMatrix
  executionNoise: number
  seed: number
  generations: number
  initial?: number[] // 초기 인구 비율 (합 1). 생략 시 균등.
}

export interface EvolutionResult {
  strategies: SpeciesRef[]
  history: number[][] // [generation][strategyIndex] = 비율, 각 세대 합 1
  payoffMatrix: number[][] // A[i][j] = i가 j를 상대한 평균 점수/라운드
}

/** A[i][j] = strategies[i]가 strategies[j]를 상대로 얻는 평균 점수/라운드. */
export function buildPayoffMatrix(
  strategies: SpeciesRef[],
  rounds: number,
  payoff: PayoffMatrix,
  executionNoise: number,
  seed: number,
): number[][] {
  const n = strategies.length
  const A: number[][] = []
  for (let i = 0; i < n; i++) {
    A[i] = []
    for (let j = 0; j < n; j++) {
      const s = seed + i * 131 + j * 17
      const out = runMatch(
        toSpec(strategies[i]),
        toSpec(strategies[j]),
        { rounds, payoff, executionNoise, perceptionNoise: 0, seed: s },
        mulberry32(s),
      )
      A[i][j] = out.avgPerRound[0]
    }
  }
  return A
}

/** replicator dynamics 한 세대: x_i' = x_i · f_i / f̄, 재정규화. */
export function evolutionStep(x: number[], A: number[][]): number[] {
  const f = x.map((_, i) => A[i].reduce((acc, aij, j) => acc + aij * x[j], 0))
  const fbar = x.reduce((acc, xi, i) => acc + xi * f[i], 0)
  if (fbar <= 1e-12) return x.slice()
  const raw = x.map((xi, i) => (xi * f[i]) / fbar)
  const sum = raw.reduce((a, b) => a + b, 0)
  return raw.map((v) => v / sum)
}

export function runEvolution(cfg: EvolutionConfig): EvolutionResult {
  const A = buildPayoffMatrix(cfg.strategies, cfg.rounds, cfg.payoff, cfg.executionNoise, cfg.seed)
  const n = cfg.strategies.length
  let x = cfg.initial ? cfg.initial.slice() : new Array<number>(n).fill(1 / n)
  const history: number[][] = [x.slice()]
  for (let g = 0; g < cfg.generations; g++) {
    x = evolutionStep(x, A)
    history.push(x.slice())
  }
  return { strategies: cfg.strategies, history, payoffMatrix: A }
}
