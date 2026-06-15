// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, act, cleanup } from '@testing-library/react'
import { GamePlay } from '../../src/ui/GamePlay'
import { STAGES } from '../../src/game/stages'

/**
 * s1(호구) 플로우 통합 테스트. 공개 연출 타이머 체인의 경합(검은 오버레이 잔류,
 * 라운드 중복 진행)을 회귀로 잠근다. 사운드는 AudioContext 부재로 자동 무음 no-op.
 */

const REVEAL_TOTAL_MS = 320 + 380 + 480 + 700 + 50 // slide+beat+flip+stamp 여유

function overlayCount(): number {
  return document.querySelectorAll('.reveal-overlay').length
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

  function commitButtons() {
    return {
      coop: screen.getByRole('button', { name: /협력/ }),
    }
  }

  it('연출이 끝나면 오버레이가 사라지고 다음 라운드 입력이 가능하다', () => {
    mount()
    expect(overlayCount()).toBe(0)
    fireEvent.click(commitButtons().coop)
    expect(overlayCount()).toBe(1)
    act(() => {
      vi.advanceTimersByTime(REVEAL_TOTAL_MS)
    })
    expect(overlayCount()).toBe(0)
    expect(screen.getByText(/라운드 2 \/ 10/)).toBeTruthy()
  })

  it('연타해도 라운드가 한 번만 진행된다 (체인 중복 방지)', () => {
    mount()
    const { coop } = commitButtons()
    fireEvent.click(coop)
    fireEvent.click(coop) // 같은 틱 연타 — 두 번째는 무시되어야 한다
    fireEvent.click(coop)
    act(() => {
      vi.advanceTimersByTime(REVEAL_TOTAL_MS)
    })
    expect(overlayCount()).toBe(0)
    expect(screen.getByText(/라운드 2 \/ 10/)).toBeTruthy()
  })

  it('오버레이 탭으로 즉시 정산되고 더블탭에도 안전하다', () => {
    mount()
    fireEvent.click(commitButtons().coop)
    const overlay = document.querySelector('.reveal-overlay')!
    fireEvent.click(overlay)
    fireEvent.click(overlay) // 더블탭
    expect(overlayCount()).toBe(0)
    expect(screen.getByText(/라운드 2 \/ 10/)).toBeTruthy()
    // 고아 타이머가 나중에 오버레이를 되살리지 않는다
    act(() => {
      vi.advanceTimersByTime(REVEAL_TOTAL_MS * 2)
    })
    expect(overlayCount()).toBe(0)
  })

  it('스킵과 자연 정산을 섞어 10라운드를 끝까지 진행할 수 있다', () => {
    const { onComplete } = mount()
    for (let i = 0; i < 10; i++) {
      fireEvent.click(screen.getByRole('button', { name: /협력/ }))
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
    // 호구는 늘 협력 → 전 라운드 상호협력 → 30점
    expect(onComplete.mock.calls[0][0].score).toBe(30)
  })

  it('연출 도중 탭과 연타가 뒤섞여도 오버레이가 잔류하지 않는다 (스트레스)', () => {
    mount()
    for (let i = 0; i < 10; i++) {
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
