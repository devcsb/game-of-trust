import type { PayoffMatrix } from '../core/types'
import type { StrategyId } from '../core/strategy/Strategy'
import { STANDARD_PAYOFF } from '../core/payoff'

export interface AppConfig {
  scenarioId: string
  strategyA: StrategyId
  strategyB: StrategyId
  generosity: number
  executionNoise: number
  perceptionNoise: number
  payoff: PayoffMatrix
  rounds: number
  seed: number
}

export const DEFAULT_CONFIG: AppConfig = {
  scenarioId: 'abstract',
  strategyA: 'tft',
  strategyB: 'tft',
  generosity: 1 / 3,
  executionNoise: 0.05,
  perceptionNoise: 0,
  payoff: STANDARD_PAYOFF,
  rounds: 50,
  seed: 42,
}

export const STRATEGY_LABELS: Record<StrategyId, string> = {
  allc: 'Always Cooperate',
  alld: 'Always Defect',
  random: 'Random',
  tft: 'Tit for Tat',
  gtft: 'Generous TFT',
  tf2t: 'Tit for Two Tats',
  grudger: 'Grudger',
  pavlov: 'Pavlov (WSLS)',
}
