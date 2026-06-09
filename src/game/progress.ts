export interface StageProgress {
  bestStars: number
  bestScore: number
  cleared: boolean
}

export type ProgressMap = Record<string, StageProgress>

const KEY = 'ipd-sim:campaign'

export function loadProgress(): ProgressMap {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as ProgressMap) : {}
  } catch {
    return {}
  }
}

export function saveProgress(p: ProgressMap): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(p))
  } catch {
    // localStorage 불가 환경 무시
  }
}

/** 별/점수는 최댓값으로 병합한다(낮은 별로 덮어쓰지 않음). */
export function recordStageResult(
  p: ProgressMap,
  stageId: string,
  stars: number,
  score: number,
): ProgressMap {
  const prev = p[stageId]
  const next: StageProgress = {
    bestStars: Math.max(prev?.bestStars ?? 0, stars),
    bestScore: Math.max(prev?.bestScore ?? 0, score),
    cleared: (prev?.cleared ?? false) || stars >= 1,
  }
  return { ...p, [stageId]: next }
}

/** 첫 스테이지는 항상 열려 있고, 그 외는 직전 스테이지를 클리어해야 열린다. */
export function isUnlocked(
  p: ProgressMap,
  stages: { id: string }[],
  index: number,
): boolean {
  if (index <= 0) return true
  const prev = stages[index - 1]
  return Boolean(p[prev.id]?.cleared)
}
