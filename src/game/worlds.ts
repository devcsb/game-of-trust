import type { PayoffMatrix } from '../core/types'
import type { StrategySpec } from '../core/strategy/registry'

/**
 * "안개의 세계" — 피벗의 핵심 도메인. 상대의 스탠스가 라벨로 공개된 캠페인과 달리,
 * 세계는 정체를 숨긴 혼합 개체군이다. 플레이어는 단서만 보고 자신의 기본 전략 하나로
 * 불확실성(변동 보수, 불확실한 라운드 수, 통신 오류, 진화)에 맞서 수확을 극대화한다.
 */
export interface PopMember {
  /** 숨은 종. match/evolution이 그대로 소비하는 StrategySpec. */
  spec: StrategySpec
  /** 상대적 비중. 합이 1일 필요는 없다 — 사용 시점에 정규화한다. */
  weight: number
}

export interface FogWorld {
  id: string
  name: string // 추상적 이름 (정체를 숨긴다)
  glyph: string
  blurb: string // 분위기 한 줄
  /** 안개 속 단서. 정체를 직접 말하지 않고 성향만 암시한다. */
  hints: string[]
  /** 숨은 혼합 개체군 */
  population: PopMember[]
  /** 변동 보수 행렬 (세계마다 유혹/보상의 크기가 다르다) */
  payoff: PayoffMatrix
  /** 불확실한 라운드 수 [최소, 최대]. 커밋 시점엔 정확히 모른다. */
  roundsMin: number
  roundsMax: number
  /** 통신 오류 강도 */
  executionNoise: number
  perceptionNoise: number
  /**
   * 진화하는 세계: 내 전략이 개체군에 섞여 replicator dynamics를 돌면
   * 다음 세대 분포가 바뀐다. 착취 전략은 자기가 상대할 들판을 직접 단단하게 만든다.
   */
  evolving: boolean
  /** 채점 시드 (재현성). 라운드 수·노이즈·매치가 모두 이 시드에서 파생된다. */
  seed: number
}

const STD: PayoffMatrix = { T: 5, R: 3, P: 1, S: 0 }

/**
 * 손으로 설계한 세계들. 각 세계는 게임이론 교훈 하나에 매핑되지만,
 * 정체를 숨겨 "내 전략으로 어떻게 최대 이익을 얻나"라는 질문만 남긴다.
 */
export const WORLDS: FogWorld[] = [
  {
    id: 'w1-bazaar',
    name: '안개 낀 장터',
    glyph: '🌫️',
    blurb: '대부분은 손을 내밀지만, 군중 속에 칼을 숨긴 자도 있다.',
    hints: [
      '협력의 기운이 짙게 깔려 있다',
      '드물게 등을 돌리는 손이 섞여 있다',
      '대부분은 받은 대로 갚는 듯하다',
    ],
    population: [
      { spec: { id: 'allc' }, weight: 0.15 },
      { spec: { id: 'tft' }, weight: 0.6 },
      { spec: { id: 'alld' }, weight: 0.25 },
    ],
    payoff: STD,
    roundsMin: 10,
    roundsMax: 14,
    executionNoise: 0,
    perceptionNoise: 0,
    evolving: false,
    seed: 1011,
  },
  {
    id: 'w2-frontier',
    name: '굶주린 변경',
    glyph: '🏜️',
    blurb: '배신의 유혹이 유난히 큰 땅. 하지만 원한은 영원히 남는다.',
    hints: [
      '한쪽만 배신하면 거두는 몫이 유난히 크다',
      '한 번 등 돌린 손을 영영 잊지 않는 자가 많다',
      '언제 끝날지 모르는 긴 거래가 이어진다',
    ],
    population: [
      { spec: { id: 'grudger' }, weight: 0.45 },
      { spec: { id: 'tft' }, weight: 0.3 },
      { spec: { id: 'alld' }, weight: 0.25 },
    ],
    payoff: { T: 6, R: 4, P: 1, S: 0 }, // 2R=8 > T+S=6, 유혹(T-R=2)이 크다
    roundsMin: 12,
    roundsMax: 18,
    executionNoise: 0,
    perceptionNoise: 0,
    evolving: false,
    seed: 2022,
  },
  {
    id: 'w3-canyon',
    name: '메아리 협곡',
    glyph: '🌁',
    blurb: '말이 자꾸 잘못 전해진다. 엄격함은 여기서 독이 된다.',
    hints: [
      '전하는 말이 자주 어긋난다 (통신 오류가 심하다)',
      '받은 대로 갚는 손이 대부분이다',
      '작은 오해가 긴 보복으로 번지기 쉽다',
    ],
    population: [
      { spec: { id: 'tft' }, weight: 0.55 },
      { spec: { id: 'gtft', params: { generosity: 1 / 3 } }, weight: 0.3 },
      { spec: { id: 'grudger' }, weight: 0.15 },
    ],
    payoff: STD,
    roundsMin: 16,
    roundsMax: 24,
    executionNoise: 0.2,
    perceptionNoise: 0.1,
    evolving: false,
    seed: 3033,
  },
  {
    id: 'w4-roiling',
    name: '요동치는 들판',
    glyph: '🌪️',
    blurb: '내가 어떻게 두느냐에 따라, 다음에 마주칠 들판 자체가 바뀐다.',
    hints: [
      '이 땅은 살아 움직인다 — 번성하는 성향이 점점 더 흔해진다',
      '착한 손과 악당이 뒤섞여 서로를 잡아먹는다',
      '내 선택이 이 들판의 미래를 빚는다',
    ],
    population: [
      { spec: { id: 'allc' }, weight: 0.3 },
      { spec: { id: 'tft' }, weight: 0.3 },
      { spec: { id: 'alld' }, weight: 0.25 },
      { spec: { id: 'pavlov' }, weight: 0.15 },
    ],
    payoff: STD,
    roundsMin: 12,
    roundsMax: 16,
    executionNoise: 0.05,
    perceptionNoise: 0,
    evolving: true,
    seed: 4044,
  },
]

export function worldById(id: string): FogWorld | undefined {
  return WORLDS.find((w) => w.id === id)
}
