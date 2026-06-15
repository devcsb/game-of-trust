import type { CustomStrategyDef } from '../core/strategy/custom'

/**
 * 안개의 세계 진행 저장. 캠페인('ipd-sim:campaign')과 형제 키를 써서 충돌하지 않는다.
 * 마지막으로 커밋한 기본 전략도 함께 보관해 다음 세계에서 기본값으로 제안한다.
 */
export interface WorldRecord {
  bestStars: number
  bestEfficiency: number // 0..1
  cleared: boolean
}

export type WorldProgressMap = Record<string, WorldRecord>

interface WorldFile {
  v: 1
  progress: WorldProgressMap
  lastStance?: CustomStrategyDef
}

const KEY = 'ipd-sim:worlds'

export function loadWorldProgress(): WorldFile {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return { v: 1, progress: {} }
    const parsed = JSON.parse(raw) as WorldFile
    if (parsed?.v !== 1) return { v: 1, progress: {} }
    return { v: 1, progress: parsed.progress ?? {}, lastStance: parsed.lastStance }
  } catch {
    return { v: 1, progress: {} }
  }
}

export function saveWorldProgress(file: WorldFile): void {
  try {
    localStorage.setItem(KEY, JSON.stringify({ ...file, v: 1 } satisfies WorldFile))
  } catch {
    // localStorage 불가 환경 무시
  }
}

export function recordWorldResult(
  file: WorldFile,
  worldId: string,
  stars: number,
  efficiency: number,
  stance: CustomStrategyDef,
): WorldFile {
  const prev = file.progress[worldId]
  const next: WorldRecord = {
    bestStars: Math.max(prev?.bestStars ?? 0, stars),
    bestEfficiency: Math.max(prev?.bestEfficiency ?? 0, efficiency),
    cleared: (prev?.cleared ?? false) || stars >= 1,
  }
  return {
    v: 1,
    progress: { ...file.progress, [worldId]: next },
    lastStance: stance,
  }
}

/** 첫 세계는 항상 열려 있고, 그 외는 직전 세계를 클리어해야 열린다. */
export function isWorldUnlocked(
  progress: WorldProgressMap,
  worlds: { id: string }[],
  index: number,
): boolean {
  if (index <= 0) return true
  return Boolean(progress[worlds[index - 1].id]?.cleared)
}
