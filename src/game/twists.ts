import type { GameRoundResult } from '../sim/gameRunner'

/**
 * 스테이지 시그니처 텔(tell)의 순수 파생. 전부 history에서만 계산한다.
 * 코어 전략의 내부 상태를 들여다보지 않고, 관찰 가능한 사실로만 재구성한다.
 */

/**
 * 복수귀 도화선. 상대(grudger)는 내 수를 다음 라운드 시작 시점에 인식하므로,
 * 아직 정정(재전송) 가능한 마지막 라운드의 D도 "점화 예정"으로 본다 —
 * 재전송으로 끌 수 있는 불꽃이라는 연출이 정확히 성립한다.
 */
export function fuseLit(history: readonly GameRoundResult[]): boolean {
  return history.some((r) => r.playerPlayed === 'D')
}

/**
 * 용서받은 횟수: 직전 라운드에 내 D가 전달됐는데도 상대가 협력을 "의도"한 횟수.
 * (gtft의 관용이 가시화되는 지점. 의도 기준이라 노이즈와 무관하다.)
 */
export function forgivenessCount(history: readonly GameRoundResult[]): number {
  let n = 0
  for (let i = 1; i < history.length; i++) {
    if (history[i - 1].playerPlayed === 'D' && history[i].opponentIntended === 'C') n++
  }
  return n
}

/**
 * 변덕쟁이(Pavlov, Win-Stay Lose-Shift) 기분 풍향계.
 * 상대는 내 전달된 수가 C면 만족(유지), D면 불만(전환).
 */
export function pavlovMood(history: readonly GameRoundResult[]): 'stay' | 'shift' | null {
  if (history.length === 0) return null
  return history[history.length - 1].playerPlayed === 'C' ? 'stay' : 'shift'
}
