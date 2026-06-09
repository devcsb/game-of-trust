export function ScoreBar({
  me,
  opp,
  meName = '나',
  oppName,
}: {
  me: number
  opp: number
  meName?: string
  oppName: string
}) {
  const total = me + opp
  const mePct = total === 0 ? 50 : (me / total) * 100
  const lead = me > opp ? 'me' : me < opp ? 'opp' : 'tie'
  return (
    <div className="scorebar" role="img" aria-label={`${meName} ${me}점, ${oppName} ${opp}점`}>
      <div className="scorebar-track">
        <div className="scorebar-fill me" style={{ width: `${mePct}%` }} />
        <div className="scorebar-fill opp" style={{ width: `${100 - mePct}%` }} />
      </div>
      <div className="scorebar-labels">
        <span className={lead === 'me' ? 'lead' : ''}>
          {meName} {me}
        </span>
        <span className={lead === 'opp' ? 'lead' : ''}>
          {oppName} {opp}
        </span>
      </div>
    </div>
  )
}
