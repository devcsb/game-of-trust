import type { Move, Observation } from '../types'
import type { RNG } from '../rng'

export type StrategyId =
  | 'allc'
  | 'alld'
  | 'random'
  | 'tft'
  | 'gtft'
  | 'tf2t'
  | 'grudger'
  | 'pavlov'

/**
 * 전략 인스턴스. 내부 상태는 클로저로 보유하고, 매치마다 factory로 새로
 * 인스턴스를 만들어 상태를 격리한다. 결정성은 주입된 rng로 보장한다.
 */
export interface Strategy {
  readonly id: StrategyId
  readonly label: string
  next(obs: Observation, rng: RNG): Move
}

export interface StrategyParams {
  generosity?: number // GTFT 용서 확률 q (0..1)
}

export type StrategyFactory = (params?: StrategyParams) => Strategy
