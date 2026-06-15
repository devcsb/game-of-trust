import { useMemo, useState } from 'react'
import { runEvolution } from '../sim/evolution'
import type { SpeciesRef } from '../sim/evolution'
import { STANDARD_PAYOFF } from '../core/payoff'
import type { CustomStrategyDef } from '../core/strategy/custom'
import { EvolutionChart } from './EvolutionChart'
import { useHotkeys } from './useHotkeys'
import { play as soundPlay, resumeAudio } from '../audio/sound'

const BUILTIN: { ref: SpeciesRef; name: string; color: string }[] = [
  { ref: 'allc', name: '호구', color: '#fde68a' },
  { ref: 'alld', name: '악당', color: '#c084fc' },
  { ref: 'tft', name: '거울', color: '#93c5fd' },
  { ref: 'grudger', name: '복수귀', color: '#fca5a5' },
  { ref: 'gtft', name: '관대한 거울', color: '#a7f3d0' },
  { ref: 'pavlov', name: '변덕쟁이', color: '#fbbf24' },
]

const PLAYER_COLOR = '#f472b6'

type Fate = 'thrive' | 'survive' | 'extinct'

const FATE_LABEL: Record<Fate, string> = {
  thrive: '🌿 번성한다 (30% 이상)',
  survive: '🌱 살아남는다',
  extinct: '💀 멸종한다',
}

function fateOf(share: number): Fate {
  if (share >= 0.3) return 'thrive'
  if (share >= 0.01) return 'survive'
  return 'extinct'
}

/** 멸종/생존의 사인(死因) 한 줄 분석 — 죽음도 수업이 되게. */
function fateBlurb(fate: Fate, def: CustomStrategyDef): string {
  if (fate === 'extinct') {
    if (def.onCoop === 'betray')
      return '협력을 배신으로 갚는 손은 착한 전략들 사이에서 골라내져요. 먼저 의심받고, 끝내 혼자 남죠.'
    if (def.onDefect === 'forgive_all')
      return '무한 용서는 악당의 먹잇감이 돼요. 보복 없는 친절은 착취당해요.'
    if (def.firstMove === 'D')
      return '먼저 경계하는 손은 신뢰를 쌓을 기회 자체를 잃어요. 첫인상이 운명이 됐네요.'
    return '이 조합은 이 생태계에선 버티지 못했어요. 카드를 바꿔 다시 심어보세요.'
  }
  if (fate === 'thrive')
    return '먼저 손 내밀고, 배신엔 답하고, 너무 오래 미워하지 않는 전략 — 살아남는 이유예요.'
  return '멸종은 면했지만 번성하진 못했어요. 무엇이 발목을 잡았을까요?'
}

/**
 * 진화의 정원. 내 전략이 7번째 종으로 참가하고,
 * 실행 전 생존 예측을 강제해 관람을 능동 학습으로 바꾼다.
 */
