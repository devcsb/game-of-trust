import { trustBand } from '../game/trust'

export function TrustGauge({ trust }: { trust: number }) {
  const band = trustBand(trust)
  return (
    <div className="trust" role="img" aria-label={`신뢰도 ${Math.round(trust)} / 100`}>
      <div className="trust-head">
        <span>신뢰</span>
        <span className={`trust-band band-${band}`}>{Math.round(trust)}</span>
      </div>
      <div className="trust-track">
        <div className={`trust-fill band-${band}`} style={{ width: `${trust}%` }} />
      </div>
    </div>
  )
}
