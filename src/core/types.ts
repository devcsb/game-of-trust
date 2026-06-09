export type Move = 'C' | 'D'

/** 표준 죄수의 딜레마 보수 행렬. 제약: T>R>P>S, 2R>T+S */
export interface PayoffMatrix {
  readonly T: number // Temptation: 상대가 협력할 때 배신하면
  readonly R: number // Reward: 상호 협력
  readonly P: number // Punishment: 상호 배신
  readonly S: number // Sucker: 협력했는데 배신당함
}

/** 전략이 매 라운드 보는 정보. 상대 행동은 '인식된(perceived)' 값이다. */
export interface Observation {
  readonly round: number // 0-base
  readonly selfLastIntended: Move | null // 직전 내 의도 (Pavlov가 결과 평가에 사용)
  readonly selfLastPlayed: Move | null // 직전 내가 실제로 둔 수
  readonly oppLastPerceived: Move | null // 직전 상대가 둔 것으로 내가 본 수
}

export interface RoundResult {
  readonly round: number
  readonly intended: readonly [Move, Move] // 전략이 의도한 수
  readonly played: readonly [Move, Move] // execution noise 적용 후 실제 수
  readonly perceived: readonly [Move, Move] // [a가 본 b, b가 본 a] (perception noise)
  readonly payoff: readonly [number, number]
}

export interface MatchConfig {
  readonly rounds: number
  readonly payoff: PayoffMatrix
  readonly executionNoise: number // 0..1 의도가 뒤집힐 확률
  readonly perceptionNoise: number // 0..1 상대 행동을 잘못 볼 확률
  readonly seed: number
}
