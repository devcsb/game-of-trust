import type { Move } from '../types'
import type { Strategy, StrategyId } from './Strategy'

/**
 * 플레이어 제작 전략. 프로그래밍 UI가 아니라 카드 3슬롯:
 * 첫 만남 / 협력받으면 / 배신당하면. 카드 ID만 저장하므로 직렬화가 안전하고
 * 수치 밸런스를 바꿔도 세이브 마이그레이션이 필요 없다.
 */
export type OnCoopCard = 'reciprocate' | 'betray'
export type OnDefectCard = 'retaliate' | 'forgive_some' | 'forgive_all' | 'grudge'

export interface CustomStrategyDef {
  v: 1
  name: string
  glyph: string
  firstMove: Move // 첫 만남: 손 내밀기(C) / 경계하기(D)
  onCoop: OnCoopCard // 협력받으면
  onDefect: OnDefectCard // 배신당하면
}

/** 카드 값 enum (빌더 UI와 전략 열거가 공유한다). */
export const FIRST_MOVES: Move[] = ['C', 'D']
export const ON_COOPS: OnCoopCard[] = ['reciprocate', 'betray']
export const ON_DEFECTS: OnDefectCard[] = ['retaliate', 'forgive_some', 'forgive_all', 'grudge']

/** 너그러운 보복의 용서 확률 (gtft 기본값과 동일) */
export const FORGIVE_PROB = 1 / 3

export const DEFAULT_DEF: CustomStrategyDef = {
  v: 1,
  name: '나의 전략',
  glyph: '🌟',
  firstMove: 'C',
  onCoop: 'reciprocate',
  onDefect: 'retaliate',
}

export const GLYPHS = ['🌟', '🦊', '🐺', '🦉', '🐢', '🌵', '⚡', '🔮']

export const FIRST_MOVE_CARDS: { value: Move; label: string; desc: string }[] = [
  { value: 'C', label: '🤝 손 내밀기', desc: '첫 만남에 협력으로 시작해요' },
  { value: 'D', label: '🛡 경계하기', desc: '첫 만남에 배신으로 시작해요' },
]

export const ON_COOP_CARDS: { value: OnCoopCard; label: string; desc: string }[] = [
  { value: 'reciprocate', label: '🤝 협력으로 보답', desc: '협력엔 협력으로 답해요' },
  { value: 'betray', label: '🗡 약점 노리기', desc: '협력해 온 상대를 배신해요' },
]

export const ON_DEFECT_CARDS: { value: OnDefectCard; label: string; desc: string }[] = [
  { value: 'retaliate', label: '⚔️ 즉시 보복', desc: '배신엔 배신으로 갚아요' },
  { value: 'forgive_some', label: '🕊 너그러운 보복', desc: '3번 중 1번은 용서해요' },
  { value: 'forgive_all', label: '😇 무한 용서', desc: '맞아도 늘 협력해요' },
  { value: 'grudge', label: '🗡️ 영원히 응징', desc: '한 번 배신당하면 끝까지 갚아요' },
]

/**
 * 카드 3장을 Strategy로 컴파일한다. grudge만 클로저 상태를 갖고 나머지는 무상태.
 * 확률 카드는 주입된 rng만 사용한다 (결정성 계약 준수).
 */
export function compileCustom(def: CustomStrategyDef): Strategy {
  let grudged = false
  return {
    id: `custom:${def.name}`,
    label: def.name,
    next: (obs, rng) => {
      if (grudged) return 'D'
      if (obs.oppLastPerceived === null) return def.firstMove
      if (obs.oppLastPerceived === 'C') {
        return def.onCoop === 'reciprocate' ? 'C' : 'D'
      }
      switch (def.onDefect) {
        case 'retaliate':
          return 'D'
        case 'forgive_some':
          return rng.next() < FORGIVE_PROB ? 'C' : 'D'
        case 'forgive_all':
          return 'C'
        case 'grudge':
          grudged = true
          return 'D'
      }
    },
  }
}

/**
 * 재발명 감지: 조립한 카드 조합이 빌트인 전략과 행동 동치면 알려준다.
 * 플레이어가 Axelrod 원칙(be nice / retaliate / forgive)을 조립하며 스스로 발견하게 하는 장치.
 */
