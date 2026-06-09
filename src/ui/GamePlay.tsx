import { useState } from 'react'
import type { Move } from '../core/types'
import { STANDARD_PAYOFF } from '../core/payoff'
import { createGameRunner, computeStars } from '../sim/gameRunner'
import type { GameRoundResult } from '../sim/gameRunner'
import type { Stage } from '../game/stages'
import { opponentMood } from '../game/mood'
import { trustFromHistory } from '../game/trust'
import { comboCount } from '../game/combo'
import { worldFromHistory, worldTone } from '../game/world'
import { welfareMessage } from '../game/welfareMessage'
import { play as soundPlay, resumeAudio } from '../audio/sound'
import { Avatar } from './Avatar'
import type { AvatarKind } from './Avatar'
import type { StrategyId } from '../core/strategy/Strategy'
import { TrustGauge } from './TrustGauge'
import { ExchangeStage } from './ExchangeStage'
import { FloatingPoints } from './FloatingPoints'
import { WelfareHud } from './WelfareHud'
import { GardenWorld } from './GardenWorld'

const KIND_BY_OPPONENT: Record<StrategyId, AvatarKind> = {
  allc: 'sucker',
  alld: 'villain',
  tft: 'mirror',
  grudger: 'grudger',
  gtft: 'generous',
  random: 'mirror',
  tf2t: 'generous',
  pavlov: 'mirror',
}

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
  onComplete: (r: {
    stars: number
    score: number
    flips: number
    opponentScore: number
    welfare: number
  }) => void
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
  const trust = trustFromHistory(history)
  const combo = comboCount(history)
  const mood = opponentMood(last)
  const kind = KIND_BY_OPPONENT[stage.opponentId]
  const world = worldFromHistory(history)
  const msg = last ? welfareMessage(last) : null

  const play = (m: Move) => {
    if (runner.done) return
    resumeAudio()
    const prevCombo = comboCount(history)
    const r = runner.playRound(m)
    const next = [...history, r]
    setHistory(next)
    const cc = r.playerPlayed === 'C' && r.opponentPlayed === 'C'
    soundPlay(cc ? 'coop' : 'defect')
    const newCombo = comboCount(next)
    if (newCombo >= 2 && newCombo > prevCombo) soundPlay('combo')
  }

  const finish = () => {
    const score = runner.playerScore
    const stars = computeStars(score, stage.starThresholds)
    const flips = history.filter((x) => x.playerMoveFlipped).length
    onComplete({
      stars,
      score,
      flips,
      opponentScore: runner.opponentScore,
      welfare: world.totalWelfare,
    })
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
        <Avatar kind={kind} mood={mood} />
        <span className="opp-name">{stage.character.name}</span>
        <span className="opp-blurb">{stage.character.blurb}</span>
        {last && (
          <span className="fp-anchor" key={last.round}>
            <FloatingPoints amount={last.payoff[0]} />
          </span>
        )}
      </div>

      {last && (
        <div key={last.round}>
          <ExchangeStage
            me={last.playerPlayed}
            op={last.opponentPlayed}
            delta={last.payoff[0] + last.payoff[1]}
          />
        </div>
      )}

      <WelfareHud
        total={world.totalWelfare}
        goal={stage.welfareGoal}
        lost={world.lostWelfare}
        me={runner.playerScore}
        opp={runner.opponentScore}
        oppName={stage.character.name}
      />
      <GardenWorld cells={world.cells} tone={worldTone(world.bloomRatio)} totalRounds={stage.rounds} />
      <TrustGauge trust={trust} />

      {combo >= 2 && (
        <div className="combo-badge" key={combo}>
          🔥 {combo} 콤보
        </div>
      )}

      {last && msg && (
        <div className={`round-feedback tone-${msg.tone}`}>
          {last.playerMoveFlipped && (
            <div className="flip-badge">
              📡 통신 오류! 내 "{moveLabel(last.playerIntended)}"가 "
              {moveLabel(last.playerPlayed)}"로 전달됐어요
            </div>
          )}
          <div className="welfare-headline">{msg.headline}</div>
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
