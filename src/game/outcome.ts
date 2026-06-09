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