export function detectBuiltinEquivalent(def: CustomStrategyDef): StrategyId | null {
  const { firstMove, onCoop, onDefect } = def
  if (onCoop === 'reciprocate' && firstMove === 'C') {
    if (onDefect === 'retaliate') return 'tft'
    if (onDefect === 'forgive_some') return 'gtft'
    if (onDefect === 'grudge') return 'grudger'
    if (onDefect === 'forgive_all') return 'allc'
  }
  if (firstMove === 'D' && onCoop === 'betray' && (onDefect === 'retaliate' || onDefect === 'grudge')) {
    return 'alld'
  }
  return null
}

export const REINVENT_MESSAGE: Partial<Record<StrategyId, string>> = {
  tft: '당신은 "거울"을 재발명했어요! 액설로드 토너먼트의 전설, Tit-for-Tat이에요.',
  gtft: '"관대한 거울"의 비법을 찾아냈네요. 통신이 어긋나는 세상의 챔피언이에요.',
  grudger: '"복수귀"와 같은 마음이네요. 한 번의 상처를 영원히 기억하는 길이에요.',
  allc: '"호구"와 똑같아요. 착하지만… 악당을 만나면 큰일나요!',
  alld: '"악당"의 길이군요. 진화의 정원에서 어떻게 될지 지켜보세요.',
}

/**
 * 전략 페르소나 — 카드 3장 조합에 정체성(이모지 얼굴 + 이름 + 한 줄)을 붙인 프리셋.
 * 안개의 세계 commit 화면의 "빠른 선택"으로 쓴다. 하나 고르면 firstMove/onCoop/onDefect와
 * glyph가 한 번에 채워지고, 이후 카드를 손보면 어떤 페르소나와도 다른 "나만의 조합"이 된다.
 * glyph가 무의미한 장식이 아니라 전략의 얼굴이 되게 하는 장치다.
 * 이름은 REINVENT_MESSAGE의 명칭과 의도적으로 맞춰, 페르소나 선택 시엔 재발명 토스트를 숨긴다.
 */
export interface Persona {
  glyph: string
  name: string
  tagline: string
  firstMove: Move
  onCoop: OnCoopCard
  onDefect: OnDefectCard
}

export const PERSONAS: Persona[] = [
  {
    glyph: '🌟',
    name: '거울',
    tagline: '먼저 손 내밀고, 받은 대로 돌려줘요',
    firstMove: 'C',
    onCoop: 'reciprocate',
    onDefect: 'retaliate',
  },
  {
    glyph: '🦉',
    name: '현자',
    tagline: '갚되, 가끔은 용서해 악순환을 끊어요',
    firstMove: 'C',
    onCoop: 'reciprocate',
    onDefect: 'forgive_some',
  },
  {
    glyph: '🐺',
    name: '복수귀',
    tagline: '한 번 물리면 끝까지 응징해요',
    firstMove: 'C',
    onCoop: 'reciprocate',
    onDefect: 'grudge',
  },
  {
    glyph: '🐢',
    name: '성자',
    tagline: '맞아도 늘 손 내밀어요 (착취 주의)',
    firstMove: 'C',
    onCoop: 'reciprocate',
    onDefect: 'forgive_all',
  },
  {
    glyph: '🦊',
    name: '여우',
    tagline: '경계로 시작해 빈틈을 노려요',
    firstMove: 'D',
    onCoop: 'betray',
    onDefect: 'retaliate',
  },
  {
    glyph: '🌵',
    name: '가시',
    tagline: '의심으로 시작하되, 받은 대로 갚아요',
    firstMove: 'D',
    onCoop: 'reciprocate',
    onDefect: 'retaliate',
  },
]

/** 현재 스탠스(카드 3장)와 정확히 일치하는 페르소나를 찾는다. 없으면 null("나만의 조합"). */
export function matchPersona(
  def: Pick<CustomStrategyDef, 'firstMove' | 'onCoop' | 'onDefect'>,
): Persona | null {
  return (
    PERSONAS.find(
      (p) =>
        p.firstMove === def.firstMove &&
        p.onCoop === def.onCoop &&
        p.onDefect === def.onDefect,
    ) ?? null
  )
}
