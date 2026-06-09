export function StarRow({ stars }: { stars: number }) {
  return (
    <span className="stars" aria-label={`별 ${stars} / 3`}>
      {[1, 2, 3].map((n) => (
        <span key={n} className={n <= stars ? 'star on' : 'star'}>
          ★
        </span>
      ))}
    </span>
  )
}
