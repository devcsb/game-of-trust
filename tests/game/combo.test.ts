import { describe, it, expect } from 'vitest'
import { comboCount } from '../../src/game/combo'
import { round } from '../_fixtures'

describe('combo', () => {
  it('빈 → 0', () => {
    expect(comboCount([])).toBe(0)
  })
  it('상호협력 2연속 → 2', () => {
    expect(comboCount([round('C', 'C'), round('C', 'C')])).toBe(2)
  })
  it('끝에서 끊기면 0', () => {
    expect(comboCount([round('C', 'C'), round('C', 'C'), round('D', 'D')])).toBe(0)
  })
  it('끝에서부터만 카운트', () => {
    expect(comboCount([round('D', 'D'), round('C', 'C')])).toBe(1)
  })
})
