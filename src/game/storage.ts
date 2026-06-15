import type { CustomStrategyDef } from '../core/strategy/custom'

/**
 * 커스텀 전략 저장소. 기존 'ipd-sim:campaign' 키는 건드리지 않고 형제 키를 쓴다.
 * 키별 버전 필드로 향후 마이그레이션에 대비한다.
 */
const KEY = 'ipd-sim:strategies'

interface StrategiesFile {
  v: 1
  list: CustomStrategyDef[]
}

export function loadStrategies(): CustomStrategyDef[] {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as StrategiesFile
    if (parsed?.v !== 1 || !Array.isArray(parsed.list)) return []
    return parsed.list
  } catch {
    return []
  }
}

export function saveStrategies(list: CustomStrategyDef[]): void {
  try {
    localStorage.setItem(KEY, JSON.stringify({ v: 1, list } satisfies StrategiesFile))
  } catch {
    // localStorage 불가 환경 무시
  }
}
