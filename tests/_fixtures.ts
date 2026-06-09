import type { Move } from '../src/core/types'
import type { GameRoundResult } from '../src/sim/gameRunner'

/** 테스트용 GameRoundResult 생성. payoff는 표준값(T5 R3 P1 S0) 기준. */
export function round(me: Move, op: Move, n = 0): GameRoundResult {
  const payoff: [number, number] =
    me === 'C' ? (op === 'C' ? [3, 3] : [0, 5]) : op === 'C' ? [5, 0] : [1, 1]
  return {
    round: n,
    playerIntended: me,
    playerPlayed: me,
    playerMoveFlipped: false,
    opponentPlayed: op,
    payoff,
    playerScore: 0,
    opponentScore: 0,
  }
}
