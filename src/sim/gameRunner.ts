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
  opponentIntended: Move // 상대가 의도한 수 (예측 채점 기준)
  opponentPlayed: Move
  opponentMoveFlipped: boolean
  payoff: [number, number] // [player, opponent]
  playerScore: number // 누적
  opponentScore: number
  amended?: boolean // 재전송으로 정정된 라운드
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
  /** 상대 의도를 계산해 보관한다 (RNG 1회 소비). 이미 시작된 라운드가 있으면 throw. */
  beginRound(): void
  /** 시작된 라운드의 상대 의도를 읽는다 (엿보기). RNG 소비 없음. */
  peekOpponentIntent(): Move
  /** 시작된 라운드에 내 수를 내고 정산한다. */
  commitRound(playerMove: Move): GameRoundResult
  /**
   * 재전송: 직전 라운드의 내 수가 노이즈로 뒤집혔을 때, playerPlayed := playerIntended로
   * 재정산한다. RNG 소비 없음. 다음 beginRound 이후이거나 뒤집힌 라운드가 아니면 throw.
   * (상대는 내 수를 다음 beginRound에서만 읽으므로 합법적인 정정 윈도우다.)
   */
  amendLastRound(): GameRoundResult
  /** begin + commit. 기존 API 호환. */
  playRound(playerMove: Move): GameRoundResult
  readonly round: number
  readonly done: boolean
  /** beginRound 후 commitRound 전이면 true. */
  readonly roundPending: boolean
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

  let pendingIntent: Move | null = null // beginRound가 계산한 상대 의도
  let lastResult: GameRoundResult | null = null
  let lastAmendable = false // 직전 라운드가 재전송 가능한가 (내 수가 뒤집혔고 아직 정정 전)

  function payoffFor(self: Move, other: Move): number {
    if (self === 'C') return other === 'C' ? R : S
    return other === 'C' ? T : P
  }

  function beginRound(): void {
    if (round >= opts.rounds) throw new Error('game is already over')
    if (pendingIntent !== null) throw new Error('round already begun')
    const oppObs = {
      round,
      selfLastIntended: oppSelfLastIntended,
      selfLastPlayed: oppSelfLastPlayed,
      oppLastPerceived: oppPerceivedPlayerLast,
    }
    pendingIntent = opponent.next(oppObs, rng)
  }

  function peekOpponentIntent(): Move {
    if (pendingIntent === null) throw new Error('no round in progress')
    return pendingIntent
  }

  function commitRound(playerMove: Move): GameRoundResult {
    if (pendingIntent === null) throw new Error('no round in progress')
    const opponentIntended = pendingIntent
    pendingIntent = null

    const playerPlayed = applyNoise(playerMove, opts.executionNoise, rng)
    const opponentPlayed = applyNoise(opponentIntended, opts.executionNoise, rng)
    const playerMoveFlipped = playerPlayed !== playerMove
    const opponentMoveFlipped = opponentPlayed !== opponentIntended

    const pPay = payoffFor(playerPlayed, opponentPlayed)
    const oPay = payoffFor(opponentPlayed, playerPlayed)
    playerScore += pPay
    opponentScore += oPay

    const result: GameRoundResult = {
      round,
      playerIntended: playerMove,
      playerPlayed,
      playerMoveFlipped,
      opponentIntended,
      opponentPlayed,
      opponentMoveFlipped,
      payoff: [pPay, oPay],
      playerScore,
      opponentScore,
    }

    oppSelfLastIntended = opponentIntended
    oppSelfLastPlayed = opponentPlayed
    oppPerceivedPlayerLast = playerPlayed // perception noise 0
    round += 1
    lastResult = result
    lastAmendable = playerMoveFlipped
    return result
  }

  function amendLastRound(): GameRoundResult {
    if (!lastResult) throw new Error('no round to amend')
    if (pendingIntent !== null) throw new Error('next round already begun')
    if (!lastAmendable) throw new Error('last round is not amendable')

    const fixedPlayed = lastResult.playerIntended
    const pPay = payoffFor(fixedPlayed, lastResult.opponentPlayed)
    const oPay = payoffFor(lastResult.opponentPlayed, fixedPlayed)
    playerScore += pPay - lastResult.payoff[0]
    opponentScore += oPay - lastResult.payoff[1]

    const amendedResult: GameRoundResult = {
      ...lastResult,
      playerPlayed: fixedPlayed,
      playerMoveFlipped: false,
      payoff: [pPay, oPay],
      playerScore,
      opponentScore,
      amended: true,
    }
    oppPerceivedPlayerLast = fixedPlayed // 상대는 다음 라운드에서 정정된 수를 본다
    lastResult = amendedResult
    lastAmendable = false
    return amendedResult
  }

  function playRound(playerMove: Move): GameRoundResult {
    beginRound()
    return commitRound(playerMove)
  }

  return {
    beginRound,
    peekOpponentIntent,
    commitRound,
    amendLastRound,
    playRound,
    get round() {
      return round
    },
    get done() {
      return round >= opts.rounds
    },
    get roundPending() {
      return pendingIntent !== null
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
