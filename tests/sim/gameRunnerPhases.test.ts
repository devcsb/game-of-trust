import { describe, it, expect } from 'vitest'
import { createGameRunner } from '../../src/sim/gameRunner'
import { STANDARD_PAYOFF } from '../../src/core/payoff'
import type { GameRunnerOptions } from '../../src/sim/gameRunner'
import type { Move } from '../../src/core/types'

const opts = (over: Partial<GameRunnerOptions> = {}): GameRunnerOptions => ({
  opponentId: 'tft',
  rounds: 10,
  payoff: STANDARD_PAYOFF,
  executionNoise: 0,
  seed: 1,
  ...over,
})

describe('gameRunner phases (begin/peek/commit)', () => {
  it('begin+commit equals playRound (RNG stream identical)', () => {
    const moves: Move[] = ['C', 'D', 'C', 'C', 'D', 'C', 'D', 'C', 'C', 'C']
    const a = createGameRunner(opts({ executionNoise: 0.2, seed: 42 }))
    const b = createGameRunner(opts({ executionNoise: 0.2, seed: 42 }))
    const ra = moves.map((m) => a.playRound(m))
    const rb = moves.map((m) => {
      b.beginRound()
      return b.commitRound(m)
    })
    expect(ra).toEqual(rb)
  })

  it('peek reveals opponent intent without consuming RNG', () => {
    const moves: Move[] = ['C', 'D', 'C', 'D', 'C']
    const plain = createGameRunner(opts({ executionNoise: 0.3, seed: 9, rounds: 5 }))
    const peeky = createGameRunner(opts({ executionNoise: 0.3, seed: 9, rounds: 5 }))
    const ra = moves.map((m) => plain.playRound(m))
    const rb = moves.map((m) => {
      peeky.beginRound()
      const intent = peeky.peekOpponentIntent()
      const r = peeky.commitRound(m)
      expect(r.opponentIntended).toBe(intent) // 엿본 의도와 실제 의도 일치
      return r
    })
    expect(ra).toEqual(rb) // 엿보기가 결과를 바꾸지 않는다
  })

  it('exposes opponentIntended vs opponentPlayed under full noise', () => {
    const g = createGameRunner(opts({ executionNoise: 1 }))
    const r = g.playRound('C')
    // tft 첫 수 의도는 C, 노이즈 1.0이라 전달은 D
    expect(r.opponentIntended).toBe('C')
    expect(r.opponentPlayed).toBe('D')
    expect(r.opponentMoveFlipped).toBe(true)
  })

  it('throws on double begin / commit without begin / peek without begin', () => {
    const g = createGameRunner(opts())
    expect(() => g.commitRound('C')).toThrow()
    expect(() => g.peekOpponentIntent()).toThrow()
    g.beginRound()
    expect(() => g.beginRound()).toThrow()
    expect(g.roundPending).toBe(true)
    g.commitRound('C')
    expect(g.roundPending).toBe(false)
  })
})

describe('gameRunner amend (재전송)', () => {
  it('recomputes the flipped round: payoff, cumulative scores, flags', () => {
    const g = createGameRunner(opts({ executionNoise: 1, rounds: 2 }))
    const r1 = g.playRound('C') // 내 C가 D로 전달
    expect(r1.playerMoveFlipped).toBe(true)
    expect(r1.playerPlayed).toBe('D')
    // 상대(tft) 의도 C → 노이즈로 D 전달. (D,D)=P=1씩
    expect(r1.payoff).toEqual([1, 1])

    const fixed = g.amendLastRound()
    expect(fixed.amended).toBe(true)
    expect(fixed.playerPlayed).toBe('C')
    expect(fixed.playerMoveFlipped).toBe(false)
    // (C,D) → 나 S=0, 상대 T=5
    expect(fixed.payoff).toEqual([0, 5])
    expect(g.playerScore).toBe(0)
    expect(g.opponentScore).toBe(5)
  })

  it('amend consumes no RNG: later draws identical with or without amend', () => {
    // 인식 의존 전략(tft 등)은 정정으로 다음 의도가 달라지는 게 정상(그게 재전송의 목적).
    // RNG 스트림 정렬은 인식과 무관하게 매 라운드 RNG를 쓰는 random 상대로 검증한다.
    const seed = 333
    const a = createGameRunner(opts({ opponentId: 'random', executionNoise: 1, seed, rounds: 3 }))
    const b = createGameRunner(opts({ opponentId: 'random', executionNoise: 1, seed, rounds: 3 }))
    a.playRound('C')
    b.playRound('C')
    b.amendLastRound()
    const ra = [a.playRound('D'), a.playRound('C')]
    const rb = [b.playRound('D'), b.playRound('C')]
    expect(ra.map((r) => [r.playerPlayed, r.opponentIntended, r.opponentPlayed])).toEqual(
      rb.map((r) => [r.playerPlayed, r.opponentIntended, r.opponentPlayed]),
    )
  })

  it('amended move is what the opponent perceives next round', () => {
    // grudger 상대: 내 D 전달이 정정되지 않으면 영원히 보복.
    // 노이즈 1.0 → 1라운드 내 C가 D로 전달 → 정정 → grudger는 C로 인식해야 함.
    const g = createGameRunner(opts({ opponentId: 'grudger', executionNoise: 1, rounds: 2, seed: 5 }))
    g.playRound('C')
    g.amendLastRound()
    g.beginRound()
    // 정정 덕에 도화선이 점화되지 않아 grudger 의도는 여전히 C
    expect(g.peekOpponentIntent()).toBe('C')
  })

  it('throws when not amendable: no flip, after next begin, or twice', () => {
    const g = createGameRunner(opts({ executionNoise: 0, rounds: 3 }))
    g.playRound('C') // 노이즈 0 → 뒤집힘 없음
    expect(() => g.amendLastRound()).toThrow()

    const h = createGameRunner(opts({ executionNoise: 1, rounds: 3 }))
    h.playRound('C')
    h.beginRound()
    expect(() => h.amendLastRound()).toThrow() // 다음 라운드 시작 후

    const k = createGameRunner(opts({ executionNoise: 1, rounds: 3 }))
    k.playRound('C')
    k.amendLastRound()
    expect(() => k.amendLastRound()).toThrow() // 중복 정정
  })
})
