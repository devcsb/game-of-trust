import { describe, it, expect } from 'vitest'
import {
  STANDARD_PAYOFF,
  validatePayoff,
  isValidPayoff,
  optimalGenerosity,
} from '../../src/core/payoff'

describe('payoff validation', () => {
  it('standard payoff (5,3,1,0) is valid', () => {
    expect(() => validatePayoff(STANDARD_PAYOFF)).not.toThrow()
    expect(isValidPayoff(STANDARD_PAYOFF)).toBe(true)
  })

  it('rejects T <= R', () => {
    expect(() => validatePayoff({ T: 3, R: 3, P: 1, S: 0 })).toThrow()
    expect(isValidPayoff({ T: 3, R: 3, P: 1, S: 0 })).toBe(false)
  })

  it('rejects 2R <= T+S (no mutual-cooperation incentive)', () => {
    // 2R=6, T+S=7 -> 위반
    expect(isValidPayoff({ T: 7, R: 3, P: 1, S: 0 })).toBe(false)
  })
})

describe('optimalGenerosity (Nowak-Sigmund)', () => {
  it('= 1/3 for standard payoff', () => {
    expect(optimalGenerosity(STANDARD_PAYOFF)).toBeCloseTo(1 / 3, 10)
  })

  it('moves away from 1/3 for non-standard payoff (not a universal law)', () => {
    // T=4,R=3,P=1,S=0: a=1-(1)/(3)=2/3, b=(2)/(3)=2/3 -> 2/3
    const q = optimalGenerosity({ T: 4, R: 3, P: 1, S: 0 })
    expect(q).toBeCloseTo(2 / 3, 10)
    expect(q).not.toBeCloseTo(1 / 3, 2)
  })
})
