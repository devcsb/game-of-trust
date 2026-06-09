import type { MatchConfig, PayoffMatrix } from '../core/types'
import { runMatch } from './match'
import type { MatchPlayer } from './match'
import { mulberry32 } from '../core/rng'
import type { StrategyId } from '../core/strategy/Strategy'

export interface SweepOptions {
  payoff: PayoffMatrix
  rounds: number
  seed: number
  qSteps: number
  noiseSteps: number
  maxNoise: number
  opponents: StrategyId[] // GTFT(q)가 대결할 고정 상대 풀
}

export interface SweepResult {
  qValues: number[]
  noiseValues: number[]
  scores: number[][] // [qi][nj] = GTFT(q)의 상대 풀 평균 점수/라운드
  min: number
  max: number
  argmaxQByNoise: number[] // 각 noise 열에서 점수를 최대화하는 q (실측 최적)
}

/**
 * GTFT(q)를 고정 상대 풀과 대결시켜 (q × noise) 그리드의 평균 점수를 측정한다.
 * AllD가 풀에 있으면 과한 관용에 상한 압력이, 협력형 상대 + noise는 관용에
 * 하한 압력이 생겨 내부 최적점이 드러난다.
 */
export function sweepGenerosityNoise(opts: SweepOptions): SweepResult {
  const { payoff, rounds, seed, qSteps, noiseSteps, maxNoise, opponents } = opts

  const qValues = Array.from({ length: qSteps }, (_, i) =>
    qSteps === 1 ? 0 : i / (qSteps - 1),
  )
  const noiseValues = Array.from({ length: noiseSteps }, (_, j) =>
    noiseSteps === 1 ? 0 : (j / (noiseSteps - 1)) * maxNoise,
  )

  const scores: number[][] = []
  let min = Infinity
  let max = -Infinity
  const argmaxQByNoise = new Array<number>(noiseSteps).fill(0)
  const bestByNoise = new Array<number>(noiseSteps).fill(-Infinity)

  for (let qi = 0; qi < qSteps; qi++) {
    const q = qValues[qi]
    const row: number[] = []
    for (let nj = 0; nj < noiseSteps; nj++) {
      const noise = noiseValues[nj]
      let total = 0
      for (let oi = 0; oi < opponents.length; oi++) {
        const cfg: MatchConfig = {
          rounds,
          payoff,
          executionNoise: noise,
          perceptionNoise: 0,
          seed: seed + qi * 1009 + nj * 31 + oi,
        }
        const me: MatchPlayer = { id: 'gtft', params: { generosity: q } }
        const opp: MatchPlayer = { id: opponents[oi] }
        const out = runMatch(me, opp, cfg, mulberry32(cfg.seed))
        total += out.avgPerRound[0]
      }
      const avg = total / opponents.length
      row.push(avg)
      if (avg < min) min = avg
      if (avg > max) max = avg
      if (avg > bestByNoise[nj]) {
        bestByNoise[nj] = avg
        argmaxQByNoise[nj] = q
      }
    }
    scores.push(row)
  }

  return { qValues, noiseValues, scores, min, max, argmaxQByNoise }
}
