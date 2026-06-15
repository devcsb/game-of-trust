import type { GameRoundResult } from '../sim/gameRunner'
import type { InsightState } from '../game/insight'
import { readAccuracy } from '../game/insight'
import { forgivenessCount, pavlovMood } from '../game/twists'

const MOVE = { C: '협력', D: '배신' } as const

/**
 * 스테이지 시그니처 텔. 상대 전략의 "읽는 법"을 가시화한다.
 * 거울: 내 직전 수가 비친다 (TFT는 내 행동의 함수) · 용서: 관용의 순간을 센다
 * 풍향계: WSLS의 다음 기분 · 동전: 아무리 읽어도 ~50%에 머무는 적중률 자체가 교훈
 * (도화선(fuse)은 점화 연출이 따로 있어 GamePlay가 직접 그린다.)
 */
export function TellBadge({
  tell,
  history,
  insight,
}: {
  tell: 'mirror' | 'forgive' | 'vane' | 'coin'
  history: readonly GameRoundResult[]
  insight: InsightState
}) {
  if (tell === 'mirror') {
    const mine = history.length > 0 ? history[history.length - 1].playerPlayed : null
    return (
      <span className="tell-badge tell-mirror">
        {mine ? (
          <>🪞 거울 속 잔상 — 내 직전 수 “{MOVE[mine]}”이 어른거려요</>
        ) : (
          <>🪞 거울은 첫 만남에 미소 짓는다고 해요</>
        )}
      </span>
    )
  }
  if (tell === 'forgive') {
    const n = forgivenessCount(history)
    return (
      <span className="tell-badge tell-forgive">
        🕊 용서받음 ×{n} — 가끔 보복 대신 손을 내밀어요
      </span>
    )
  }
  if (tell === 'vane') {
    const m = pavlovMood(history)
    return (
      <span className="tell-badge tell-vane">
        {m === null
          ? '🌀 기분 풍향계: 아직 바람이 없어요'
          : m === 'stay'
            ? '😌 만족 — 지금 수를 유지할 기분이에요'
            : '😤 불만 — 수를 바꿀 기분이에요'}
      </span>
    )
  }
  const acc = readAccuracy(insight)
  return (
    <span className="tell-badge tell-coin">
      🎯 내 적중률 {acc === null ? '—' : `${Math.round(acc * 100)}%`} · 동전엔 패턴이 없어요
    </span>
  )
}
