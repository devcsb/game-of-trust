import { describe, it, expect } from 'vitest'
import {
  INSIGHT_START,
  applyPrediction,
  canAfford,
  spend,
  readAccuracy,
  STREAK_BONUS_EVERY,
} from '../../src/game/insight'

describe('insight (통찰 경제)', () => {
  it('적중 +1, 빗나가면 0점에 스트릭 리셋', () => {
    const hit = applyPrediction(INSIGHT_START, 'C', 'C')
    expect(hit.correct).toBe(true)
    expect(hit.next.points).toBe(1)
    expect(hit.next.streak).toBe(1)

    const miss = applyPrediction(hit.next, 'C', 'D')
    expect(miss.correct).toBe(false)
    expect(miss.next.points).toBe(1) // 잃지는 않는다
    expect(miss.next.streak).toBe(0)
    expect(miss.next.attempts).toBe(2)
  })

  it(`${STREAK_BONUS_EVERY}연속마다 보너스 +1`, () => {
    let s = INSIGHT_START
    let bonusCount = 0
    for (let i = 0; i < 6; i++) {
      const r = applyPrediction(s, 'C', 'C')
      if (r.bonus) bonusCount++
      s = r.next
    }
    expect(bonusCount).toBe(2) // 3연속, 6연속
    expect(s.points).toBe(6 + 2) // 적중 6 + 보너스 2
    expect(s.bestStreak).toBe(6)
  })

  it('bestStreak은 리셋 후에도 유지된다', () => {
    let s = INSIGHT_START
    for (let i = 0; i < 4; i++) s = applyPrediction(s, 'C', 'C').next
    s = applyPrediction(s, 'C', 'D').next
    expect(s.streak).toBe(0)
    expect(s.bestStreak).toBe(4)
  })

  it('spend는 잔액을 깎고, 부족하면 throw', () => {
    let s = INSIGHT_START
    for (let i = 0; i < 2; i++) s = applyPrediction(s, 'D', 'D').next
    expect(canAfford(s, 2)).toBe(true)
    s = spend(s, 2)
    expect(s.points).toBe(0)
    expect(() => spend(s, 1)).toThrow()
  })

  it('readAccuracy: 시도 없으면 null, 아니면 비율', () => {
    expect(readAccuracy(INSIGHT_START)).toBeNull()
    let s = applyPrediction(INSIGHT_START, 'C', 'C').next
    s = applyPrediction(s, 'C', 'D').next
    expect(readAccuracy(s)).toBe(0.5)
  })
})
