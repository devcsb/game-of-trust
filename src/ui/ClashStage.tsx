import type { Move } from '../core/types'

type ClashKind = 'handshake' | 'clash' | 'oneSided'

function clashKind(me: Move, op: Move): ClashKind {
  if (me === 'C' && op === 'C') return 'handshake'
  if (me === 'D' && op === 'D') return 'clash'
  return 'oneSided'
}

export function ClashStage({ me, op }: { me: Move; op: Move }) {
  const kind = clashKind(me, op)
  return (
    <div className="clash" aria-hidden>
      <span className="hand hand-l">{me === 'C' ? '🤝' : '✊'}</span>
      <span className={`clash-fx ${kind === 'handshake' ? 'ok' : 'burst'}`}>
        {kind === 'handshake' ? '✨' : '💥'}
      </span>
      <span className="hand hand-r">{op === 'C' ? '🤝' : '✊'}</span>
    </div>
  )
}
