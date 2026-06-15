import { useMemo, useState } from 'react'
import type { FogWorld } from '../game/worlds'
import {
  DEFAULT_DEF,
  FIRST_MOVE_CARDS,
  ON_COOP_CARDS,
  ON_DEFECT_CARDS,
  PERSONAS,
  REINVENT_MESSAGE,
  detectBuiltinEquivalent,
  matchPersona,
} from '../core/strategy/custom'
import type { CustomStrategyDef } from '../core/strategy/custom'
import { gradeGauntlet, encounterClass, opponentCoopRate } from '../sim/gauntlet'
import type { GauntletResult, GauntletGrade, Encounter, ReadClass } from '../sim/gauntlet'
import { StarRow } from './StarRow'
import { Avatar } from './Avatar'
import { kindForSpec } from './avatarKind'
import { opponentMood } from '../game/mood'
import { useHotkeys } from './useHotkeys'
import { play as soundPlay, resumeAudio } from '../audio/sound'

/** 안개 읽기 베팅 누적 점수. 캠페인의 통찰 경제와 같은 느낌(연속 간파 보너스). */
export interface ReadTally {
  hits: number
  attempts: number
  streak: number
  best: number
  insight: number
}

type Phase =
  | { name: 'commit' }
  | { name: 'play'; result: GauntletResult; grade: GauntletGrade }
  | { name: 'result'; result: GauntletResult; grade: GauntletGrade; reads: ReadTally }

function StanceSummary({ def }: { def: CustomStrategyDef }) {
  const fm = FIRST_MOVE_CARDS.find((c) => c.value === def.firstMove)!
  const oc = ON_COOP_CARDS.find((c) => c.value === def.onCoop)!
  const od = ON_DEFECT_CARDS.find((c) => c.value === def.onDefect)!
  return (
    <span className="stance-summary">
      {fm.label} · {oc.label} · {od.label}
    </span>
  )
}

/**
 * 안개의 세계 1회 도전. 세 단계를 한 화면에서 진행한다:
 *   commit  — 단서를 읽고 기본 전략(스탠스) 하나를 커밋
 *   play    — 6번의 조우를 순차 공개 (안개가 걷히며 정체 드러남)
 *   result  — 이론적 최선 대비 효율로 채점 + 최적 스탠스 공개
 */
