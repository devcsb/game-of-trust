import type { Move } from '../core/types'
import type { GameRoundResult } from '../sim/gameRunner'
import type { RevealStep } from './useRoundPhases'

const FACE: Record<Move, string> = { C: '🤝', D: '🗡️' }
const LABEL: Record<Move, string> = { C: '협력', D: '배신' }

function Card({
  side,
  move,
  flippedByNoise,
  open,
  who,
}: {
  side: 'l' | 'r'
  move: Move
  flippedByNoise: boolean
  open: boolean
  who: string
}) {
  return (
    <div className={`rv-card rv-${side}${open ? ' rv-open' : ''}`}>
      <div className="rv-inner">
        <div className="rv-face rv-back">?</div>
        <div className={`rv-face rv-front rv-${move === 'C' ? 'c' : 'd'}`}>
          <span className="rv-glyph">{FACE[move]}</span>
          <span className="rv-move">{LABEL[move]}</span>
        </div>
      </div>
      {open && flippedByNoise && <span className="rv-glitch">📡 지직</span>}
      <span className="rv-who">{who}</span>
    </div>
  )
}

/**
 * 동시 커밋 → 공개 연출 오버레이. slide(카드 입장) → beat(드럼롤) → flip(동시 공개+글리치)
 * → stamp(예측 판정) 후 사라진다. 화면 어디든 탭하면 즉시 정산으로 건너뛴다.
 */
export function RevealStage({
  step,
  result,
  predicted,
  opponentName,
  openHand = false,
  onSkip,
}: {
  step: RevealStep
  result: GameRoundResult
  predicted: Move | null
  opponentName: string
  /** 열린 손(s1): 상대 카드를 처음부터 공개 — 보수표 튜토리얼 */
  openHand?: boolean
  onSkip?: () => void
}) {
  const open = step === 'flip' || step === 'stamp'
  const showStamp = step === 'stamp' && predicted !== null
  const readCorrect = predicted !== null && predicted === result.opponentIntended
  const stampText = readCorrect
    ? result.opponentMoveFlipped
      ? '간파! 전파만 어긋났어요'
      : '간파!'
    : '빗나감'

  return (
    <div className="reveal-overlay" onClick={onSkip} role="button" aria-label="연출 건너뛰기">
      <div className={`reveal step-${step}`}>
        <div className="rv-cards">
          <Card
            side="l"
            move={result.playerPlayed}
            flippedByNoise={result.playerMoveFlipped}
            open={open}
            who="나"
          />
          <span className="rv-vs">{step === 'beat' ? '⚡' : 'VS'}</span>
          <Card
            side="r"
            move={result.opponentPlayed}
            flippedByNoise={result.opponentMoveFlipped}
            open={open || openHand}
            who={opponentName}
          />
          {showStamp && (
            <div className={`rv-stamp ${readCorrect ? 'hit' : 'miss'}`}>{stampText}</div>
          )}
        </div>
        <span className="skip-hint">탭 또는 Space로 건너뛰기</span>
      </div>
    </div>
  )
}
