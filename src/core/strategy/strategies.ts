import type { StrategyFactory } from './Strategy'

export const allc: StrategyFactory = () => ({
  id: 'allc',
  label: 'Always Cooperate',
  next: () => 'C',
})

export const alld: StrategyFactory = () => ({
  id: 'alld',
  label: 'Always Defect',
  next: () => 'D',
})

export const random: StrategyFactory = () => ({
  id: 'random',
  label: 'Random',
  next: (_obs, rng) => (rng.next() < 0.5 ? 'C' : 'D'),
})

/** 첫 수 협력, 이후 상대의 (인식된) 직전 수를 따라 한다. */
export const tft: StrategyFactory = () => ({
  id: 'tft',
  label: 'Tit for Tat',
  next: (obs) => obs.oppLastPerceived ?? 'C',
})

/** 배신당하면 확률 q로 용서(C), 아니면 보복(D). q 기본값은 표준 payoff 최적값 1/3. */
export const gtft: StrategyFactory = (params) => {
  const q = params?.generosity ?? 1 / 3
  return {
    id: 'gtft',
    label: `Generous TFT (q=${q.toFixed(2)})`,
    next: (obs, rng) => {
      if (obs.oppLastPerceived === null || obs.oppLastPerceived === 'C') return 'C'
      return rng.next() < q ? 'C' : 'D'
    },
  }
}

/** 상대가 두 번 연속 배신할 때만 보복(한 번은 용서). Copykitten. */
export const tf2t: StrategyFactory = () => {
  let prevDefect = false
  return {
    id: 'tf2t',
    label: 'Tit for Two Tats',
    next: (obs) => {
      const d = obs.oppLastPerceived === 'D'
      const twoInARow = d && prevDefect
      prevDefect = d
      return twoInARow ? 'D' : 'C'
    },
  }
}

/** 한 번이라도 배신당하면 영원히 배신. 용서 없음. */
export const grudger: StrategyFactory = () => {
  let betrayed = false
  return {
    id: 'grudger',
    label: 'Grudger',
    next: (obs) => {
      if (obs.oppLastPerceived === 'D') betrayed = true
      return betrayed ? 'D' : 'C'
    },
  }
}

/** Win-Stay Lose-Shift. 상대가 협력(win)이면 직전 행동 유지, 배신(lose)이면 전환. */
export const pavlov: StrategyFactory = () => ({
  id: 'pavlov',
  label: 'Pavlov (WSLS)',
  next: (obs) => {
    if (obs.selfLastIntended === null) return 'C'
    const win = obs.oppLastPerceived === 'C'
    if (win) return obs.selfLastIntended
    return obs.selfLastIntended === 'C' ? 'D' : 'C'
  },
})
