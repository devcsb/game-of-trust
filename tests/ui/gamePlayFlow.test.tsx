// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, act, cleanup } from '@testing-library/react'
import { GamePlay } from '../../src/ui/GamePlay'
import { STAGES } from '../../src/game/stages'

/**
 * s1(호구) 플로우 통합 테스트. 공개 연출 타이머 체인의 경합(검은 오버레이 잔류,
 * 라운드 중복 진행)을 회귀로 잠근다. 사운드는 AudioContext 부재로 자동 무음 no-op.
 * 라운드 수는 STAGES[0].rounds에서 끌어와 밸런스 변경에 깨지지 않게 한다.
 */

const REVEAL_TOTAL_MS = 320 + 380 + 480 + 700 + 50 // slide+beat+flip+stamp 여유
const ROUNDS = STAGES[0].rounds

function overlayCount(): number {
  return document.querySelectorAll('.reveal-overlay').length
}

// commit 협력 버튼만 — 빨리감기 버튼("남은 N턴 모두 "협력"...")과 겹치지 않게 ^앵커.
function coopBtn() {
  return screen.getByRole('button', { name: /^협력/ })
}

describe('GamePlay round flow (s1 호구)', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    cleanup()
    vi.useRealTimers()
  })

  function mount() {
    const onComplete = vi.fn()
    const onQuit = vi.fn()
    render(<GamePlay stage={STAGES[0]} onComplete={onComplete} onQuit={onQuit} />)
    return { onComplete, onQuit }
  }

  it('연출이 끝나면 오버레이가 사라지고 다음 라운드 입력이 가능하다', () => {
    mount()
    expect(overlayCount()).toBe(0)
    fireEvent.click(coopBtn())
    expect(overlayCount()).toBe(1)
    act(() => {
      vi.advanceTimersByTime(REVEAL_TOTAL_MS)
    })
    expect(overlayCount()).toBe(0)
    expect(screen.getByText(new RegExp(`라운드 2 / ${ROUNDS}`))).toBeTruthy()
  })

  it('연타해도 라운드가 한 번만 진행된다 (체인 중복 방지)', () => {
    mount()
    const coop = coopBtn()
    fireEvent.click(coop)
    fireEvent.click(coop) // 같은 틱 연타 — 두 번째는 무시되어야 한다
    fireEvent.click(coop)
    act(() => {
      vi.advanceTimersByTime(REVEAL_TOTAL_MS)
    })
    expect(overlayCount()).toBe(0)
    expect(screen.getByText(new RegExp(`라운드 2 / ${ROUNDS}`))).toBeTruthy()
  })

  it('오버레이 탭으로 즉시 정산되고 더블탭에도 안전하다', () => {
    mount()
    fireEvent.click(coopBtn())
    const overlay = document.querySelector('.reveal-overlay')!
    fireEvent.click(overlay)
    fireEvent.click(overlay) // 더블탭
    expect(overlayCount()).toBe(0)
    expect(screen.getByText(new RegExp(`라운드 2 / ${ROUNDS}`))).toBeTruthy()
    // 고아 타이머가 나중에 오버레이를 되살리지 않는다
    act(() => {
      vi.advanceTimersByTime(REVEAL_TOTAL_MS * 2)
    })
    expect(overlayCount()).toBe(0)
  })

  it('스킵과 자연 정산을 섞어 끝까지 수동 진행할 수 있다', () => {
    const { onComplete } = mount()
    for (let i = 0; i < ROUNDS; i++) {
      fireEvent.click(coopBtn())
      if (i % 2 === 0) {
        fireEvent.click(document.querySelector('.reveal-overlay')!) // 탭 스킵
      } else {
        act(() => {
          vi.advanceTimersByTime(REVEAL_TOTAL_MS)
        })
      }
      expect(overlayCount()).toBe(0)
    }
    fireEvent.click(screen.getByRole('button', { name: /결과 보기/ }))
    expect(onComplete).toHaveBeenCalledTimes(1)
    // 호구는 늘 협력 → 전 라운드 상호협력 → rounds*R(=3)
    expect(onComplete.mock.calls[0][0].score).toBe(ROUNDS * 3)
  })

  it('무반응 상대는 2라운드 뒤 빨리감기로 남은 턴을 한 번에 끝낸다', () => {
    const { onComplete } = mount()
    // 2라운드 수동 협력 (자연 정산) → 빨리감기 가용
    for (let i = 0; i < 2; i++) {
      fireEvent.click(coopBtn())
      act(() => {
        vi.advanceTimersByTime(REVEAL_TOTAL_MS)
      })
    }
    const ff = screen.getByRole('button', { name: /남은 .*턴 모두/ })
    fireEvent.click(ff)
    fireEvent.click(screen.getByRole('button', { name: /결과 보기/ }))
    expect(onComplete).toHaveBeenCalledTimes(1)
    // 직전 수(협력)로 남은 턴 진행 → 전 라운드 상호협력 → rounds*3
    expect(onComplete.mock.calls[0][0].score).toBe(ROUNDS * 3)
  })

  it('연출 도중 탭과 연타가 뒤섞여도 오버레이가 잔류하지 않는다 (스트레스)', () => {
    mount()
    for (let i = 0; i < ROUNDS; i++) {
      const coop = screen.queryByRole('button', { name: /^협력/ })
      if (coop) {
        fireEvent.click(coop)
        fireEvent.click(coop)
      }
      // 연출 중간(beat쯤)에 탭
      act(() => {
        vi.advanceTimersByTime(400)
      })
      const overlay = document.querySelector('.reveal-overlay')
      if (overlay) {
        fireEvent.click(overlay)
        fireEvent.click(overlay)
      }
      act(() => {
        vi.advanceTimersByTime(REVEAL_TOTAL_MS)
      })
      expect(overlayCount()).toBe(0)
    }
    expect(screen.getByRole('button', { name: /결과 보기/ })).toBeTruthy()
  })
})
