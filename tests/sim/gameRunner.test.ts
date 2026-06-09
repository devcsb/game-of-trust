import { describe, it, expect } from 'vitest'
import { createGameRunner, computeStars } from '../../src/sim/gameRunner'
import { STANDARD_PAYOFF } from '../../src/core/payoff'
import type { GameRunnerOptions } from '../../src/sim/gameRunner'
import type { Move } from '../../src/core/types'

const opts = (over: Partial<GameRunnerOptions> = {}): GameRunnerOptions => ({
  opponentId: 'tft',
  rounds: 10,
  payoff: STANDARD_PAYOFF,
  executionNoise: 0,
  seed: 1,
  ...over,
})

describe('gameRunner', () => {
  it('deterministic: same seed + same player moves → identical results', () => {
    const moves: Move[] = ['C', 'C', 'D', 'C', 'D', 'C', 'C', 'D', 'C', 'C']
    const run = () => {
      const g = createGameRunner(opts({ executionNoise: 0.2, seed: 7 }))
      return moves.map((m) => g.playRound(m))
    }
    expect(run()).toEqual(run())
  })

  it('player always cooperates vs TFT (noise 0) → mutual cooperation, R*rounds each', () => {
    const g = createGameRunner(opts())
    for (let i = 0; i < 10; i++) g.playRound('C')
    expect(g.playerScore).toBe(3 * 10)
    expect(g.opponentScore).toBe(3 * 10)
  })

  it('player always defects vs TFT (noise 0) → T once then mutual P', () => {
    const g = createGameRunner(opts())
    for (let i = 0; i < 10; i++) g.playRound('D')
    // 1라운드: 상대 첫 협력 → T=5, 이후 상대 보복 → P=1 ×9
    expect(g.playerScore).toBe(5 + 9 * 1)
  })

  it('execution noise 1.0 always flips the player move', () => {
    const g = createGameRunner(opts({ executionNoise: 1 }))
    const r = g.playRound('C')
    expect(r.playerMoveFlipped).toBe(true)
    expect(r.playerPlayed).toBe('D')
  })

  it('throws after the game is over', () => {
    const g = createGameRunner(opts({ rounds: 1 }))
    g.playRound('C')
    expect(() => g.playRound('C')).toThrow()
  })

  it('computeStars respects thresholds', () => {
    expect(computeStars(3, [5, 15, 25])).toBe(0)
    expect(computeStars(10, [5, 15, 25])).toBe(1)
    expect(computeStars(20, [5, 15, 25])).toBe(2)
    expect(computeStars(30, [5, 15, 25])).toBe(3)
  })
})
