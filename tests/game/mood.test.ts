import { describe, it, expect } from 'vitest'
import { opponentMood, playerMood } from '../../src/game/mood'
import { round } from '../_fixtures'

describe('mood', () => {
  it('null → neutral', () => {
    expect(opponentMood(null)).toBe('neutral')
  })
  it('상호협력 → happy', () => {
    expect(opponentMood(round('C', 'C'))).toBe('happy')
  })
  it('내가 배신, 상대 협력 → angry', () => {
    expect(opponentMood(round('D', 'C'))).toBe('angry')
  })
  it('내가 협력, 상대 배신 → smug', () => {
    expect(opponentMood(round('C', 'D'))).toBe('smug')
  })
  it('상호배신 → wary', () => {
    expect(opponentMood(round('D', 'D'))).toBe('wary')
  })
  it('playerMood 대칭: 내가 협력 상대 배신 → angry', () => {
    expect(playerMood(round('C', 'D'))).toBe('angry')
  })
})
