import type { Strategy, StrategyFactory, StrategyId, StrategyParams } from './Strategy'
import { allc, alld, random, tft, gtft, tf2t, grudger, pavlov } from './strategies'
import { compileCustom } from './custom'
import type { CustomStrategyDef } from './custom'

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

/**
 * 전략을 지칭하는 직렬화 가능한 값. 빌트인은 기존 { id } 리터럴 그대로,
 * 플레이어 제작 전략은 { custom } 으로 — match/evolution이 동일하게 소비한다.
 */
export type StrategySpec =
  | { id: StrategyId; params?: StrategyParams; custom?: undefined }
  | { custom: CustomStrategyDef; id?: undefined }

/** 매 호출마다 새 인스턴스(클로저)를 만들어 상태를 격리한다. */
export function resolveStrategy(spec: StrategySpec): Strategy {
  if (spec.custom) return compileCustom(spec.custom)
  return makeStrategy(spec.id, spec.params)
}
