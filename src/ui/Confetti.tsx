/** 간파 스트릭 축하용 CSS 파티클. 캔버스 없이 12개의 div로 충분하다. */
export function Confetti() {
  return (
    <div className="confetti" aria-hidden>
      {Array.from({ length: 12 }, (_, i) => (
        <span key={i} className={`cf cf-${i}`} />
      ))}
    </div>
  )
}
