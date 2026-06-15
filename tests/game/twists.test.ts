import { describe, it, expect } from 'vitest'
import { fuseLit, forgivenessCount, pavlovMood } from '../../src/game/twists'
import { round } from '../_fixtures'

describe('twists (스테이지 텔 파생)', () => {
  it('fuseLit: 내 D가 한 번이라도 전달되면 점화', () => {
    expect(fuseLit([])).toBe(false)
    expect(fuseLit([round('C', 'C'), round('C', 'D')])).toBe(false)
    expect(fuseLit([round('C', 'C'), round('D', 'C')])).toBe(true)
  })

  it('fuseLit: 재전송으로 정정된 라운드는 점화하지 않는다', () => {
    const amended = { ...round('C', 'C'), amended: true } // playerPlayed가 C로 정정됨
    expect(fuseLit([amended])).toBe(false)
  })

  it('forgivenessCount: 내 D 직후 상대가 협력을 의도한 횟수', () => {
    const h = [
      round('D', 'C', 0), // 내 D 전달
      round('C', 'C', 1), // 상대 의도 C → 용서 1
      round('D', 'C', 2), // 내 D 전달
      round('C', 'D', 3), // 상대 의도 D → 보복
    ]
    expect(forgivenessCount(h)).toBe(1)
  })

  it('pavlovMood: 직전 내 수가 C면 stay, D면 shift', () => {
    expect(pavlovMood([])).toBeNull()
    expect(pavlovMood([round('C', 'C')])).toBe('stay')
    expect(pavlovMood([round('D', 'C')])).toBe('shift')
  })
})
