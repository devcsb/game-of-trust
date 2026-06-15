import { useEffect, useRef, useState } from 'react'
import type { Move } from '../core/types'
import type { GameRunner, GameRoundResult } from '../sim/gameRunner'

/** 공개 연출의 진행 단계. 연출은 오버레이로만 떠 있다가 정산되면 사라진다. */
export type RevealStep = 'slide' | 'beat' | 'flip' | 'stamp'

export type RoundPhase =
  | { name: 'predict' }
  | { name: 'commit'; predicted: Move | null }
  | { name: 'reveal'; result: GameRoundResult; predicted: Move | null; step: RevealStep }
  | { name: 'done' }

export interface RoundPhaseCallbacks {
  /** 드럼롤 비트 시작 */
  onBeat?(): void
  /** 카드가 뒤집혀 결과가 보이는 순간. history 반영·사운드는 여기서. 라운드당 정확히 1회. */
  onFlip(result: GameRoundResult, predicted: Move | null): void
  /** 예측 스탬프가 찍히는 순간. 통찰 정산은 여기서. 라운드당 정확히 1회. */
  onStamp?(result: GameRoundResult, predicted: Move | null): void
  /** 공개 연출이 끝나고 다음 입력 단계로 돌아가는 순간 (재전송 윈도우 등 후속 처리). */
  onSettle?(result: GameRoundResult, predicted: Move | null): void
}

const TIMING = { slide: 320, beat: 380, flip: 480, stamp: 700 } as const

export function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true
  )
}

/**
 * 예측 → 커밋 → 공개 → 정산 4단계 라운드 상태기계.
 * 코어(runner)는 pull 기반 순수 진행기로 두고, 타이밍 연출은 전부 이 훅이 가진다.
 * reduced-motion이면 공개 연출을 건너뛰고 즉시 정산한다.
 */
export function useRoundPhases(
  runner: GameRunner,
  predictionEnabled: boolean,
  cb: RoundPhaseCallbacks,
): {
  phase: RoundPhase
  predict(m: Move): void
  /** 엿보기 경로: 예측 없이 커밋으로 (predicted=null → 간파 적립 없음) */
  skipPredict(): void
  commit(m: Move): void
  skipReveal(): void
  /** 외부에서 runner를 일괄 진행(빨리감기)한 뒤 위상을 현재 runner 상태로 재동기화한다. */
  resync(): void
} {
  const entry = (): RoundPhase =>
    runner.done
      ? { name: 'done' }
      : predictionEnabled
        ? { name: 'predict' }
        : { name: 'commit', predicted: null }

  const [phase, setPhase] = useState<RoundPhase>(entry)
  const cbRef = useRef(cb)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const fired = useRef({ flip: false, stamp: false })
  // 연출 진행 중 플래그. state(phase)는 같은 틱 안에서 stale할 수 있어 ref로 즉시 잠근다.
  // (없으면 더블 클릭/키 연타가 한 틱에 commit을 두 번 통과시켜 타이머 체인이 겹친다.)
  const revealing = useRef(false)
  // 체인 토큰. 정산/스킵 시 증가시켜, 살아남은 옛 타이머 콜백을 전부 무효화한다.
  const chain = useRef(0)

  // 항상 최신 콜백을 보게 하는 latest-ref 패턴 (렌더 중 ref 갱신 금지 → effect에서)
  useEffect(() => {
    cbRef.current = cb
  })

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current)
    },
    [],
  )

  const fireFlip = (r: GameRoundResult, p: Move | null) => {
    if (fired.current.flip) return
    fired.current.flip = true
    cbRef.current.onFlip(r, p)
  }

  const fireStamp = (r: GameRoundResult, p: Move | null) => {
    if (fired.current.stamp) return
    fired.current.stamp = true
    cbRef.current.onStamp?.(r, p)
  }

  const settle = (result: GameRoundResult, predicted: Move | null) => {
    chain.current++ // 남아 있는 타이머 콜백 무효화
    if (timer.current) clearTimeout(timer.current)
    revealing.current = false
    setPhase(entry())
    cbRef.current.onSettle?.(result, predicted)
  }

  const runReveal = (result: GameRoundResult, predicted: Move | null) => {
    const id = ++chain.current
    revealing.current = true
    fired.current = { flip: false, stamp: false }
    if (timer.current) clearTimeout(timer.current)

    // 이 체인이 아직 유효할 때만 실행되는 예약
    const schedule = (ms: number, fn: () => void) => {
      timer.current = setTimeout(() => {
        if (chain.current === id) fn()
      }, ms)
    }

    if (prefersReducedMotion()) {
      fireFlip(result, predicted)
      fireStamp(result, predicted)
      settle(result, predicted)
      return
    }
    setPhase({ name: 'reveal', result, predicted, step: 'slide' })
    schedule(TIMING.slide, () => {
      cbRef.current.onBeat?.()
      setPhase({ name: 'reveal', result, predicted, step: 'beat' })
      schedule(TIMING.beat, () => {
        fireFlip(result, predicted)
        setPhase({ name: 'reveal', result, predicted, step: 'flip' })
        schedule(TIMING.flip, () => {
          fireStamp(result, predicted)
          setPhase({ name: 'reveal', result, predicted, step: 'stamp' })
          schedule(TIMING.stamp, () => settle(result, predicted))
        })
      })
    })
  }

  const predict = (m: Move) => {
    if (revealing.current) return
    setPhase((p) => (p.name === 'predict' ? { name: 'commit', predicted: m } : p))
  }

  const skipPredict = () => {
    if (revealing.current) return
    setPhase((p) => (p.name === 'predict' ? { name: 'commit', predicted: null } : p))
  }

  const commit = (m: Move) => {
    if (phase.name !== 'commit' || runner.done || revealing.current) return
    if (!runner.roundPending) runner.beginRound()
    const result = runner.commitRound(m)
    runReveal(result, phase.predicted)
  }

  const skipReveal = () => {
    if (phase.name !== 'reveal' || !revealing.current) return
    fireFlip(phase.result, phase.predicted)
    fireStamp(phase.result, phase.predicted)
    settle(phase.result, phase.predicted)
  }

  const resync = () => {
    chain.current++ // 살아 있는 옛 타이머 콜백 무효화
    if (timer.current) clearTimeout(timer.current)
    revealing.current = false
    setPhase(entry())
  }

  return { phase, predict, skipPredict, commit, skipReveal, resync }
}
