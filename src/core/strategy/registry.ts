import type { Strategy, StrategyFactory, StrategyId, StrategyParams } from './Strategy'
import { allc, alld, random, tft, gtft, tf2t, grudger, pavlov } from './strategies'

export const STRATEGIES: Record<StrategyId, StrategyFactory> = {
  allc,
  alld,
  random,
  tft,
  gtft,
  tf2t,
  grudger,
  pavlov,
}

export const STRATEGY_IDS = Object.keys(STRATEGIES) as StrategyId[]

export function makeStrategy(id: StrategyId, params?: StrategyParams): Strategy {
  return STRATEGIES[id](params)
}
