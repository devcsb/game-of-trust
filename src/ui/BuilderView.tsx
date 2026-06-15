import { useMemo, useState } from 'react'
import { STANDARD_PAYOFF } from '../core/payoff'
import { mulberry32 } from '../core/rng'
import { runMatch } from '../sim/match'
import type { MatchOutcome } from '../sim/match'
import {
  DEFAULT_DEF,
  FIRST_MOVE_CARDS,
  GLYPHS,
  ON_COOP_CARDS,
  ON_DEFECT_CARDS,
  REINVENT_MESSAGE,
  detectBuiltinEquivalent,
} from '../core/strategy/custom'
import type { CustomStrategyDef } from '../core/strategy/custom'
import { useHotkeys } from './useHotkeys'
import { play as soundPlay, resumeAudio } from '../audio/sound'

function SparTrack({ outcome, label }: { outcome: MatchOutcome; label: string }) {
  return (
    <div className="spar-row">
      <span className="spar-label">{label}</span>
      <div className="track" aria-hidden>
        {outcome.rounds.map((r, i) => (
          <span key={i} className="track-col">
            <span className={`dot ${r.played[0] === 'C' ? 'c' : 'd'}`} />
            <span className={`dot ${r.played[1] === 'C' ? 'c' : 'd'}`} />
          </span>
        ))}
      </div>
      <span className="spar-score">
        {outcome.score[0]} : {outcome.score[1]}
      </span>
    </div>
  )
}

/**
 * 전략 공방: 카드 3슬롯으로 나만의 전략을 조립한다.
 * 카드를 바꿀 때마다 거울/악당과의 즉석 스파링이 갱신되고(만지면 바로 반응),
 * 빌트인과 동치 조합이면 재발명 토스트로 알려준다.
 */
export function BuilderView({
  initial,
  onSave,
  onBack,
}: {
  initial: CustomStrategyDef | null
  onSave: (def: CustomStrategyDef) => void
  onBack: () => void
}) {
  const [def, setDef] = useState<CustomStrategyDef>(initial ?? DEFAULT_DEF)

  const update = (patch: Partial<CustomStrategyDef>) => {
    resumeAudio()
    soundPlay('click')
    setDef((d) => ({ ...d, ...patch }))
  }

  const spar = useMemo(() => {
    const cfg = {
      rounds: 10,
      payoff: STANDARD_PAYOFF,
      executionNoise: 0,
      perceptionNoise: 0,
      seed: 11,
    }
    return {
      vsMirror: runMatch({ custom: def }, { id: 'tft' }, cfg, mulberry32(11)),
      vsVillain: runMatch({ custom: def }, { id: 'alld' }, cfg, mulberry32(11)),
    }
  }, [def])

  const eq = detectBuiltinEquivalent(def)
  const eqMsg = eq ? REINVENT_MESSAGE[eq] : null

  // 키보드: Enter 저장, Esc 뒤로 (이름 입력 중에는 발동하지 않음)
  useHotkeys({ enter: () => onSave(def), escape: onBack })

  return (
    <div className="screen">
      <h2 className="screen-title">🛠 전략 공방</h2>
      <p className="hint">
        카드 세 장으로 나만의 전략을 만들어요. 완성된 전략은 진화의 정원에 7번째 종으로
        참가해요.
      </p>

      <div className="card builder-card">
        <div className="builder-name-row">
          <div className="glyph-picker">
            {GLYPHS.map((g) => (
              <button
                key={g}
                className={`glyph-btn${def.glyph === g ? ' on' : ''}`}
                onClick={() => update({ glyph: g })}
                aria-label={`상징 ${g}`}
              >
                {g}
              </button>
            ))}
          </div>
          <input
            className="name-input"
            value={def.name}
            maxLength={12}
            onChange={(e) => setDef((d) => ({ ...d, name: e.target.value || '나의 전략' }))}
            aria-label="전략 이름"
          />
        </div>

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

        {eqMsg && <div className="reinvent-toast">💡 {eqMsg}</div>}

        <div className="spar">
          <span className="slot-title">즉석 스파링 (위가 내 전략, 10라운드)</span>
          <SparTrack outcome={spar.vsMirror} label="vs 거울 🪞" />
          <SparTrack outcome={spar.vsVillain} label="vs 악당 😈" />
        </div>
      </div>

      <div className="actions">
        <button className="btn ghost" onClick={onBack}>
          돌아가기
        </button>
        <button className="btn primary" onClick={() => onSave(def)}>
          {def.glyph} 이 전략으로 정원에 심기 <kbd className="kbd-hint">Enter</kbd>
        </button>
      </div>
    </div>
  )
}
