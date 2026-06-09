import type { PayoffMatrix } from './types'

/** Axelrod 표준값. 1/3 최적 관용도가 나오는 특수해일 뿐 보편값이 아니다. */
export const STANDARD_PAYOFF: PayoffMatrix = { T: 5, R: 3, P: 1, S: 0 }

export function isValidPayoff(p: PayoffMatrix): boolean {
  return p.T > p.R && p.R > p.P && p.P > p.S && 2 * p.R > p.T + p.S
}

export function validatePayoff(p: PayoffMatrix): void {
  if (!(p.T > p.R && p.R > p.P && p.P > p.S)) {
    throw new Error(`PD requires T>R>P>S, got T=${p.T} R=${p.R} P=${p.P} S=${p.S}`)
  }
  if (!(2 * p.R > p.T + p.S)) {
    throw new Error(`IPD requires 2R>T+S, got 2R=${2 * p.R} T+S=${p.T + p.S}`)
  }
}

/**
 * Nowak & Sigmund (1992) generous tit-for-tat 최적 용서 확률.
 * q* = min{1 - (T-R)/(R-S), (R-P)/(T-P)}
 * payoff에 의존한다. 표준값(5,3,1,0)에서만 1/3이다.
 */
export function optimalGenerosity(p: PayoffMatrix): number {
  const a = 1 - (p.T - p.R) / (p.R - p.S)
  const b = (p.R - p.P) / (p.T - p.P)
  return Math.max(0, Math.min(a, b))
}
