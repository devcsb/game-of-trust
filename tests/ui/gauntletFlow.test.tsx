// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import { GauntletView } from '../../src/ui/GauntletView'
import { WORLDS } from '../../src/game/worlds'
import { ENCOUNTERS } from '../../src/sim/gauntlet'
import type { CustomStrategyDef } from '../../src/core/strategy/custom'

/**
 * 안개의 세계(피벗 모드) 플로우 통합 테스트.
 * commit → play(6 조우 공개) → result → onComplete 사이클을 회귀로 잠근다.
 */

const TFT_STANCE: CustomStrategyDef = {
  v: 1,
  name: 'tft',
  glyph: '🪞',
  firstMove: 'C',
  onCoop: 'reciprocate',
  onDefect: 'retaliate',
}

describe('GauntletView 플로우 (안개 낀 장터)', () => {
  afterEach(() => cleanup())

  function mount() {
    const onComplete = vi.fn()
    const onQuit = vi.fn()
    render(
      <GauntletView
        world={WORLDS[0]}
        initialStance={TFT_STANCE}
        onComplete={onComplete}
        onQuit={onQuit}
      />,
    )
    return { onComplete, onQuit }
  }

  it('커밋 화면에 단서와 스탠스 카드가 보인다', () => {
    mount()
    expect(screen.getByText(/안개 속 단서/)).toBeTruthy()
    expect(screen.getByText(/안개 속으로/)).toBeTruthy()
  })

  it('조우마다 읽기 베팅 후 공개하고, 결과 화면에서 onComplete가 한 번 불린다', () => {
    const { onComplete } = mount()
    fireEvent.click(screen.getByRole('button', { name: /안개 속으로/ }))
    // play 단계: 각 조우마다 베팅(협력적) → 공개 → 다음. 마지막엔 "결과 보기".
    for (let i = 0; i < ENCOUNTERS; i++) {
      // bet 단계: 안개 속 상대를 협력적으로 읽음
      fireEvent.click(screen.getByRole('button', { name: /협력적일 듯/ }))
      // reveal 단계: 정체 공개 후 진행
      fireEvent.click(screen.getByRole('button', { name: /다음 조우|결과 보기/ }))
    }
    // result 화면
    expect(screen.getByText(/이론적 최선의/)).toBeTruthy()
    expect(screen.getByText(/안개 읽기/)).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: /세계 지도로|계속/ }))
    expect(onComplete).toHaveBeenCalledTimes(1)
    const arg = onComplete.mock.calls[0][0]
    expect(arg.stars).toBeGreaterThanOrEqual(0)
    expect(arg.stars).toBeLessThanOrEqual(3)
    expect(arg.efficiency).toBeGreaterThanOrEqual(0)
    expect(arg.efficiency).toBeLessThanOrEqual(1)
  })

  it('나가기 버튼이 onQuit을 부른다', () => {
    const { onQuit } = mount()
    fireEvent.click(screen.getByRole('button', { name: /나가기/ }))
    expect(onQuit).toHaveBeenCalledTimes(1)
  })
})
