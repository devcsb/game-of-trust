import type { CellState, WorldTone } from '../game/world'

const COLS = 6

function CellGlyph({ state }: { state: CellState }) {
  if (state === 'bloom') {
    return (
      <>
        <line x1="0" y1="9" x2="0" y2="2" className="stem" />
        <circle cx="0" cy="-1" r="6" className="leaf" />
      </>
    )
  }
  if (state === 'sprout') {
    return <path d="M0 9 L0 2 M0 5 Q4 3 5 0" className="stem-wilt" fill="none" />
  }
  return <circle r="2.5" className="barren-dot" />
}

export function GardenWorld({
  cells,
  tone,
  totalRounds,
}: {
  cells: CellState[]
  tone: WorldTone
  totalRounds: number
}) {
  const cw = 26
  const ch = 26
  const rows = Math.ceil(totalRounds / COLS)
  return (
    <svg
      className={`garden tone-${tone}`}
      viewBox={`0 0 ${COLS * cw} ${rows * ch}`}
      width="100%"
      role="img"
      aria-label={`공동 정원 ${cells.length}/${totalRounds} 라운드`}
    >
      <rect className="garden-ground" x="0" y="0" width={COLS * cw} height={rows * ch} rx="10" />
      {Array.from({ length: totalRounds }).map((_, i) => {
        const x = (i % COLS) * cw + cw / 2
        const y = Math.floor(i / COLS) * ch + ch / 2
        const state = cells[i]
        const fresh = i === cells.length - 1
        return (
          <g key={i} transform={`translate(${x} ${y})`} className={fresh ? 'cell-fresh' : ''}>
            {state ? <CellGlyph state={state} /> : <circle r="1.5" className="cell-ghost" />}
          </g>
        )
      })}
    </svg>
  )
}
