import type { MatchConfig, Move, Observation, RoundResult } from '../core/types'
import { applyNoise } from '../core/noise'
import type { RNG } from '../core/rng'
import { resolveStrategy } from '../core/strategy/registry'
import type { StrategySpec } from '../core/strategy/registry'

/** 기존 { id, params? } 리터럴과 구조적으로 호환된다. 커스텀 전략은 { custom }. */
export type MatchPlayer = StrategySpec

export interface MatchOutcome {
  rounds: RoundResult[]
  score: [number, number]
  avgPerRound: [number, number]
}

function payoffFor(self: Move, opp: Move, T: number, R: number, P: number, S: number): number {
  if (self === 'C') return opp === 'C' ? R : S
  return opp === 'C' ? T : P
}

/**
 * 두 전략의 N라운드 매치. 노이즈는 전략 밖(여기)에서만 주입한다.
 * RNG 소비 순서가 재현성 계약이라 절대 바꾸지 않는다:
 *   A의도 → B의도 → A실행 → B실행 → A가 본 B → B가 본 A
 */
export function runMatch(
  a: MatchPlayer,
  b: MatchPlayer,
  cfg: MatchConfig,
  rng: RNG,
): MatchOutcome {
  const sa = resolveStrategy(a)
  const sb = resolveStrategy(b)
  const { T, R, P, S } = cfg.payoff

  const rounds: RoundResult[] = []
  let scoreA = 0
  let scoreB = 0

  let aLastIntended: Move | null = null
  let aLastPlayed: Move | null = null
  let bLastIntended: Move | null = null
  let bLastPlayed: Move | null = null
  let aPerceivedOppLast: Move | null = null
  let bPerceivedOppLast: Move | null = null

  for (let round = 0; round < cfg.rounds; round++) {
    const obsA: Observation = {
      round,
      selfLastIntended: aLastIntended,
      selfLastPlayed: aLastPlayed,
      oppLastPerceived: aPerceivedOppLast,
    }
    const obsB: Observation = {
      round,
      selfLastIntended: bLastIntended,
      selfLastPlayed: bLastPlayed,
      oppLastPerceived: bPerceivedOppLast,
    }

    const intendedA = sa.next(obsA, rng)
    const intendedB = sb.next(obsB, rng)
    const playedA = applyNoise(intendedA, cfg.executionNoise, rng)
    const playedB = applyNoise(intendedB, cfg.executionNoise, rng)
    const aSeesB = applyNoise(playedB, cfg.perceptionNoise, rng)
    const bSeesA = applyNoise(playedA, cfg.perceptionNoise, rng)

    const payoffA = payoffFor(playedA, playedB, T, R, P, S)
    const payoffB = payoffFor(playedB, playedA, T, R, P, S)
    scoreA += payoffA
    scoreB += payoffB

    rounds.push({
      round,
      intended: [intendedA, intendedB],
      played: [playedA, playedB],
      perceived: [aSeesB, bSeesA],
      payoff: [payoffA, payoffB],
    })

    aLastIntended = intendedA
    aLastPlayed = playedA
    bLastIntended = intendedB
    bLastPlayed = playedB
    aPerceivedOppLast = aSeesB
    bPerceivedOppLast = bSeesA
  }

  return {
    rounds,
    score: [scoreA, scoreB],
    avgPerRound: [scoreA / cfg.rounds, scoreB / cfg.rounds],
  }
}
