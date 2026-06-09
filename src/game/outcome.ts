// matchOutcome(상대 비교 승/무/패)은 "함께 파이 목표" 프레임으로 전환되며
// StageResult에서 welfareOutcome으로 교체된다. 전환 완료 후 제거 예정.
export type Outcome = 'win' | 'draw' | 'lose'

export function matchOutcome(playerScore: number, opponentScore: number): Outcome {
  if (playerScore > opponentScore) return 'win'
  if (playerScore < opponentScore) return 'lose'
  return 'draw'
}

export const OUTCOME_LABEL: Record<Outcome, string> = {
  win: '승리',
  draw: '무승부',
  lose: '패배',
}

/** 공동 파이 목표 달성 결과. "상대 이기기"가 아니라 "함께 파이를 키웠는가". */
export type WelfareResult = 'achieved' | 'close' | 'missed'

export function welfareOutcome(total: number, goal: number | null): WelfareResult | null {
  if (goal === null) return null // 파이를 키울 수 없는 상대(악당) → 별도 처리
  if (total >= goal) return 'achieved'
  if (total >= goal * 0.7) return 'close'
  return 'missed'
}

export const WELFARE_LABEL: Record<WelfareResult, string> = {
  achieved: '파이 목표 달성',
  close: '목표에 근접',
  missed: '파이 목표 미달',
}
