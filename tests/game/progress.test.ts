import { describe, it, expect } from 'vitest'
import { recordStageResult, isUnlocked } from '../../src/game/progress'
import type { ProgressMap } from '../../src/game/progress'

describe('progress', () => {
  it('merges best stars and best score (does not regress)', () => {
    let p: ProgressMap = {}
    p = recordStageResult(p, 's1', 2, 20)
    p = recordStageResult(p, 's1', 1, 30) // 별은 낮지만 점수는 높음
    expect(p.s1.bestStars).toBe(2)
    expect(p.s1.bestScore).toBe(30)
    expect(p.s1.cleared).toBe(true)
  })

  it('unlock chain: prev stage must be cleared', () => {
    const stages = [{ id: 's1' }, { id: 's2' }, { id: 's3' }]
    let p: ProgressMap = {}
    expect(isUnlocked(p, stages, 0)).toBe(true)
    expect(isUnlocked(p, stages, 1)).toBe(false)
    p = recordStageResult(p, 's1', 1, 10)
    expect(isUnlocked(p, stages, 1)).toBe(true)
    expect(isUnlocked(p, stages, 2)).toBe(false)
  })

  it('zero stars does not clear', () => {
    let p: ProgressMap = {}
    p = recordStageResult(p, 's1', 0, 2)
    expect(p.s1.cleared).toBe(false)
  })
})
