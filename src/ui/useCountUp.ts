import { useEffect, useRef, useState } from 'react'

function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
}

/** 정수 count-up. 연타로 target이 바뀌면 현재값에서 다시 출발(cancel-restart). */
export function useCountUp(target: number, ms = 450): number {
  const reduced = prefersReducedMotion()
  const [value, setValue] = useState(target)
  const fromRef = useRef(target)

  useEffect(() => {
    if (reduced) {
      fromRef.current = target
      return
    }
    const start = fromRef.current
    const t0 = performance.now()
    let raf = 0
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / ms)
      const eased = 1 - Math.pow(1 - p, 3)
      setValue(Math.round(start + (target - start) * eased))
      if (p < 1) raf = requestAnimationFrame(tick)
      else fromRef.current = target
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target, ms, reduced])

  return reduced ? target : value
}
