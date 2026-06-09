import { useMemo } from 'react'
import type { AppConfig } from '../../state/store'
import { sweepGenerosityNoise } from '../../sim/sweep'
import { optimalGenerosity } from '../../core/payoff'
import { HeatmapCanvas } from '../viz/HeatmapCanvas'
import type { StrategyId } from '../../core/strategy/Strategy'

const OPPONENTS: StrategyId[] = ['tft', 'alld', 'allc', 'pavlov', 'tf2t']

export function Heatmap({ config }: { config: AppConfig }) {
  const result = useMemo(
    () =>
      sweepGenerosityNoise({
        payoff: config.payoff,
        rounds: 150,
        seed: config.seed,
        qSteps: 25,
        noiseSteps: 25,
        maxNoise: 0.3,
        opponents: OPPONENTS,
      }),
    [config.payoff, config.seed],
  )
  const optQ = optimalGenerosity(config.payoff)

  return (
    <div className="heatmap-mode">
      <p className="hint">
        x축 실행 노이즈, y축 관용도 q. 밝을수록 Generous TFT가 혼합 상대 풀(TFT, AllD, AllC,
        Pavlov, TF2T)에서 얻는 평균 점수가 높아요.
      </p>
      <div className="heatmap-wrap">
        <span className="axis-y-top">q=1 (항상 용서)</span>
        <HeatmapCanvas result={result} optimalQ={optQ} />
        <span className="axis-y-bot">q=0 (항상 보복)</span>
        <div className="axis-x">
          <span>noise 0</span>
          <span>noise 0.30</span>
        </div>
      </div>
      <div className="legend">
        <span className="lg dash">이론 최적 q = {optQ.toFixed(2)}</span>
        <span className="lg solid">실측 최적 (각 noise별 argmax)</span>
      </div>
      <p className="note">
        payoff(T R P S)를 바꾸면 이론 최적선이 위아래로 움직여요. 1/3은 표준 payoff(5,3,1,0)의
        특수해일 뿐 보편 법칙이 아니에요. noise가 0일 때는 AllD 착취를 피하려 관용이 낮은 게
        유리하고, 시끄러울수록 협력 복귀를 위해 관용이 올라갑니다.
      </p>
    </div>
  )
}
