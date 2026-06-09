import type { Move } from './types'
import type { RNG } from './rng'

export function flip(m: Move): Move {
  return m === 'C' ? 'D' : 'C'
}

/**
 * 확률 p로 move를 뒤집는다. 실행 잡음(execution)과 인식 잡음(perception)
 * 모두 같은 연산이고, 차이는 match 러너가 어디서 호출하느냐에 있다.
 */
export function applyNoise(move: Move, p: number, rng: RNG): Move {
  return p > 0 && rng.next() < p ? flip(move) : move
}
