import type { GameRoundResult } from '../sim/gameRunner'

export type Mood = 'happy' | 'neutral' | 'wary' | 'angry' | 'smug'

/**
 * 상대 아바타의 표정. "방금 끝난 라운드 결과" 기준.
 * 비교는 실제 전달된 수(played) 기준이라 통신 오류가 표정에 반영된다.
 */
export function opponentMood(last: GameRoundResult | null): Mood {
  if (!last) return 'neutral'
  const me = last.playerPlayed
  const op = last.opponentPlayed
  if (me === 'C' && op === 'C') return 'happy'
  if (me === 'D' && op === 'C') return 'angry' // 상대가 협력했는데 내가 배신 → 화남
  if (me === 'C' && op === 'D') return 'smug' // 상대가 나를 등쳐먹음 → 능글
  return 'wary' // 상호 배신
}

/** 플레이어 측 표정(대칭). */
export function playerMood(last: GameRoundResult | null): Mood {
  if (!last) return 'neutral'
  const me = last.playerPlayed
  const op = last.opponentPlayed
  if (me === 'C' && op === 'C') return 'happy'
  if (me === 'C' && op === 'D') return 'angry' // 내가 당함
  if (me === 'D' && op === 'C') return 'smug' // 내가 등쳐먹음
  return 'wary'
}
