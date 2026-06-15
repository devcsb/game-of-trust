import { useEffect, useRef, useState } from 'react'
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
import { INSIGHT_START, applyPrediction, canAfford, spend, PEEK_COST } from '../game/insight'
import type { InsightState } from '../game/insight'
import { fuseLit } from '../game/twists'
import { play as soundPlay, resumeAudio } from '../audio/sound'
import { Avatar } from './Avatar'
import { KIND_BY_STRATEGY } from './avatarKind'
import { TrustGauge } from './TrustGauge'
import { FloatingPoints } from './FloatingPoints'
import { WelfareHud } from './WelfareHud'
import { GardenWorld } from './GardenWorld'
import { analyze } from '../game/analysis'
import type { PlayAnalysis } from '../game/analysis'
import { useRoundPhases } from './useRoundPhases'
import { useHotkeys } from './useHotkeys'
import type { HotkeyMap } from './useHotkeys'
import { PredictBar } from './PredictBar'
import { RevealStage } from './RevealStage'
import { ExchangeStage } from './ExchangeStage'
import { PeekChip, ResendChip } from './ActionChips'
import { TellBadge } from './TellBadge'
import { Confetti } from './Confetti'

const RESEND_WINDOW_MS = 3000

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
    analysis: PlayAnalysis
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
  const [predictions, setPredictions] = useState<(Move | null)[]>([])
  const [insight, setInsight] = useState<InsightState>(INSIGHT_START)
  const [peeked, setPeeked] = useState<Move | null>(null)
  const [resendFor, setResendFor] = useState<number | null>(null)
  const [shaking, setShaking] = useState(false)
  const [confettiAt, setConfettiAt] = useState<number | null>(null)
  const [forgiveAt, setForgiveAt] = useState<number | null>(null)
  const resendTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const prevFuse = useRef(false)

  const mech = stage.mechanics

  const { phase, predict, skipPredict, commit, skipReveal } = useRoundPhases(
    runner,
    mech.prediction,
    {
      onBeat: () => soundPlay('drumroll'),
      onFlip: (r) => {
        const prevCombo = comboCount(history)
        const next = [...history, r]
        setHistory(next)
        setPeeked(null)
        const cc = r.playerPlayed === 'C' && r.opponentPlayed === 'C'
        const newCombo = comboCount(next)
        soundPlay('flip')
        soundPlay(cc ? 'coop' : 'defect', cc ? newCombo : 0)
        if (r.playerMoveFlipped || r.opponentMoveFlipped) soundPlay('glitch')
        if (newCombo >= 2 && newCombo > prevCombo) soundPlay('combo')
        // 용서의 빛: 내 D가 전달된 직후인데도 상대가 협력을 의도했다
        const prev = history.length > 0 ? history[history.length - 1] : null
        if (mech.tell === 'forgive' && prev?.playerPlayed === 'D' && r.opponentIntended === 'C') {
          soundPlay('forgive')
          setForgiveAt(r.round)
        }
      },
      onStamp: (r, predicted) => {
        if (predicted === null) return
        setPredictions((p) => {
          const q = [...p]
          q[r.round] = predicted
          return q
        })
        const { next, correct, bonus } = applyPrediction(insight, predicted, r.opponentIntended)
        setInsight(next)
        if (correct) soundPlay(bonus ? 'streak' : 'read')
        if (bonus) setConfettiAt(r.round)
      },
      // 재전송 윈도우: 내 수가 뒤집힌 채 정산되면 3초간 정정 기회를 연다.
      // (잔액 검사는 칩 렌더 시점에 하므로 여기선 열기만 한다.)
      onSettle: (r) => {
        if (!mech.resend || !r.playerMoveFlipped || r.amended) return
        if (resendTimer.current) clearTimeout(resendTimer.current)
        setResendFor(r.round)
        resendTimer.current = setTimeout(() => setResendFor(null), RESEND_WINDOW_MS)
      },
    },
  )

  const last = history.length > 0 ? history[history.length - 1] : null
  const done = runner.done
  const current = done ? stage.rounds : runner.round + 1
  const trust = trustFromHistory(history)
  const combo = comboCount(history)
  const kind = KIND_BY_STRATEGY[stage.opponentId]
  const world = worldFromHistory(history)
  const msg = last ? welfareMessage(last) : null

  const fuse = mech.tell === 'fuse' && fuseLit(history)
  const mood = fuse ? 'angry' : opponentMood(last)
  const taunt =
    mech.taunts && !done ? mech.taunts[runner.round % mech.taunts.length] : null

  // 도화선 점화 순간: 화면 흔들림 + 저음. 재전송으로 꺼지면 다시 무장된다.
  useEffect(() => {
    if (fuse && !prevFuse.current) {
      soundPlay('fuse')
      setShaking(true)
      const t = setTimeout(() => setShaking(false), 450)
      prevFuse.current = true
      return () => clearTimeout(t)
    }
    if (!fuse) prevFuse.current = false
  }, [fuse])

  const closeResend = () => {
    if (resendTimer.current) clearTimeout(resendTimer.current)
    setResendFor(null)
  }

  useEffect(
    () => () => {
      if (resendTimer.current) clearTimeout(resendTimer.current)
    },
    [],
  )

  const handlePredict = (m: Move) => {
    resumeAudio()
    soundPlay('click')
    closeResend()
    predict(m)
  }

  const handlePeek = () => {
    if (phase.name !== 'predict' || !canAfford(insight, PEEK_COST)) return
    resumeAudio()
    closeResend() // 엿보기는 라운드를 시작시키므로 정정 윈도우가 닫힌다
    if (!runner.roundPending) runner.beginRound()
    const intent = runner.peekOpponentIntent()
    setInsight((s) => spend(s, PEEK_COST))
    setPeeked(intent)
    soundPlay('read')
    skipPredict()
  }

  const handleCommit = (m: Move) => {
    resumeAudio()
    closeResend()
    commit(m)
  }

  const handleResend = () => {
    if (resendFor === null || !mech.resend) return
    if (!canAfford(insight, mech.resend.cost)) return
    closeResend()
    const amended = runner.amendLastRound()
    setHistory((h) => [...h.slice(0, -1), amended])
    setInsight((s) => spend(s, mech.resend!.cost))
    soundPlay('forgive')
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
      analysis: analyze(history, mech.prediction ? insight : undefined),
    })
  }

  const revealing = phase.name === 'reveal'
  const lastPredicted = last ? (predictions[last.round] ?? null) : null
  const lastReadHit = last !== null && lastPredicted !== null && lastPredicted === last.opponentIntended

  // 키보드: 1/C/← 협력, 2/D/→ 배신 (예측·커밋 공용), E 엿보기, R 재전송, Space·Enter 진행
  const hotkeys: HotkeyMap = {}
  if (phase.name === 'predict') {
    hotkeys['1'] = hotkeys['c'] = hotkeys['arrowleft'] = () => handlePredict('C')
    hotkeys['2'] = hotkeys['d'] = hotkeys['arrowright'] = () => handlePredict('D')
    hotkeys['e'] = handlePeek
  } else if (phase.name === 'commit') {
    hotkeys['1'] = hotkeys['c'] = hotkeys['arrowleft'] = () => handleCommit('C')
    hotkeys['2'] = hotkeys['d'] = hotkeys['arrowright'] = () => handleCommit('D')
  } else if (phase.name === 'reveal') {
    hotkeys[' '] = hotkeys['enter'] = skipReveal
  } else if (phase.name === 'done') {
    hotkeys[' '] = hotkeys['enter'] = finish
  }
  if (resendFor !== null) hotkeys['r'] = handleResend
  useHotkeys(hotkeys)

  return (
    <div className="screen play">
      <div className="play-head">
        <button className="btn ghost small" onClick={onQuit}>
          ← 나가기
        </button>
        {mech.prediction && (
          <span className="insight-chip" title="예측 적중으로 모은 통찰">
            🔮 통찰 {insight.points}
          </span>
        )}
        <span className="round-label">
          라운드 {current} / {stage.rounds}
        </span>
      </div>

      <div className={`card opp-card${shaking ? ' fx-shake' : ''}`}>
        {taunt && (phase.name === 'predict' || phase.name === 'commit') && (
          <div className="taunt-bubble" key={`taunt-${runner.round}`}>
            “{taunt}”
          </div>
        )}
        <Avatar kind={kind} mood={mood} />
        <span className="opp-name">{stage.character.name}</span>
        <span className="opp-blurb">{stage.character.blurb}</span>
        {mech.openHand && (
          <span className="openhand-badge">🤲 열린 손 — 손을 숨기지 않는 상대예요</span>
        )}
        {mech.tell === 'fuse' && (
          <span className={`fuse-badge${fuse ? ' lit' : ''}`}>
            {fuse
              ? resendFor !== null
                ? '🔥 도화선에 불이 붙었어요! 📡재전송으로 끌 수 있어요'
                : '🔥 도화선 점화 — 다시는 꺼지지 않아요'
              : '🧨 도화선: 잠잠함'}
          </span>
        )}
        {mech.tell && mech.tell !== 'fuse' && (
          <TellBadge tell={mech.tell} history={history} insight={insight} />
        )}
        {last && !revealing && (
          <span className="fp-anchor" key={`fp-${last.round}`}>
            <FloatingPoints amount={last.payoff[0]} />
          </span>
        )}
        {forgiveAt !== null && forgiveAt === last?.round && (
          <span className="forgive-fx" key={`fg-${forgiveAt}`}>
            🕊️
          </span>
        )}
        {confettiAt !== null && confettiAt === last?.round && <Confetti key={`cf-${confettiAt}`} />}
      </div>

      {!last && !revealing && <p className="intro-banner">{stage.intro}</p>}

      {/* 형제 key는 반드시 네임스페이스를 붙인다 — 숫자 key끼리(콤보=2, 라운드=2 등)
          충돌하면 React 재조정이 깨져 오버레이가 DOM에 고아로 남는다 */}
      {revealing && (
        <RevealStage
          key={`rv-${phase.result.round}`}
          step={phase.step}
          result={phase.result}
          predicted={phase.predicted}
          opponentName={stage.character.name}
          openHand={!!mech.openHand}
          onSkip={skipReveal}
        />
      )}

      {last && !revealing && (
        <div key={`ex-${last.round}${last.amended ? '-a' : ''}`}>
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
        <div className="combo-badge" key={`combo-${combo}`}>
          🔥 {combo} 콤보
        </div>
      )}

      {last && msg && !revealing && (
        <div className={`round-feedback tone-${msg.tone}`} aria-live="polite">
          {lastPredicted !== null && (
            <div className={`read-result ${lastReadHit ? 'hit' : 'miss'}`}>
              {lastReadHit
                ? last.opponentMoveFlipped
                  ? '👁 간파! 전파만 어긋났어요'
                  : '👁 간파!'
                : '👁 빗나감'}
            </div>
          )}
          {last.playerMoveFlipped && (
            <div className="flip-badge">
              📡 통신 오류! 내 "{moveLabel(last.playerIntended)}"가 "
              {moveLabel(last.playerPlayed)}"로 전달됐어요
            </div>
          )}
          {last.amended && (
            <div className="amend-badge">
              📡 재전송 완료! 내 "{moveLabel(last.playerIntended)}"가 제대로 전달됐어요
            </div>
          )}
          {resendFor !== null &&
            resendFor === last.round &&
            mech.resend &&
            canAfford(insight, mech.resend.cost) && (
              <ResendChip cost={mech.resend.cost} onResend={handleResend} />
            )}
          <div className="welfare-headline">{msg.headline}</div>
        </div>
      )}

      <Track history={history} />

      {phase.name === 'predict' && (
        <div className="predict-area">
          <PredictBar streak={insight.streak} onPredict={handlePredict} />
          <PeekChip
            cost={PEEK_COST}
            disabled={!canAfford(insight, PEEK_COST)}
            onPeek={handlePeek}
          />
        </div>
      )}

      {phase.name === 'commit' && (
        <div className="commit-area">
          {peeked !== null ? (
            <span className="predict-locked peeked">
              👁 엿보기: 상대는 {moveLabel(peeked)}을 낼 거예요
            </span>
          ) : (
            phase.predicted !== null && (
              <span className="predict-locked">
                내 예측: 상대는 {moveLabel(phase.predicted)}할 듯
              </span>
            )
          )}
          <div className="actions">
            <button className="btn coop" onClick={() => handleCommit('C')}>
              협력 <kbd className="kbd-hint">1</kbd>
            </button>
            <button className="btn defect" onClick={() => handleCommit('D')}>
              배신 <kbd className="kbd-hint">2</kbd>
            </button>
          </div>
        </div>
      )}

      {phase.name === 'done' && (
        <div className="actions">
          <button className="btn primary" onClick={finish}>
            결과 보기 <kbd className="kbd-hint">Enter</kbd>
          </button>
        </div>
      )}
    </div>
  )
}
