import type { StrategySpec } from '../core/strategy/registry'
import type { StrategyId } from '../core/strategy/Strategy'
import type { AvatarKind } from './Avatar'

/** 빌트인 전략 → 표정 SVG 종류. GamePlay의 매핑을 공유 가능하게 추출. */
export const KIND_BY_STRATEGY: Record<StrategyId, AvatarKind> = {
  allc: 'sucker',
  alld: 'villain',
  tft: 'mirror',
  grudger: 'grudger',
  gtft: 'generous',
  random: 'coin',
  tf2t: 'generous',
  pavlov: 'fickle',
}

/** 안개 속 상대(StrategySpec)의 표정 SVG 종류. 커스텀은 거울 얼굴로 대체. */
export function kindForSpec(spec: StrategySpec): AvatarKind {
  if (spec.custom) return 'mirror'
  return KIND_BY_STRATEGY[spec.id]
}
