import { useEffect, useRef } from 'react'
import type { SweepResult } from '../../sim/sweep'

const W = 460
const H = 320

function heatColor(t: number): string {
  // 낮음(어두운 남보라) → 높음(노랑). 밝을수록 GTFT 평균 점수 높음.
  const clamp = (x: number) => Math.max(0, Math.min(255, Math.round(x)))
  const r = clamp(255 * (t < 0.5 ? t * 0.7 : 0.35 + (t - 0.5) * 1.3))
  const g = clamp(255 * (0.08 + t * 0.9))
  const b = clamp(255 * (0.45 - t * 0.4 + (1 - t) * 0.15))
  return `rgb(${r},${g},${b})`
}

export function HeatmapCanvas({
  result,
  optimalQ,
}: {
  result: SweepResult
  optimalQ: number
}) {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const { qValues, noiseValues, scores, min, max, argmaxQByNoise } = result
    const nq = qValues.length
    const nn = noiseValues.length
    const cellW = W / nn
    const cellH = H / nq

    ctx.clearRect(0, 0, W, H)
    for (let qi = 0; qi < nq; qi++) {
      for (let nj = 0; nj < nn; nj++) {
        const v = scores[qi][nj]
        const t = max > min ? (v - min) / (max - min) : 0.5
        ctx.fillStyle = heatColor(t)
        const y = (nq - 1 - qi) * cellH // q가 위로 증가하도록 뒤집음
        ctx.fillRect(nj * cellW, y, cellW + 1, cellH + 1)
      }
    }

    // 이론 최적선 (q = optimalQ, noise 독립이라 수평 점선)
    const yOpt = (1 - optimalQ) * H
    ctx.strokeStyle = 'rgba(255,255,255,0.9)'
    ctx.lineWidth = 2
    ctx.setLineDash([6, 4])
    ctx.beginPath()
    ctx.moveTo(0, yOpt)
    ctx.lineTo(W, yOpt)
    ctx.stroke()
    ctx.setLineDash([])

    // 실측 최적선 (각 noise 열의 argmax q)
    ctx.strokeStyle = '#ff3b6b'
    ctx.lineWidth = 2.5
    ctx.beginPath()
    argmaxQByNoise.forEach((q, nj) => {
      const x = (nj + 0.5) * cellW
      const y = (1 - q) * H
      if (nj === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    })
    ctx.stroke()
  }, [result, optimalQ])

  return <canvas ref={ref} width={W} height={H} className="heatmap" />
}
