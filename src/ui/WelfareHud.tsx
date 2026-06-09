import { useCountUp } from './useCountUp'

export function WelfareHud({
  total,
  goal,
  lost,
  me,
  opp,
  oppName,
}: {
  total: number
  goal: number | null
  lost: number
  me: number
  opp: number
  oppName: string
}) {
  const shown = useCountUp(total)
  const pct = goal && goal > 0 ? Math.min(100, (total / goal) * 100) : 0
  const reached = goal !== null && total >= goal

  return (
    <div className="welfare">
      <div className="welfare-top">
        <span className="welfare-label">우리가 함께 키운 파이</span>
        <span className="welfare-total" aria-live="polite">
          {shown}
          {goal !== null && <span className="welfare-goal"> / {goal}</span>}
        </span>
      </div>

      {goal !== null ? (
        <div className="welfare-track">
          <div className={`welfare-fill${reached ? ' reached' : ''}`} style={{ width: `${pct}%` }} />
        </div>
      ) : (
        <div className="welfare-note">이 상대와는 파이를 못 키워요. 방어가 최선!</div>
      )}

      <div className="welfare-sub">
        <span>내 점수 {me}</span>
        {lost > 0 && <span className="welfare-lost">잃은 파이 {lost}</span>}
        <span>
          {oppName} {opp}
        </span>
      </div>
    </div>
  )
}
