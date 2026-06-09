import { useMemo } from 'react'
import type { AppConfig } from '../../state/store'
import { STRATEGY_LABELS } from '../../state/store'
import { getScenario } from '../../state/scenarios'
import { runMatch } from '../../sim/match'
import { mulberry32 } from '../../core/rng'
import { Timeline } from '../viz/Timeline'
import { ScoreLine } from '../viz/ScoreLine'

export function HeadToHead({ config }: { config: AppConfig }) {
  const outcome = useMemo(() => {
    const params = { generosity: config.generosity }
    return runMatch(
      { id: config.strategyA, params },
      { id: config.strategyB, params },
      {
        rounds: config.rounds,
        payoff: config.payoff,
        executionNoise: config.executionNoise,
        perceptionNoise: config.perceptionNoise,
        seed: config.seed,
      },
      mulberry32(config.seed),
    )
  }, [config])

  const scenario = getScenario(config.scenarioId)
  const avgA = outcome.avgPerRound[0].toFixed(2)
  const avgB = outcome.avgPerRound[1].toFixed(2)

  return (
    <div className="h2h">
      <div className="scores">
        <div className="score-pill a">
          <span className="who">A · {STRATEGY_LABELS[config.strategyA]}</span>
          <span className="val">{outcome.score[0]}</span>
          <span className="avg">평균 {avgA} / 라운드</span>
        </div>
        <div className="score-pill b">
          <span className="who">B · {STRATEGY_LABELS[config.strategyB]}</span>
          <span className="val">{outcome.score[1]}</span>
          <span className="avg">평균 {avgB} / 라운드</span>
        </div>
      </div>

      <h3 className="viz-title">
        라운드 타임라인 (위 A, 아래 B · 초록 {scenario.coop}, 빨강 {scenario.defect})
      </h3>
      <Timeline rounds={outcome.rounds} />

      <h3 className="viz-title">누적 점수 (파랑 A, 노랑 B)</h3>
      <ScoreLine rounds={outcome.rounds} />
    </div>
  )
}