export function EvolutionView({
  playerDef,
  onCreateStrategy,
  onBack,
}: {
  playerDef: CustomStrategyDef | null
  onCreateStrategy: () => void
  onBack: () => void
}) {
  const [prediction, setPrediction] = useState<Fate | null>(null)
  const [watching, setWatching] = useState(playerDef === null) // 내 전략 없으면 바로 관전
  const [chartDone, setChartDone] = useState(false)

  const species = useMemo(() => {
    const base = BUILTIN.map((b) => ({ ...b }))
    if (playerDef) {
      base.push({
        ref: { custom: playerDef },
        name: `${playerDef.glyph} ${playerDef.name}`,
        color: PLAYER_COLOR,
      })
    }
    return base
  }, [playerDef])

  const result = useMemo(
    () =>
      runEvolution({
        strategies: species.map((s) => s.ref),
        rounds: 30,
        payoff: STANDARD_PAYOFF,
        executionNoise: 0.05,
        seed: 7,
        generations: 60,
      }),
    [species],
  )

  const final = result.history[result.history.length - 1]
  const winnerIdx = final.indexOf(Math.max(...final))
  const playerIdx = playerDef ? species.length - 1 : -1
  const playerFate = playerIdx >= 0 ? fateOf(final[playerIdx]) : null
  const predictionHit = prediction !== null && prediction === playerFate

  const begin = (p: Fate) => {
    resumeAudio()
    soundPlay('click')
    setPrediction(p)
    setWatching(true)
  }

  // 키보드: 예측 게이트에서 1/2/3, 그 외 화면에선 Esc로 돌아가기
  const gateOpen = playerDef !== null && !watching
  useHotkeys(
    gateOpen
      ? {
          '1': () => begin('thrive'),
          '2': () => begin('survive'),
          '3': () => begin('extinct'),
          escape: onBack,
        }
      : { escape: onBack },
  )

  // 예측 게이트: 내 전략이 있고 아직 예측 전
  if (playerDef && !watching) {
    return (
      <div className="screen">
        <h2 className="screen-title">🌱 진화의 정원</h2>
        <div className="card evo-gate">
          <p className="evo-gate-strategy">
            내 전략 <strong>{playerDef.glyph} {playerDef.name}</strong> 이(가) 일곱 번째 종으로
            정원에 심어집니다. 여섯 토박이 전략과 60세대를 경쟁해요.
          </p>
          <p className="evo-gate-q">60세대 후, 당신의 전략은 어떻게 될까요?</p>
          <div className="evo-gate-btns">
            {(['thrive', 'survive', 'extinct'] as Fate[]).map((f, i) => (
              <button key={f} className="btn ghost" onClick={() => begin(f)}>
                {FATE_LABEL[f]} <kbd className="kbd-hint">{i + 1}</kbd>
              </button>
            ))}
          </div>
          <button className="btn ghost small" onClick={onCreateStrategy}>
            🛠 전략 수정하러 가기
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="screen">
      <h2 className="screen-title">🌱 진화의 정원</h2>
      <p className="hint">
        {playerDef
          ? '일곱 종이 한 인구 안에서 경쟁해요. 점수가 낮은 종은 사라지고 높은 종이 번성합니다. (통신 오류 5%)'
          : '여섯 전략이 한 인구 안에서 경쟁해요. 세대가 지나며 점수가 낮은 전략은 사라지고 높은 전략이 번성합니다. (통신 오류 5%)'}
      </p>
      <EvolutionChart
        history={result.history}
        colors={species.map((s) => s.color)}
        onDone={() => setChartDone(true)}
      />
      <div className="evo-legend">
        {species.map((s, i) => (
          <span key={s.name} className={`evo-item${i === playerIdx ? ' mine' : ''}`}>
            <span className="evo-dot" style={{ background: s.color }} />
            {s.name} {Math.round(final[i] * 100)}%
          </span>
        ))}
      </div>

      {playerDef && playerFate && chartDone && (
        <div className={`card evo-verdict fate-${playerFate}`}>
          {prediction !== null && (
            <span className={`rv-stamp ${predictionHit ? 'hit' : 'miss'}`}>
              {predictionHit ? '간파!' : '빗나감'}
            </span>
          )}
          <strong>
            {playerDef.glyph} {playerDef.name} —{' '}
            {playerFate === 'thrive'
              ? `번성 (${Math.round(final[playerIdx] * 100)}%)`
              : playerFate === 'survive'
                ? `생존 (${Math.round(final[playerIdx] * 100)}%)`
                : '멸종'}
          </strong>
          <p className="evo-blurb">{fateBlurb(playerFate, playerDef)}</p>
          <button className="btn ghost small" onClick={onCreateStrategy}>
            🛠 공방으로 돌아가 수정하기
          </button>
        </div>
      )}

      {!playerDef && (
        <div className="card evo-cta">
          <p>나만의 전략을 만들어 일곱 번째 종으로 심어볼 수 있어요.</p>
          <button className="btn primary" onClick={onCreateStrategy}>
            🛠 내 전략 만들기
          </button>
        </div>
      )}

      <p className="lesson">
        끝에는 <strong>{species[winnerIdx].name}</strong>의 인구가 가장 많아요. 무조건 배신하는
        악당은 처음엔 늘지만 서로 잡아먹어 쇠퇴하고, 협력을 되갚는 전략은 자기들끼리 모여
        번성해요. 이게 협력이 세상에서 살아남는 이유예요.
      </p>
      <div className="actions">
        <button className="btn primary" onClick={onBack}>
          돌아가기
        </button>
      </div>
    </div>
  )
}
