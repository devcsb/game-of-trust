export function StarRow({ stars, animate }: { stars: number; animate?: boolean }) {
  return (
    <span className="stars" aria-label={`별 ${stars} / 3`}>
      {[1, 2, 3].map((n) => {
        const on = n <= stars
        const cls = `star${on ? ' on' : ''}${animate && on ? ' pop' : ''}`
        return (
          <span
            key={n}
            className={cls}
            style={animate && on ? { animationDelay: `${n * 120}ms` } : undefined}
          >
            ★
          </span>
        )
      })}
    </span>
  )
}
