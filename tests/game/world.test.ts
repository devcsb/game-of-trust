import { describe, it, expect } from 'vitest'
import { worldFromHistory, cellState, roundWelfare, worldTone } from '../../src/game/world'
import { round } from '../_fixtures'

describe('world: 사회후생', () => {
  it('roundWelfare: 협력 6, 일방 5, 상호배신 2', () => {
    expect(roundWelfare(round('C', 'C'))).toBe(6)
    expect(roundWelfare(round('D', 'C'))).toBe(5)
    expect(roundWelfare(round('C', 'D'))).toBe(5)
    expect(roundWelfare(round('D', 'D'))).toBe(2)
  })

  it('cellState: CC=bloom, 일방=sprout, DD=barren', () => {
    expect(cellState(round('C', 'C'))).toBe('bloom')
    expect(cellState(round('D', 'C'))).toBe('sprout')
    expect(cellState(round('C', 'D'))).toBe('sprout')
    expect(cellState(round('D', 'D'))).toBe('barren')
  })

  it('누적: CC,DC,DD → total 13, potential 18, lost 5, bloomRatio 1/3', () => {
    const w = worldFromHistory([round('C', 'C'), round('D', 'C'), round('D', 'D')])
    expect(w.totalWelfare).toBe(13)
    expect(w.potentialWelfare).toBe(18)
    expect(w.lostWelfare).toBe(5)
    expect(w.bloomRatio).toBeCloseTo(1 / 3)
  })

  it('빈 히스토리는 0', () => {
    const w = worldFromHistory([])
    expect(w.totalWelfare).toBe(0)
    expect(w.potentialWelfare).toBe(0)
    expect(w.bloomRatio).toBe(0)
    expect(w.lastDelta).toBeNull()
  })

  it('worldTone 경계', () => {
    expect(worldTone(0)).toBe('wasteland')
    expect(worldTone(0.5)).toBe('reviving')
    expect(worldTone(0.7)).toBe('thriving')
    expect(worldTone(1)).toBe('flourishing')
  })

  // 핵심: 일방배신은 반드시 "손실"이어야 한다 (교육 정직성).
  it('단조성: 협력 라운드를 일방배신으로 바꾸면 lostWelfare가 증가한다', () => {
    const allCoop = worldFromHistory([round('C', 'C'), round('C', 'C'), round('C', 'C')])
    const oneDefect = worldFromHistory([round('C', 'C'), round('D', 'C'), round('C', 'C')])
    expect(allCoop.lostWelfare).toBe(0)
    expect(oneDefect.lostWelfare).toBeGreaterThan(allCoop.lostWelfare)
    // 달성률(total/potential)도 떨어진다
    expect(oneDefect.totalWelfare / oneDefect.potentialWelfare).toBeLessThan(
      allCoop.totalWelfare / allCoop.potentialWelfare,
    )
  })

  it('단조성: 배신 라운드 추가는 누적 손실을 늘리고, 협력 라운드 추가는 손실이 불변', () => {
    const base = worldFromHistory([round('C', 'C'), round('D', 'D'), round('C', 'C')])
    const addCoop = worldFromHistory([
      round('C', 'C'),
      round('D', 'D'),
      round('C', 'C'),
      round('C', 'C'),
    ])
    const addDefect = worldFromHistory([
      round('C', 'C'),
      round('D', 'D'),
      round('C', 'C'),
      round('D', 'C'),
    ])
    expect(addCoop.lostWelfare).toBe(base.lostWelfare) // 협력은 파이를 깎지 않는다
    expect(addDefect.lostWelfare).toBeGreaterThan(base.lostWelfare) // 배신은 파이를 깎는다
  })
})
