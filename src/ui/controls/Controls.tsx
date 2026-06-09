import type { AppConfig } from '../../state/store'
import { STRATEGY_LABELS } from '../../state/store'
import { STRATEGY_IDS } from '../../core/strategy/registry'
import type { StrategyId } from '../../core/strategy/Strategy'
import { isValidPayoff } from '../../core/payoff'
import { SCENARIOS, getScenario } from '../../state/scenarios'

interface Props {
  config: AppConfig
  onChange: (c: AppConfig) => void
}

function Slider(props: {
  label: string
  min: number
  max: number
  step: number
  value: number
  onChange: (v: number) => void
}) {
  return (
    <label className="ctl">
      <span className="ctl-label">{props.label}</span>
      <input
        type="range"
        min={props.min}
        max={props.max}
        step={props.step}
        value={props.value}
        onChange={(e) => props.onChange(Number(e.target.value))}
        aria-label={props.label}
      />
    </label>
  )
}

function NumBox(props: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <label className="numbox">
      <span>{props.label}</span>
      <input
        type="number"
        value={props.value}
        step={1}
        onChange={(e) => props.onChange(Number(e.target.value))}
        aria-label={`payoff ${props.label}`}
      />
    </label>
  )
}

const pct = (v: number) => `${Math.round(v * 100)}%`

export function Controls({ config, onChange }: Props) {
  const set = <K extends keyof AppConfig,>(k: K, v: AppConfig[K]) =>
    onChange({ ...config, [k]: v })
  const setPayoff = (k: keyof AppConfig['payoff'], v: number) =>
    onChange({ ...config, payoff: { ...config.payoff, [k]: v } })

  const valid = isValidPayoff(config.payoff)
  const usesGtft = config.strategyA === 'gtft' || config.strategyB === 'gtft'
  const scenario = getScenario(config.scenarioId)

  return (
    <div className="controls">
      <label className="ctl">
        <span className="ctl-label">시나리오</span>
        <select
          value={config.scenarioId}
          onChange={(e) => set('scenarioId', e.target.value)}
        >
          {SCENARIOS.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </label>

      <label className="ctl">
        <span className="ctl-label">전략 A</span>
        <select
          value={config.strategyA}
          onChange={(e) => set('strategyA', e.target.value as StrategyId)}
        >
          {STRATEGY_IDS.map((id) => (
            <option key={id} value={id}>
              {STRATEGY_LABELS[id]}
            </option>
          ))}
        </select>
      </label>

      <label className="ctl">
        <span className="ctl-label">전략 B</span>
        <select
          value={config.strategyB}
          onChange={(e) => set('strategyB', e.target.value as StrategyId)}
        >
          {STRATEGY_IDS.map((id) => (
            <option key={id} value={id}>
              {STRATEGY_LABELS[id]}
            </option>
          ))}
        </select>
      </label>

      <Slider
        label={`${scenario.noiseLabel} ${pct(config.executionNoise)}`}
        min={0}
        max={0.5}
        step={0.01}
        value={config.executionNoise}
        onChange={(v) => set('executionNoise', v)}
      />
      <Slider
        label={`인식 노이즈 ${pct(config.perceptionNoise)}`}
        min={0}
        max={0.5}
        step={0.01}
        value={config.perceptionNoise}
        onChange={(v) => set('perceptionNoise', v)}
      />
      {config.perceptionNoise > 0 && (
        <p className="note">인식 노이즈는 실행 노이즈와 동역학이 달라요. 결과 해석에 주의하세요.</p>
      )}

      <Slider
        label={`관용도 q ${config.generosity.toFixed(2)}`}
        min={0}
        max={1}
        step={0.01}
        value={config.generosity}
        onChange={(v) => set('generosity', v)}
      />
      {!usesGtft && <p className="note dim">관용도 q는 Generous TFT 전략에만 적용돼요.</p>}

      <div className="payoff">
        <span className="ctl-label">Payoff (T R P S)</span>
        <div className="payoff-row">
          <NumBox label="T" value={config.payoff.T} onChange={(v) => setPayoff('T', v)} />
          <NumBox label="R" value={config.payoff.R} onChange={(v) => setPayoff('R', v)} />
          <NumBox label="P" value={config.payoff.P} onChange={(v) => setPayoff('P', v)} />
          <NumBox label="S" value={config.payoff.S} onChange={(v) => setPayoff('S', v)} />
        </div>
        {!valid && <p className="warn">제약 위반: T&gt;R&gt;P&gt;S, 2R&gt;T+S</p>}
      </div>

      <Slider
        label={`라운드 ${config.rounds}`}
        min={5}
        max={300}
        step={5}
        value={config.rounds}
        onChange={(v) => set('rounds', v)}
      />

      <label className="ctl">
        <span className="ctl-label">시드</span>
        <input
          type="number"
          value={config.seed}
          onChange={(e) => set('seed', Number(e.target.value))}
        />
      </label>
    </div>
  )
}
