import { useEffect, useRef } from 'react'

/**
 * 누적 영역 차트 (replicator dynamics 인구 비율). EvolutionView에서 추출 —
 * 종 목록을 props로 받아 커스텀 전략 참가도 같은 차트로 그린다.
 */
export function EvolutionChart({
  history,
  colors,
  onDone,
}: {
  history: number[][]
  colors: string[]
  onDone?: () => void
}) {
  const ref = useRef<HTMLCanvasElement>(null)
  const onDoneRef = useRef(onDone)

  useEffect(() => {
    onDoneRef.current = onDone
  })

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const W = canvas.width
    const H = canvas.height
    const gens = history.length
    const n = history[0]?.length ?? 0

    const draw = (upTo: number) => {
      ctx.clearRect(0, 0, W, H)
      for (let i = 0; i < n; i++) {
        ctx.beginPath()
        for (let g = 0; g <= upTo; g++) {
          const x = gens <= 1 ? 0 : (g / (gens - 1)) * W
          let below = 0
          for (let k = 0; k < i; k++) below += history[g][k]
          const top = below + history[g][i]
          if (g === 0) ctx.moveTo(x, H - top * H)
          else ctx.lineTo(x, H - top * H)
        }
        for (let g = upTo; g >= 0; g--) {
          const x = gens <= 1 ? 0 : (g / (gens - 1)) * W
          let below = 0
          for (let k = 0; k < i; k++) below += history[g][k]
          ctx.lineTo(x, H - below * H)
        }
        ctx.closePath()
        ctx.fillStyle = colors[i]
        ctx.fill()
      }
    }

    const reduce =
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (reduce) {
      draw(gens - 1)
      onDoneRef.current?.()
      return
    }
    let frame = 0
    let raf = 0
    const tick = () => {
      frame += 1
      draw(Math.min(frame, gens - 1))
      if (frame < gens - 1) raf = requestAnimationFrame(tick)
      else onDoneRef.current?.()
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [history, colors])

  return <canvas ref={ref} width={560} height={260} className="evo-canvas" />
}
