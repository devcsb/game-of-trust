import { describe, it, expect } from 'vitest'
import {
  runGauntlet,
  gradeGauntlet,
  bestBaseStrategy,
  worstReasonableScore,
  allBaseStrategies,
  worldAnchors,
  encounterClass,
  opponentCoopRate,
  ENCOUNTERS,
} from '../../src/sim/gauntlet'
import { WORLDS, worldById } from '../../src/game/worlds'
import { isValidPayoff } from '../../src/core/payoff'
import type { CustomStrategyDef } from '../../src/core/strategy/custom'

const TFT_DEF: CustomStrategyDef = {
  v: 1,
  name: 'tft',
  glyph: '🪞',
  firstMove: 'C',
  onCoop: 'reciprocate',
  onDefect: 'retaliate',
}

const ALLD_DEF: CustomStrategyDef = {
  v: 1,
  name: 'alld',
  glyph: '😈',
  firstMove: 'D',
  onCoop: 'betray',
  onDefect: 'retaliate',
}

describe('world definitions', () => {
  it('모든 세계가 유효한 PD 보수 행렬을 쓴다 (T>R>P>S, 2R>T+S)', () => {
    for (const w of WORLDS) expect(isValidPayoff(w.payoff)).toBe(true)
  })

  it('모든 세계의 개체군 비중은 양수다', () => {
    for (const w of WORLDS) {
      expect(w.population.length).toBeGreaterThan(0)
      for (const m of w.population) expect(m.weight).toBeGreaterThan(0)
    }
  })

  it('worldById가 정의된 세계를 찾는다', () => {
    expect(worldById('w1-bazaar')?.name).toBe('안개 낀 장터')
    expect(worldById('nope')).toBeUndefined()
  })
})

describe('runGauntlet 결정성', () => {
  it('같은 (전략, 세계)는 항상 같은 결과를 낸다', () => {
    const w = WORLDS[0]
    const a = runGauntlet({ custom: TFT_DEF }, w)
    const b = runGauntlet({ custom: TFT_DEF }, w)
    expect(a.totalPlayer).toBe(b.totalPlayer)
    expect(a.encounters.map((e) => e.oppLabel)).toEqual(b.encounters.map((e) => e.oppLabel))
    expect(a.encounters.map((e) => e.rounds)).toEqual(b.encounters.map((e) => e.rounds))
  })

  it('정확히 ENCOUNTERS번 조우하고 라운드 수는 [min,max] 범위 안이다', () => {
    for (const w of WORLDS) {
      const res = runGauntlet({ custom: TFT_DEF }, w)
      expect(res.encounters.length).toBe(ENCOUNTERS)
      for (const e of res.encounters) {
        expect(e.rounds).toBeGreaterThanOrEqual(w.roundsMin)
        expect(e.rounds).toBeLessThanOrEqual(w.roundsMax)
      }
      expect(res.rounds).toBe(res.encounters.reduce((a, e) => a + e.rounds, 0))
      expect(res.totalWelfare).toBe(res.totalPlayer + res.totalOpp)
    }
  })
})

describe('채점 앵커', () => {
  it('카드 공간은 정확히 16개 기본 전략이다', () => {
    expect(allBaseStrategies().length).toBe(16)
  })

  it('bestBaseStrategy 점수가 AllD 하한 이상이다', () => {
    for (const w of WORLDS) {
      const best = bestBaseStrategy(w)
      const floor = worstReasonableScore(w)
      expect(best.score).toBeGreaterThanOrEqual(floor)
    }
  })

  it('효율은 0..1, 별은 0..3이며 best 전략은 별 3개를 받는다', () => {
    for (const w of WORLDS) {
      const best = bestBaseStrategy(w)
      const grade = gradeGauntlet({ custom: best.def }, w)
      expect(grade.efficiency).toBeGreaterThanOrEqual(0)
      expect(grade.efficiency).toBeLessThanOrEqual(1)
      expect(grade.efficiency).toBeCloseTo(1, 5)
      expect(grade.stars).toBe(3)
    }
  })
})

describe('안개 읽기 베팅 분류', () => {
  it('opponentCoopRate는 0..1이고, encounterClass는 50% 기준으로 가른다', () => {
    const w = WORLDS[0]
    const res = runGauntlet({ custom: TFT_DEF }, w)
    for (const enc of res.encounters) {
      const rate = opponentCoopRate(enc)
      expect(rate).toBeGreaterThanOrEqual(0)
      expect(rate).toBeLessThanOrEqual(1)
      expect(encounterClass(enc)).toBe(rate >= 0.5 ? 'coop' : 'hostile')
    }
  })
})

describe('worldAnchors 메모이즈', () => {
  it('같은 세계 앵커는 brute-force 재계산 없이 동일 객체를 돌려준다', () => {
    const a = worldAnchors(WORLDS[0])
    const b = worldAnchors(WORLDS[0])
    expect(a).toBe(b) // 캐시된 동일 참조
    expect(a.bestScore).toBe(bestBaseStrategy(WORLDS[0]).score)
  })

  it('gradeGauntlet은 채점에 쓴 플레이어 조우 결과를 함께 돌려준다 (재시뮬 방지)', () => {
    const grade = gradeGauntlet({ custom: TFT_DEF }, WORLDS[0])
    expect(grade.playerResult.encounters.length).toBe(ENCOUNTERS)
    expect(grade.playerResult.totalPlayer).toBe(grade.playerScore)
  })
})

describe('피벗 명제: 최적 스탠스는 세계마다 다르고 숨겨져 있다', () => {
  it('입문 세계(장터)에선 협력으로 보답하는 손이 무조건 배신을 이긴다', () => {
    // 온보딩 세계는 "협력이 통한다"를 분명히 보여줘야 한다.
    const w = worldById('w1-bazaar')!
    const tft = runGauntlet({ custom: TFT_DEF }, w).totalPlayer
    const alld = runGauntlet({ custom: ALLD_DEF }, w).totalPlayer
    expect(tft).toBeGreaterThan(alld)
  })

  it('세계마다 최적 기본 전략이 동일하지 않다 (고정 정답 없음)', () => {
    // 피벗의 핵심: 보편 정답이 아니라, 숨은 세계 구성에 스탠스를 맞춰야 한다.
    const keyOf = (d: { firstMove: string; onCoop: string; onDefect: string }) =>
      `${d.firstMove}/${d.onCoop}/${d.onDefect}`
    const bestKeys = new Set(WORLDS.map((w) => keyOf(bestBaseStrategy(w).def)))
    expect(bestKeys.size).toBeGreaterThan(1)
  })

  it('변경(굶주린 변경)에선 유혹이 커도 협력적 보복이 순진한 착취를 크게 앞선다', () => {
    const w = worldById('w2-frontier')!
    const tft = runGauntlet({ custom: TFT_DEF }, w).totalPlayer
    const alld = runGauntlet({ custom: ALLD_DEF }, w).totalPlayer
    expect(tft).toBeGreaterThan(alld)
  })
})
