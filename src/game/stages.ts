import type { StrategyId, StrategyParams } from '../core/strategy/Strategy'

export interface Character {
  name: string
  glyph: string // 미니멀 식별용 1글자/이모지
  blurb: string // 한 줄 성격
}

export interface Stage {
  id: string
  index: number
  character: Character
  opponentId: StrategyId
  opponentParams?: StrategyParams
  rounds: number
  executionNoise: number
  intro: string // 시작 전 안내
  lesson: string // 클리어 후 교훈
  starThresholds: [number, number, number] // [1별, 2별, 3별] 누적 점수 하한
}

export const STAGES: Stage[] = [
  {
    id: 's1-sucker',
    index: 0,
    character: { name: '호구', glyph: '🐤', blurb: '무슨 일이 있어도 늘 협력한다.' },
    opponentId: 'allc',
    rounds: 10,
    executionNoise: 0,
    intro: '이 상대는 절대 배신하지 않아요. 어떻게 점수를 낼까요?',
    lesson: '착하기만 한 상대는 이용당해요. 배신하면 점수는 오르죠. 그런데 세상에 호구만 있을까요?',
    starThresholds: [10, 25, 40],
  },
  {
    id: 's2-villain',
    index: 1,
    character: { name: '악당', glyph: '😈', blurb: '무조건 배신한다.' },
    opponentId: 'alld',
    rounds: 10,
    executionNoise: 0,
    intro: '이 상대는 늘 배신해요. 협력하면 어떻게 될까요?',
    lesson: '무조건 협력하면 호구가 돼요. 배신하는 상대에겐 같이 배신하는 게 그나마 방어예요.',
    starThresholds: [3, 6, 9],
  },
  {
    id: 's3-mirror',
    index: 2,
    character: { name: '거울', glyph: '🪞', blurb: '네가 한 대로 그대로 갚는다.' },
    opponentId: 'tft',
    rounds: 12,
    executionNoise: 0,
    intro: '이 상대는 당신이 직전에 한 행동을 그대로 따라 해요.',
    lesson: '되갚는 상대에겐 협력이 남는 장사예요. 배신하면 그대로 보복당해 둘 다 손해죠.',
    starThresholds: [18, 28, 33],
  },
  {
    id: 's4-grudger',
    index: 3,
    character: { name: '복수귀', glyph: '🗡️', blurb: '한 번 배신당하면 영원히 응징한다.' },
    opponentId: 'grudger',
    rounds: 12,
    executionNoise: 0.15,
    intro: '이 상대는 단 한 번의 배신도 용서하지 않아요. 그리고 가끔 통신이 어긋나요.',
    lesson: '통신 오류로 내 협력이 배신으로 전달되면, 용서 없는 상대는 영원히 등을 돌려요. 엄격함의 함정이에요.',
    starThresholds: [14, 22, 28],
  },
  {
    id: 's5-generous',
    index: 4,
    character: { name: '관대한 거울', glyph: '🕊️', blurb: '대체로 갚지만, 가끔은 용서한다.' },
    opponentId: 'gtft',
    opponentParams: { generosity: 1 / 3 },
    rounds: 15,
    executionNoise: 0.15,
    intro: '이 상대도 통신이 어긋나요. 하지만 가끔 당신의 실수를 용서해요.',
    lesson: '약간의 관용이 보복의 악순환을 끊어요. 실수해도 회복할 수 있어 신뢰가 되살아나죠. 이게 너그러운 맞대응의 힘이에요.',
    starThresholds: [30, 38, 42],
  },
]

export function stageById(id: string): Stage | undefined {
  return STAGES.find((s) => s.id === id)
}
