import type { StrategyId, StrategyParams } from '../core/strategy/Strategy'

export interface Character {
  name: string
  glyph: string // 미니멀 식별용 1글자/이모지
  blurb: string // 한 줄 성격
}

/** 스테이지별 상호작용 장치. 모든 장치는 게임이론 교훈에 1:1 매핑된다. */
export interface StageMechanics {
  /** 매 라운드 상대 수 예측 단계를 켤지. s1은 보수표 튜토리얼이라 끔. */
  prediction: boolean
  /** 상대 카드 상시 공개 (s1 열린 손) */
  openHand?: boolean
  /** 커밋 전 말풍선 도발. 행동은 불변 — 말 ≠ 행동 교훈 (s2) */
  taunts?: string[]
  /** 스테이지 시그니처 텔 표시 */
  tell?: 'mirror' | 'fuse' | 'forgive' | 'vane' | 'coin'
  /** 재전송 허용 (노이즈 스테이지 한정). 통신 오류를 통찰로 정정. */
  resend?: { cost: number }
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
  starThresholds: [number, number, number] // [1별, 2별, 3별] 개인 누적 점수 하한
  /** 협력으로 거두는 공동 수확(누적 사회후생) 목표. null이면 함께 거둘 수 없는 상대 → 방어가 최선. */
  welfareGoal: number | null
  mechanics: StageMechanics
}

export const STAGES: Stage[] = [
  {
    id: 's1-sucker',
    index: 0,
    character: { name: '호구', glyph: '🐤', blurb: '무슨 일이 있어도 늘 협력한다.' },
    opponentId: 'allc',
    rounds: 10,
    executionNoise: 0,
    intro:
      '먼저 규칙: 둘이 협력하면 합쳐서 6, 한쪽만 배신하면 합쳐서 5뿐, 둘 다 배신하면 2를 거둬요. 이 상대는 절대 배신하지 않아요.',
    lesson:
      '착하기만 한 상대는 이용할 수 있어요. 배신하면 내 점수는 오르지만, 함께 거두는 수확은 6에서 5로 줄어요.',
    starThresholds: [12, 22, 28],
    welfareGoal: 54,
    mechanics: { prediction: false, openHand: true },
  },
  {
    id: 's2-villain',
    index: 1,
    character: { name: '악당', glyph: '😈', blurb: '무조건 배신한다.' },
    opponentId: 'alld',
    rounds: 10,
    executionNoise: 0,
    intro:
      '이번부터는 매 라운드 상대의 수를 먼저 예측해요. 맞히면 🔮통찰이 쌓여요. 이 상대는 말은 번지르르하지만… 과연?',
    lesson:
      '무조건 협력하면 호구가 돼요. 이런 상대와는 함께 거둘 게 없어요. 같이 배신하는 게 그나마 방어예요. 그리고 말과 행동은 달라요 — 믿을 건 행동뿐.',
    starThresholds: [3, 6, 9],
    welfareGoal: null,
    mechanics: {
      prediction: true,
      taunts: [
        '이번엔 진짜 협력할게',
        '날 믿어봐',
        '한 번만 봐줘, 응?',
        '이러는 거 나도 마음 아파',
        '다음 판엔 꼭 갚을게',
      ],
    },
  },
  {
    id: 's3-mirror',
    index: 2,
    character: { name: '거울', glyph: '🪞', blurb: '네가 한 대로 그대로 갚는다.' },
    opponentId: 'tft',
    rounds: 12,
    executionNoise: 0,
    intro: '이 상대는 당신이 직전에 한 행동을 그대로 따라 해요.',
    lesson: '되갚는 상대에겐 협력이 남는 장사예요. 배신하면 그대로 보복당해 수확이 쪼그라들죠.',
    starThresholds: [18, 28, 33],
    welfareGoal: 60,
    mechanics: { prediction: true, tell: 'mirror' },
  },
  {
    id: 's4-grudger',
    index: 3,
    character: { name: '복수귀', glyph: '🗡️', blurb: '한 번 배신당하면 영원히 응징한다.' },
    opponentId: 'grudger',
    rounds: 12,
    executionNoise: 0.15,
    intro:
      '이 상대는 단 한 번의 배신도 용서하지 않아요. 그리고 가끔 통신이 어긋나요. 내 수가 잘못 전달되면 🔮통찰 2로 📡재전송해 정정할 수 있어요.',
    lesson:
      '통신 오류로 내 협력이 배신으로 전달되면, 용서 없는 상대는 영원히 등을 돌려요. 그러면 수확도 무너지죠. 엄격함의 함정이에요.',
    starThresholds: [14, 22, 28],
    welfareGoal: 42,
    mechanics: { prediction: true, tell: 'fuse', resend: { cost: 2 } },
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
    lesson:
      '약간의 관용이 보복의 악순환을 끊어요. 실수해도 회복하니 수확이 되살아나죠. 이게 너그러운 맞대응의 힘이에요.',
    starThresholds: [30, 38, 42],
    welfareGoal: 66,
    mechanics: { prediction: true, tell: 'forgive', resend: { cost: 2 } },
  },
  {
    id: 's6-pavlov',
    index: 5,
    character: { name: '변덕쟁이', glyph: '🔄', blurb: '이기면 유지하고, 지면 바꾼다.' },
    opponentId: 'pavlov',
    rounds: 12,
    executionNoise: 0.1,
    intro: '이 상대는 직전 결과를 보고 행동을 바꿔요. 좋았으면 유지, 나빴으면 전환.',
    lesson:
      '변덕쟁이는 협력이 통하면 협력으로 안정돼요. 하지만 한 번 어긋나면 패턴이 출렁이며 수확이 흔들리죠.',
    starThresholds: [16, 24, 30],
    welfareGoal: 50,
    mechanics: { prediction: true, tell: 'vane', resend: { cost: 2 } },
  },
  {
    id: 's7-coin',
    index: 6,
    character: { name: '동전', glyph: '🎲', blurb: '완전히 무작위로 행동한다.' },
    opponentId: 'random',
    rounds: 12,
    executionNoise: 0,
    intro: '이 상대는 동전을 던지듯 무작위예요. 어떤 전략도 통하지 않아요.',
    lesson:
      '무작위 상대에겐 읽을 패턴이 없어요. 운이 가장 큰 변수죠. 이런 세상에선 협력도 보장되지 않아요.',
    starThresholds: [24, 32, 40],
    welfareGoal: null,
    mechanics: { prediction: true, tell: 'coin' },
  },
]

export function stageById(id: string): Stage | undefined {
  return STAGES.find((s) => s.id === id)
}
