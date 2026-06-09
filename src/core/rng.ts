/** 시드 가능한 난수 생성기. Math.random은 시드 불가라 재현성이 깨져 금지. */
export interface RNG {
  next(): number // [0, 1)
  fork(salt: number): RNG // 독립 하위 스트림 (매치별 격리)
}

/** 문자열 시드를 32비트 정수로 해시 */
export function xmur3(str: string): number {
  let h = 1779033703 ^ str.length
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353)
    h = (h << 13) | (h >>> 19)
  }
  h = Math.imul(h ^ (h >>> 16), 2246822507)
  h = Math.imul(h ^ (h >>> 13), 3266489909)
  return (h ^= h >>> 16) >>> 0
}

export function mulberry32(seed: number): RNG {
  let a = seed >>> 0
  return {
    next() {
      a |= 0
      a = (a + 0x6d2b79f5) | 0
      let t = Math.imul(a ^ (a >>> 15), 1 | a)
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296
    },
    fork(salt: number): RNG {
      return mulberry32((seed ^ Math.imul(salt, 0x9e3779b1)) >>> 0)
    },
  }
}

export function rngFromSeed(seed: number | string): RNG {
  const s = typeof seed === 'string' ? xmur3(seed) : seed >>> 0
  return mulberry32(s)
}
