import type { GameRoundResult } from '../sim/gameRunner'

export const TRUST_START = 50

/** 라운드 한 건의 신뢰 증감. 실제 전달된 수(played) 기준. */
export function trustDelta(r: GameRoundResult): number {
  const me = r.playerPlayed
  const op = r.opponentPlayed
  if (me === 'C' && op === 'C') return +10 // 상호 협력: 신뢰 쌓임
  if (me === 'D' && op === 'D') return -8 // 상호 배신: 깎임
  return -14 // 일방 배신: 신뢰 파괴가 가장 큼 (가중)
}

const clamp = (v: number) => Math.max(0, Math.min(100, v))

/** 히스토리 누적 신뢰도. 매 라운드 0~100 clamp(바닥/천장이 즉시 회복되지 않도록). */
export function trustFromHistory(history: readonly GameRoundResult[]): number {
  let t = TRUST_START
  for (const r of history) t = clamp(t + trustDelta(r))
  return t
}

export type TrustBand = 'broken' | 'tense' | 'neutral' | 'warm' | 'bonded'

export function trustBand(t: number): TrustBand {
  if (t < 20) return 'broken'
  if (t < 40) return 'tense'
  if (t < 60) return 'neutral'
  if (t < 85) return 'warm'
  return 'bonded'
}
