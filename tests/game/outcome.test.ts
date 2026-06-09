import { describe, it, expect } from 'vitest'
import { welfareOutcome } from '../../src/game/outcome'

describe('welfareOutcome (공동 파이 목표)', () => {
  it('목표 이상이면 achieved', () => {
    expect(welfareOutcome(60, 54)).toBe('achieved')
    expect(welfareOutcome(54, 54)).toBe('achieved')
  })
  it('목표의 70% 이상이면 close', () => {
    expect(welfareOutcome(40, 54)).toBe('close') // 54*0.7=37.8
  })
  it('70% 미만이면 missed', () => {
    expect(welfareOutcome(30, 54)).toBe('missed')
  })
  it('목표가 null이면(악당) null 반환', () => {
    expect(welfareOutcome(20, null)).toBeNull()
  })
})
