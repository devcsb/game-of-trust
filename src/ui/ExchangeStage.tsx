import type { Move } from '../core/types'

type Exchange = 'share' | 'takeL' | 'takeR' | 'collapse'

function exchangeOf(me: Move, op: Move): Exchange {
  if (me === 'C' && op === 'C') return 'share'
  if (me === 'D' && op === 'C') return 'takeL' // 내가(왼쪽) 상대 것을 가져감
  if (me === 'C' && op === 'D') return 'takeR' // 상대가(오른쪽) 내 것을 가져감
  return 'collapse'
}

/** 협력=양쪽 자원이 중앙 공동 풀로 흘러 커짐, 배신=강탈, 상호배신=붕괴. delta(2/5/6)로 풀 크기. */
export function ExchangeStage({ me, op, delta }: { me: Move; op: Move; delta: number }) {
  const kind = exchangeOf(me, op)
  const poolR = 8 + (delta / 6) * 12
  return (
    <svg className={`exchange ex-${kind}`} viewBox="0 0 240 70" width="100%" height="70" aria-hidden>
      <line x1="36" y1="35" x2="204" y2="35" className="ex-link" />
      <circle cx="24" cy="35" r="10" className="ex-node-me" />
      <circle cx="216" cy="35" r="10" className="ex-node-op" />
      <circle cx="120" cy="35" r={poolR} className="ex-pool" />
      <text x="120" y="39" className="ex-pool-num">
        +{delta}
      </text>
      <circle cx="36" cy="35" r="5" className="ex-orb ex-orb-l" />
      <circle cx="204" cy="35" r="5" className="ex-orb ex-orb-r" />
    </svg>
  )
}
