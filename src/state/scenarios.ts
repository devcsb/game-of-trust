export interface Scenario {
  id: string
  name: string
  coop: string
  defect: string
  noiseLabel: string
  blurb: string
}

export const SCENARIOS: Scenario[] = [
  {
    id: 'abstract',
    name: '추상 (협력/배신)',
    coop: '협력',
    defect: '배신',
    noiseLabel: '실행 노이즈',
    blurb: '고전적 반복 죄수의 딜레마. 두 행위자가 매 라운드 협력하거나 배신한다.',
  },
  {
    id: 'ai-governance',
    name: 'AI 연구소 조정',
    coop: '개발 동결',
    defect: '개발 강행',
    noiseLabel: '검증 불가능성',
    blurb:
      '두 프론티어 연구소가 개발 동결 합의를 지키는가. 노이즈는 상대가 몰래 훈련하는지 검증하지 못하는 정도다.',
  },
  {
    id: 'arms-control',
    name: '군비 통제',
    coop: '감축',
    defect: '증강',
    noiseLabel: '사찰 오류',
    blurb: '핵 감축 합의. 노이즈는 사찰이 위반을 놓치거나 오인하는 비율이다.',
  },
]

export function getScenario(id: string): Scenario {
  return SCENARIOS.find((s) => s.id === id) ?? SCENARIOS[0]
}
