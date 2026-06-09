import { describe, it, expect } from 'vitest'
import { mulberry32, rngFromSeed } from '../../src/core/rng'

describe('mulberry32 RNG', () => {
  it('same seed produces same sequence', () => {
    const a = mulberry32(42)
    const b = mulberry32(42)
    const seqA = Array.from({ length: 8 }, () => a.next())
    const seqB = Array.from({ length: 8 }, () => b.next())
    expect(seqA).toEqual(seqB)
  })

  it('all values in [0, 1)', () => {
    const r = mulberry32(7)
    for (let i = 0; i < 200; i++) {
      const v = r.next()
      expect(v).toBeGreaterThanOrEqual(0)
      expect(v).toBeLessThan(1)
    }
  })

  it('fork yields a different stream than parent', () => {
    const parent = mulberry32(1)
    const child = parent.fork(99)
    const ps = Array.from({ length: 5 }, () => parent.next())
    const cs = Array.from({ length: 5 }, () => child.next())
    expect(ps).not.toEqual(cs)
  })

  it('string seed is deterministic', () => {
    expect(rngFromSeed('hello').next()).toBe(rngFromSeed('hello').next())
    expect(rngFromSeed('hello').next()).not.toBe(rngFromSeed('world').next())
  })
})
