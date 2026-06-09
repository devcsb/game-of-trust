import type { GameRoundResult } from '../sim/gameRunner'
import { roundWelfare, MAX_WELFARE_PER_ROUND } from './world'

export interface WelfareMessage {
  headline: string
  tone: 'bloom' | 'leak' | 'collapse'
  delta: number // 이번 라운드가 더한 사회후생
  lost: number // 6 대비 사라진 파이
}

/** 라운드 결과를 "함께 만든 파이" 프레임 문구로. 일방배신은 손실을 명시. */
export function welfareMessage(r: GameRoundResult): WelfareMessage {
  const delta = roundWelfare(r)
  const lost = MAX_WELFARE_PER_ROUND - delta
  const me = r.playerPlayed
  const op = r.opponentPlayed
  if (me === 'C' && op === 'C') {
    return { headline: '함께 +6 — 파이가 가장 커졌어요', tone: 'bloom', delta, lost }
  }
  if (me === 'D' && op === 'C') {
    return { headline: '너만 +5, 하지만 파이는 1 줄었어요', tone: 'leak', delta, lost }
  }
  if (me === 'C' && op === 'D') {
    return { headline: '상대가 가져가 +5, 파이는 1 손실', tone: 'leak', delta, lost }
  }
  return { headline: '둘 다 배신 — 파이가 2로 쪼그라들었어요', tone: 'collapse', delta, lost }
}
