import type { GameRoundResult } from '../sim/gameRunner'

/** 한 라운드 최대 사회후생 = 2R (상호협력). IPD 제약 2R>T+S 가 협력 파이 > 배신 파이를 보장. */
export const MAX_WELFARE_PER_ROUND = 6

export type CellState = 'bloom' | 'sprout' | 'barren'

/** 라운드 사회후생 = 두 점수 합 (협력 6, 일방 5, 상호배신 2). played 기준. */
export function roundWelfare(r: GameRoundResult): number {
  return r.payoff[0] + r.payoff[1]
}

export function cellState(r: GameRoundResult): CellState {
  const w = roundWelfare(r)
  if (w >= 6) return 'bloom' // 상호협력: 만개
  if (w >= 5) return 'sprout' // 일방배신: 파이가 깎인 시든 싹
  return 'barren' // 상호배신: 황무지
}

export interface WorldState {
  cells: CellState[]
  totalWelfare: number // 누적 사회후생
  potentialWelfare: number // 모두 협력했다면 가능했던 누적 (라운드수 × 6)
  lostWelfare: number // 배신으로 사라진 파이
  bloomRatio: number // 0..1, 만개 셀 비율
  lastDelta: number | null // 직전 라운드가 더한 가치
}

export function worldFromHistory(history: readonly GameRoundResult[]): WorldState {
  const cells = history.map(cellState)
  const totalWelfare = history.reduce((s, r) => s + roundWelfare(r), 0)
  const potentialWelfare = history.length * MAX_WELFARE_PER_ROUND
  const blooms = cells.filter((c) => c === 'bloom').length
  const last = history.length > 0 ? history[history.length - 1] : null
  return {
    cells,
    totalWelfare,
    potentialWelfare,
    lostWelfare: potentialWelfare - totalWelfare,
    bloomRatio: history.length > 0 ? blooms / history.length : 0,
    lastDelta: last ? roundWelfare(last) : null,
  }
}

export type WorldTone = 'wasteland' | 'reviving' | 'thriving' | 'flourishing'

export function worldTone(bloomRatio: number): WorldTone {
  if (bloomRatio < 0.25) return 'wasteland'
  if (bloomRatio < 0.55) return 'reviving'
  if (bloomRatio < 0.85) return 'thriving'
  return 'flourishing'
}
