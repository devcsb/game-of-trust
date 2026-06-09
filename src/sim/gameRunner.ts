import type { Move, PayoffMatrix } from '../core/types'
import { applyNoise } from '../core/noise'
import { mulberry32 } from '../core/rng'
import type { RNG } from '../core/rng'
import { makeStrategy } from '../core/strategy/registry'
import type { Strategy, StrategyId, StrategyParams } from '../core/strategy/Strategy'

export interface GameRoundResult {
  round: number
  playerIntended: Move
  playerPlayed: Move // 통신 오류(execution noise) 적용 후 실제 전달된 수
  playerMoveFlipped: boolean // 내 의도가 노이즈로 뒤집혔는가 (연출 트리거)
  opponentPlayed: Move
  payoff: [number, number] // [player, opponent]
  playerScore: number // 누적
  opponentScore: number
}

export interface GameRunnerOptions {
  opponentId: StrategyId
  opponentParams?: StrategyParams
  rounds: number
  payoff: PayoffMatrix
  executionNoise: number
  seed: number
}

export interface GameRunner {
  playRound(playerMove: Move): GameRoundResult
  readonly round: number
  readonly done: boolean
  readonly playerScore: number
  readonly opponentScore: number
}

/**
 * 1인용 라운드 진행기. 사람=플레이어(외부 입력), AI=상대 전략(자동 응수).
 * RNG 소비 순서를 고정한다: 상대 의도 → 플레이어 실행노이즈 → 상대 실행노이즈.
 * (플레이어 의도는 사람이라 RNG를 쓰지 않는다. perception noise는 게임에서 0.)
 */
export function createGameRunner(opts: GameRunnerOptions): GameRunner {
  const opponent: Strategy = makeStrategy(opts.opponentId, opts.opponentParams)
  const rng: RNG = mulberry32(opts.seed)
  const { T, R, P, S } = opts.payoff

  let round = 0
  let playerScore = 0
  let opponentScore = 0

  // 상대(전략) 관점의 직전 정보. self=상대, opp=플레이어.
  let oppSelfLastIntended: Move | null = null
  let oppSelfLastPlayed: Move | null = null
  let oppPerceivedPlayerLast: Move | null = null

  function payoffFor(self: Move, other: Move): number {
    if (self === 'C') return other === 'C' ? R : S
    return other === 'C' ? T : P
  }

  function playRound(playerMove: Move): GameRoundResult {
    if (round >= opts.rounds) throw new Error('game is already over')

    const oppObs = {
      round,
      selfLastIntended: oppSelfLastIntended,
      selfLastPlayed: oppSelfLastPlayed,
      oppLastPerceived: oppPerceivedPlayerLast,
    }
    const opponentIntended = opponent.next(oppObs, rng)
    const playerPlayed = applyNoise(playerMove, opts.executionNoise, rng)
    const opponentPlayed = applyNoise(opponentIntended, opts.executionNoise, rng)
    const playerMoveFlipped = playerPlayed !== playerMove

    const pPay = payoffFor(playerPlayed, opponentPlayed)
    const oPay = payoffFor(opponentPlayed, playerPlayed)
    playerScore += pPay
    opponentScore += oPay

    const result: GameRoundResult = {
      round,
      playerIntended: playerMove,
      playerPlayed,
      playerMoveFlipped,
      opponentPlayed,
      payoff: [pPay, oPay],
      playerScore,
      opponentScore,
    }

    oppSelfLastIntended = opponentIntended
    oppSelfLastPlayed = opponentPlayed
    oppPerceivedPlayerLast = playerPlayed // perception noise 0
    round += 1
    return result
  }

  return {
    playRound,
    get round() {
      return round
    },
    get done() {
      return round >= opts.rounds
    },
    get playerScore() {
      return playerScore
    },
    get opponentScore() {
      return opponentScore
    },
  }
}

/** 누적 점수를 별 0~3으로. thresholds = [1별, 2별, 3별] 하한. */
export function computeStars(score: number, thresholds: [number, number, number]): number {
  if (score >= thresholds[2]) return 3
  if (score >= thresholds[1]) return 2
  if (score >= thresholds[0]) return 1
  return 0
}
