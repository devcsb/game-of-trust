import { useState } from 'react'
import type { Move } from '../core/types'
import { STANDARD_PAYOFF } from '../core/payoff'
import { createGameRunner, computeStars } from '../sim/gameRunner'
import type { GameRoundResult } from '../sim/gameRunner'
import type { Stage } from '../game/stages'

function randomSeed(): number {
  return Math.floor(Math.random() * 1_000_000_000)
}

const moveLabel = (m: Move) => (m === 'C' ? '협력' : '배신')

function Track({ history }: { history: GameRoundResult[] }) {
  return (
    <div className="track" aria-hidden>
      {history.map((r, i) => (
        <span key={i} className="track-col">
          <span className={`dot ${r.playerPlayed === 'C' ? 'c' : 'd'}`} />
          <span className={`dot ${r.opponentPlayed === 'C' ? 'c' : 'd'}`} />
        </span>
      ))}
    </div>
  )
}

export function GamePlay({
  stage,
  onComplete,
  onQuit,
}: {
  stage: Stage
  onComplete: (r: { stars: number; score: number; flips: number }) => void
  onQuit: () => void
}) {
  const [runner] = useState(() =>
    createGameRunner({
      opponentId: stage.opponentId,
      opponentParams: stage.opponentParams,
      rounds: stage.rounds,
      payoff: STANDARD_PAYOFF,
      executionNoise: stage.executionNoise,
      seed: randomSeed(),
    }),
  )
  const [history, setHistory] = useState<GameRoundResult[]>([])

  const last = history.length > 0 ? history[history.length - 1] : null
  const done = runner.done
  const current = done ? stage.rounds : runner.round + 1

  const play = (m: Move) => {
    if (runner.done) return
    const r = runner.playRound(m)
    setHistory((h) => [...h, r])
  }

  const finish = () => {
    const score = runner.playerScore
    const stars = computeStars(score, stage.starThresholds)
    const flips = history.filter((x) => x.playerMoveFlipped).length
    onComplete({ stars, score, flips })
  }

  return (
    <div className="screen play">
      <div className="play-head">
        <button className="btn ghost small" onClick={onQuit}>
          ← 나가기
        </button>
        <span className="round-label">
          라운드 {current} / {stage.rounds}
        </span>
      </div>

      <div className="card opp-card">
        <span className="glyph big">{stage.character.glyph}</span>
        <span className="opp-name">{stage.character.name}</span>
        <span className="opp-blurb">{stage.character.blurb}</span>
      </div>

      <div className="scoreboard">
        <div className="sb me">
          <span>나</span>
          <strong>{runner.playerScore}</strong>
        </div>
        <div className="sb opp">
          <span>{stage.character.name}</span>
          <strong>{runner.opponentScore}</strong>
        </div>
      </div>

      {last && (
        <div className="round-feedback">
          {last.playerMoveFlipped && (
            <div className="flip-badge">
              📡 통신 오류! 내 "{moveLabel(last.playerIntended)}"가 "
              {moveLabel(last.playerPlayed)}"로 전달됐어요
            </div>
          )}
          <div className="rf-row">
            <span>나: {moveLabel(last.playerPlayed)}</span>
            <span>상대: {moveLabel(last.opponentPlayed)}</span>
            <span className="pts">+{last.payoff[0]}</span>
          </div>
        </div>
      )}

      <Track history={history} />

      {!done ? (
        <div className="actions">
          <button className="btn coop" onClick={() => play('C')}>
            협력
          </button>
          <button className="btn defect" onClick={() => play('D')}>
            배신
          </button>
        </div>
      ) : (
        <div className="actions">
          <button className="btn primary" onClick={finish}>
            결과 보기
          </button>
        </div>
      )}
    </div>
  )
}