export function GauntletView({
  world,
  initialStance,
  onComplete,
  onQuit,
}: {
  world: FogWorld
  initialStance: CustomStrategyDef | null
  onComplete: (r: {
    stars: number
    efficiency: number
    stance: CustomStrategyDef
  }) => void
  onQuit: () => void
}) {
  const [def, setDef] = useState<CustomStrategyDef>(initialStance ?? DEFAULT_DEF)
  const [phase, setPhase] = useState<Phase>({ name: 'commit' })

  const update = (patch: Partial<CustomStrategyDef>) => {
    resumeAudio()
    soundPlay('click')
    setDef((d) => ({ ...d, ...patch }))
  }

  const eq = detectBuiltinEquivalent(def)
  const eqMsg = eq ? REINVENT_MESSAGE[eq] : null
  const persona = matchPersona(def)

  const enter = () => {
    resumeAudio()
    soundPlay('drumroll')
    // 채점 한 번으로 플레이어 조우 결과까지 받아 재시뮬을 피한다.
    const grade = gradeGauntlet({ custom: def }, world)
    setPhase({ name: 'play', result: grade.playerResult, grade })
  }

  // commit 단계 단축키: Enter 진입, Esc 나가기 (이름 입력 중엔 useHotkeys가 무시)
  useHotkeys(phase.name === 'commit' ? { enter: enter, escape: onQuit } : {})

  if (phase.name === 'commit') {
    return (
      <div className="screen">
        <button className="btn ghost small" onClick={onQuit}>
          ← 나가기
        </button>
        <h2 className="screen-title">
          {world.glyph} {world.name}
        </h2>
        <p className="hint">{world.blurb}</p>

        <div className="card fog-clues">
          <span className="slot-title">🌫️ 안개 속 단서</span>
          <ul className="clue-list">
            {world.hints.map((h, i) => (
              <li key={i}>{h}</li>
            ))}
          </ul>
          <div className="world-params">
            <span>보수: 협력 {world.payoff.R} · 유혹 {world.payoff.T} · 배신 {world.payoff.P}</span>
            <span>
              라운드: {world.roundsMin}~{world.roundsMax} (불확실)
            </span>
            {world.executionNoise > 0 && (
              <span>통신 오류: {Math.round(world.executionNoise * 100)}%</span>
            )}
            {world.evolving && <span>🌪️ 진화하는 세계 — 내 선택이 들판을 바꿔요</span>}
          </div>
        </div>

        <div className="card builder-card">
          <span className="slot-title">이 세계에 들고 갈 나의 기본 전략</span>
          <p className="hint tune-hint">
            원형을 하나 골라 빠르게 정하고, 아래 카드로 나만의 전략으로 다듬어요
          </p>

          <div className="persona-grid">
            {PERSONAS.map((p) => {
              const on =
                def.firstMove === p.firstMove &&
                def.onCoop === p.onCoop &&
                def.onDefect === p.onDefect
              return (
                <button
                  key={p.name}
                  className={`persona-card${on ? ' on' : ''}`}
                  onClick={() =>
                    update({
                      glyph: p.glyph,
                      name: p.name,
                      firstMove: p.firstMove,
                      onCoop: p.onCoop,
                      onDefect: p.onDefect,
                    })
                  }
                >
                  <span className="persona-glyph">{p.glyph}</span>
                  <span className="persona-name">{p.name}</span>
                  <span className="persona-tag">{p.tagline}</span>
                </button>
              )
            })}
          </div>

          <div className="stance-banner">
            <span className="stance-face" aria-hidden>
              {def.glyph}
            </span>
            <span className="stance-id">{persona ? persona.name : '나만의 조합'}</span>
            <StanceSummary def={def} />
          </div>

          <span className="slot-title tune-header">세부 조정</span>

          <div className="slot">
            <span className="slot-title">① 첫 만남</span>
            <div className="slot-cards">
              {FIRST_MOVE_CARDS.map((c) => (
                <button
                  key={c.value}
                  className={`rule-card${def.firstMove === c.value ? ' on' : ''}`}
                  onClick={() => update({ firstMove: c.value })}
                >
                  <span className="rule-label">{c.label}</span>
                  <span className="rule-desc">{c.desc}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="slot">
            <span className="slot-title">② 협력받으면</span>
            <div className="slot-cards">
              {ON_COOP_CARDS.map((c) => (
                <button
                  key={c.value}
                  className={`rule-card${def.onCoop === c.value ? ' on' : ''}`}
                  onClick={() => update({ onCoop: c.value })}
                >
                  <span className="rule-label">{c.label}</span>
                  <span className="rule-desc">{c.desc}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="slot">
            <span className="slot-title">③ 배신당하면</span>
            <div className="slot-cards">
              {ON_DEFECT_CARDS.map((c) => (
                <button
                  key={c.value}
                  className={`rule-card${def.onDefect === c.value ? ' on' : ''}`}
                  onClick={() => update({ onDefect: c.value })}
                >
                  <span className="rule-label">{c.label}</span>
                  <span className="rule-desc">{c.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {!persona && eqMsg && <div className="reinvent-toast">💡 {eqMsg}</div>}
        </div>

        <div className="actions">
          <button className="btn primary" onClick={enter}>
            🌫️ 안개 속으로 (6번 조우) <kbd className="kbd-hint">Enter</kbd>
          </button>
        </div>
      </div>
    )
  }

  if (phase.name === 'play') {
    return (
      <GauntletPlay
        world={world}
        result={phase.result}
        onDone={(reads) =>
          setPhase({ name: 'result', result: phase.result, grade: phase.grade, reads })
        }
      />
    )
  }

  // result
  const { grade, reads } = phase
  return (
    <GauntletResult
      world={world}
      def={def}
      grade={grade}
      reads={reads}
      onRetry={() => setPhase({ name: 'commit' })}
      onContinue={() =>
        onComplete({ stars: grade.stars, efficiency: grade.efficiency, stance: def })
      }
    />
  )
}

/**
 * 조우 = 안개 속 상대 읽기 베팅. 정체가 드러나기 전, 플레이어는 추상적 단서(실루엣 +
 * 직전까지의 흐름)만 보고 "이 상대는 협력적인가 적대적인가"를 먼저 읽는다. 안개가 걷히면
 * 표정 아바타 + 행동 트레이스 + 정체가 드러나고, 읽기가 맞으면 🔮통찰이 쌓인다.
 * 이게 "정해진 스탠스를 따라가는 게" 아니라 "불확실한 상황을 읽어 이익을 얻는" 핵심 루프다.
 */
function GauntletPlay({
  world,
  result,
  onDone,
}: {
  world: FogWorld
  result: GauntletResult
  onDone: (reads: ReadTally) => void
}) {
  // step: 'bet'면 현재 조우에 베팅 전, 'reveal'이면 정체가 드러난 상태
  const [idx, setIdx] = useState(0)
  const [step, setStep] = useState<'bet' | 'reveal'>('bet')
  const [bet, setBet] = useState<ReadClass | null>(null)
  const [tally, setTally] = useState<ReadTally>({ hits: 0, attempts: 0, streak: 0, best: 0, insight: 0 })

  const enc = result.encounters[idx]
  const truth = encounterClass(enc)
  const last = idx > 0 ? result.encounters[idx - 1] : null

  const placeBet = (guess: ReadClass) => {
    if (step !== 'bet') return
    resumeAudio()
    soundPlay('flip')
    const correct = guess === truth
    const streak = correct ? tally.streak + 1 : 0
    const bonus = correct && streak % 3 === 0
    setTally((t) => ({
      hits: t.hits + (correct ? 1 : 0),
      attempts: t.attempts + 1,
      streak,
      best: Math.max(t.best, streak),
      insight: t.insight + (correct ? 1 + (bonus ? 1 : 0) : 0),
    }))
    const won = enc.playerScore >= enc.oppScore
    soundPlay(correct ? 'read' : 'defect', 0)
    if (won) soundPlay('coop', 0)
    setBet(guess)
    setStep('reveal')
  }

  const next = () => {
    if (step !== 'reveal') return
    resumeAudio()
    soundPlay('click')
    if (idx + 1 >= result.encounters.length) {
      onDone(tally)
      return
    }
    setIdx(idx + 1)
    setBet(null)
    setStep('bet')
  }

  useHotkeys(
    step === 'bet'
      ? { '1': () => placeBet('coop'), c: () => placeBet('coop'), '2': () => placeBet('hostile'), d: () => placeBet('hostile') }
      : { ' ': next, enter: next },
  )

  const runningPlayer = result.encounters.slice(0, idx + (step === 'reveal' ? 1 : 0)).reduce((a, e) => a + e.playerScore, 0)
  const correctRead = bet === truth
  const won = enc.playerScore >= enc.oppScore
  const coopPct = Math.round(opponentCoopRate(enc) * 100)
  const mood = opponentMood(enc.outcome.rounds.length ? toLastRound(enc) : null)

  return (
    <div className="screen">
      <h2 className="screen-title">
        {world.glyph} {world.name}
      </h2>

      <div className="fog-running">
        <span className="insight-chip" title="읽기 적중으로 모은 통찰">
          🔮 통찰 {tally.insight}
        </span>
        <span className="fog-vs">
          조우 {idx + 1} / {result.encounters.length}
        </span>
        <span>
          누적 <strong>{runningPlayer}</strong>
        </span>
      </div>

      {tally.streak >= 2 && step === 'bet' && (
        <div className="combo-badge" key={`rs-${tally.streak}`}>
          🔮 {tally.streak} 연속 간파
        </div>
      )}

      <div className={`card fog-encounter${step === 'reveal' ? (won ? ' won' : ' lost') : ''}`}>
        <div className={`fog-portrait${step === 'bet' ? ' fogged' : ''}`}>
          {step === 'bet' ? (
            <span className="fog-silhouette" aria-label="안개 속 상대">
              🌫️
            </span>
          ) : (
            <Avatar kind={kindForSpec(enc.oppSpec)} mood={mood} size={104} />
          )}
        </div>

        {step === 'bet' ? (
          <>
            <p className="fog-read-prompt">이 안개 속 상대는 어떤 쪽일까요?</p>
            {last && (
              <p className="hint fog-last">
                직전 조우: {last.oppLabel} — {last.playerScore >= last.oppScore ? '내가 우위' : '상대가 우위'}
              </p>
            )}
            <div className="actions fog-bet-actions">
              <button className="btn coop" onClick={() => placeBet('coop')}>
                🤝 협력적일 듯 <kbd className="kbd-hint">1</kbd>
              </button>
              <button className="btn defect" onClick={() => placeBet('hostile')}>
                🗡 적대적일 듯 <kbd className="kbd-hint">2</kbd>
              </button>
            </div>
          </>
        ) : (
          <>
            <span className={`read-result ${correctRead ? 'hit' : 'miss'}`}>
              {correctRead ? '🔮 간파!' : '🌫️ 빗나감'} — {truth === 'coop' ? '협력적' : '적대적'} 상대 ({coopPct}% 협력)
            </span>
            <span className="enc-opp-reveal">{enc.oppLabel}</span>
            <EncounterTrace enc={enc} />
            <div className="fog-score-row">
              <span>
                나 <strong>{enc.playerScore}</strong>
              </span>
              <span className="muted">{enc.rounds}R</span>
              <span>
                상대 <strong>{enc.oppScore}</strong>
              </span>
            </div>
          </>
        )}
      </div>

      {world.evolving && idx > 0 && step === 'bet' && (
        <p className="hint evolving-note">🌪️ 들판이 움직여요 — 내 전략이 분포를 바꿔요</p>
      )}

      {step === 'reveal' && (
        <div className="actions">
          <button className="btn primary" onClick={next}>
            {idx + 1 >= result.encounters.length ? '결과 보기' : '다음 조우'}{' '}
            <kbd className="kbd-hint">Space</kbd>
          </button>
        </div>
      )}
    </div>
  )
}

/** 조우 안의 양측 행동 흐름(C/D 점 트랙). 캠페인 Track과 같은 시각 언어. */
function EncounterTrace({ enc }: { enc: Encounter }) {
  return (
    <div className="track enc-trace" aria-hidden>
      {enc.outcome.rounds.map((r, i) => (
        <span key={i} className="track-col">
          <span className={`dot ${r.played[0] === 'C' ? 'c' : 'd'}`} />
          <span className={`dot ${r.played[1] === 'C' ? 'c' : 'd'}`} />
        </span>
      ))}
    </div>
  )
}

/** 조우의 마지막 라운드를 GameRoundResult 모양으로 변환해 표정 계산에 쓴다. */
function toLastRound(enc: Encounter) {
  const r = enc.outcome.rounds[enc.outcome.rounds.length - 1]
  return {
    round: r.round,
    playerIntended: r.intended[0],
    playerPlayed: r.played[0],
    playerMoveFlipped: r.intended[0] !== r.played[0],
    opponentIntended: r.intended[1],
    opponentPlayed: r.played[1],
    opponentMoveFlipped: r.intended[1] !== r.played[1],
    payoff: [r.payoff[0], r.payoff[1]] as [number, number],
    playerScore: 0,
    opponentScore: 0,
  }
}

/** 효율 채점 + 최적 스탠스 공개. 절대 점수가 아니라 "이 세계 최선 대비 몇 %"로 평가. */
function GauntletResult({
  world,
  def,
  grade,
  reads,
  onRetry,
  onContinue,
}: {
  world: FogWorld
  def: CustomStrategyDef
  grade: GauntletGrade
  reads: ReadTally
  onRetry: () => void
  onContinue: () => void
}) {
  const pct = Math.round(grade.efficiency * 100)
  const readPct = reads.attempts > 0 ? Math.round((reads.hits / reads.attempts) * 100) : null
  const matchedBest = useMemo(() => {
    const b = grade.bestDef
    return (
      b.firstMove === def.firstMove && b.onCoop === def.onCoop && b.onDefect === def.onDefect
    )
  }, [grade.bestDef, def])

  useHotkeys({ enter: onContinue, r: onRetry })

  const verdict =
    grade.stars === 3
      ? '이 안개를 완벽히 읽어냈어요.'
      : grade.stars === 2
        ? '거의 최선에 가까웠어요.'
        : grade.stars === 1
          ? '살아남았지만, 더 거둘 수 있었어요.'
          : '이 세계를 잘못 읽었어요. 단서를 다시 보세요.'

  return (
    <div className="screen center">
      <div className="card result-card">
        <h2 className="screen-title">
          {world.glyph} {world.name}
        </h2>
        <StarRow stars={grade.stars} animate />
        <div className="efficiency-meter">
          <div className="eff-bar">
            <div className="eff-fill" style={{ width: `${pct}%` }} />
          </div>
          <span className="eff-label">
            이론적 최선의 <strong>{pct}%</strong>를 거뒀어요
          </span>
        </div>

        <div className="score-breakdown">
          <span>
            내 수확 <strong>{grade.playerScore}</strong>
          </span>
          <span className="muted">최선 {grade.bestScore}</span>
          <span className="muted">최악(무조건 배신) {grade.floorScore}</span>
        </div>

        {readPct !== null && (
          <p className="read-accuracy">
            🔮 안개 읽기 {reads.hits}/{reads.attempts} 적중 ({readPct}%)
            {readPct >= 80 ? ' — 독심술사!' : ''} · 통찰 {reads.insight} · 최고 연속 {reads.best}
          </p>
        )}

        <p className="verdict">{verdict}</p>

        <div className="best-stance">
          {matchedBest ? (
            <p className="best-match">
              🏆 당신의 스탠스가 이 세계의 <strong>이론적 최선</strong>이었어요!
            </p>
          ) : (
            <>
              <span className="slot-title">이 세계의 최선 스탠스</span>
              <StanceSummary def={grade.bestDef} />
              <p className="hint">
                내 스탠스: <StanceSummary def={def} />
              </p>
            </>
          )}
        </div>

        <p className="lesson">{worldLesson(world, grade.bestDef)}</p>

        <div className="actions">
          <button className="btn ghost" onClick={onRetry}>
            다시 도전 <kbd className="kbd-hint">R</kbd>
          </button>
          <button className="btn primary" onClick={onContinue}>
            {grade.stars >= 1 ? '세계 지도로' : '계속'} <kbd className="kbd-hint">Enter</kbd>
          </button>
        </div>
      </div>
    </div>
  )
}

/** 세계별 교훈 — 최선 스탠스가 왜 최선이었는지 게임이론으로 설명. */
function worldLesson(world: FogWorld, best: CustomStrategyDef): string {
  const exploits = best.onCoop === 'betray'
  const forgives = best.onDefect === 'forgive_some' || best.onDefect === 'forgive_all'
  switch (world.id) {
    case 'w1-bazaar':
      return '협력의 기운이 짙은 곳에선 먼저 손 내밀고 받은 대로 갚는 게 남는 장사예요. 순진한 착취는 보복하는 다수에게 잡혀요.'
    case 'w2-frontier':
      return exploits
        ? '유혹이 크면 한 번의 약탈이 달콤하죠. 하지만 원한을 품는 다수 앞에선 그 한 번이 긴 보복을 부릅니다.'
        : '배신의 유혹이 커도, 원한 깊은 세계에선 신뢰를 쌓아 길게 거두는 쪽이 이겨요. 유혹에 넘어가면 영원히 등을 돌립니다.'
    case 'w3-canyon':
      return forgives
        ? '말이 자꾸 어긋나는 곳에선 약간의 용서가 보복의 악순환을 끊어요. 엄격함은 여기서 독이 됩니다.'
        : '통신이 어긋나는 세계에선 한 번의 오해가 긴 파탄이 돼요. 용서의 여지를 남겨야 수확이 되살아납니다.'
    case 'w4-roiling':
      return '내 선택이 들판을 빚는 세계예요. 너그러운 보복은 협력적 이웃을 늘려, 내가 거둘 들판을 스스로 비옥하게 만들어요.'
    default:
      return '세계마다 최선의 스탠스가 달라요. 안개 속 단서를 읽어 내 전략을 맞추는 게 핵심이에요.'
  }
}
