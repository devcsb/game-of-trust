import type { GameRoundResult } from '../sim/gameRunner'

const isMutualCoop = (r: GameRoundResult) =>
  r.playerPlayed === 'C' && r.opponentPlayed === 'C'

/** 히스토리 끝에서부터 연속 상호협력 길이. */
export function comboCount(history: readonly GameRoundResult[]): number {
  let n = 0
  for (let i = history.length - 1; i >= 0; i--) {
    if (isMutualCoop(history[i])) n++
    else break
  }
  return n
}
