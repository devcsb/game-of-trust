import type { Move } from '../core/types'

/**
 * 통찰(Insight) 경제. 매 라운드 상대의 다음 수를 예측해 맞히면 적립하고,
 * 엿보기·재전송 같은 행동에 소비한다. 점수(보수)와는 완전히 분리된 자원이다.
 */
export interface InsightState {
  points: number // 현재 보유 통찰
  attempts: number // 예측 시도 수
  hits: number // 적중 수
  streak: number // 현재 연속 적중
  bestStreak: number
}

export const INSIGHT_START: InsightState = {
  points: 0,
  attempts: 0,
  hits: 0,
  streak: 0,
  bestStreak: 0,
}

/** N연속 적중마다 보너스 +1 */
export const STREAK_BONUS_EVERY = 3

/** 기본 행동 비용 */
export const PEEK_COST = 2
export const RESEND_COST = 2

/**
 * 예측을 채점한다. 채점 기준은 상대의 "의도"(intended) — 노이즈로 뒤집힌 전달이 아니라
 * 전략 읽기 자체를 평가한다. 적중 +1, STREAK_BONUS_EVERY 연속마다 보너스 +1.
 */
export function applyPrediction(
  s: InsightState,
  predicted: Move,
  intended: Move,
): { next: InsightState; correct: boolean; bonus: boolean } {
  const correct = predicted === intended
  if (!correct) {
    return {
      next: { ...s, attempts: s.attempts + 1, streak: 0 },
      correct,
      bonus: false,
    }
  }
  const streak = s.streak + 1
  const bonus = streak % STREAK_BONUS_EVERY === 0
  const next: InsightState = {
    points: s.points + 1 + (bonus ? 1 : 0),
    attempts: s.attempts + 1,
    hits: s.hits + 1,
    streak,
    bestStreak: Math.max(s.bestStreak, streak),
  }
  return { next, correct, bonus }
}

export function canAfford(s: InsightState, cost: number): boolean {
  return s.points >= cost
}

export function spend(s: InsightState, cost: number): InsightState {
  if (!canAfford(s, cost)) throw new Error('not enough insight')
  return { ...s, points: s.points - cost }
}

/** 읽기 정확도 0..1. 시도가 없으면 null. */
export function readAccuracy(s: InsightState): number | null {
  return s.attempts === 0 ? null : s.hits / s.attempts
}
