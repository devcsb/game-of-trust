import { useEffect, useRef } from 'react'

/** key는 KeyboardEvent.key 소문자 기준: '1', 'c', 'enter', ' ', 'escape', 'arrowleft' … */
export type HotkeyMap = Record<string, () => void>

/** 화면 마운트 직후 이 시간 동안은 키를 무시한다 (이전 화면에서 누른 키의 이월 방지). */
const ARM_DELAY_MS = 250

/**
 * 물리 키 위치(e.code) 기준으로 단축키 이름을 만든다.
 * e.key는 한글 IME에선 'ㄱ', 'ㅡ' 같은 문자가 와서 영문 단축키가 안 먹는다.
 * KeyR → 'r', Digit1/Numpad1 → '1', Space → ' ', Enter → 'enter', ArrowLeft → 'arrowleft'
 */
function keyOf(e: KeyboardEvent): string {
  const code = e.code
  if (code.startsWith('Key')) return code.slice(3).toLowerCase()
  if (code.startsWith('Digit')) return code.slice(5)
  if (/^Numpad\d$/.test(code)) return code.slice(6)
  if (code === 'Space') return ' '
  if (code === 'Enter' || code === 'NumpadEnter') return 'enter'
  if (code === 'Escape') return 'escape'
  if (code.startsWith('Arrow')) return code.toLowerCase()
  return e.key.toLowerCase()
}

/**
 * 화면 단위 키보드 단축키.
 * - 물리 키 기준이라 한글 IME 상태에서도 동작한다
 * - 입력 필드(input/textarea/contentEditable)에 포커스가 있으면 무시
 * - 보조키(meta/ctrl/alt) 조합과 키 꾹 누름 반복(e.repeat)은 무시
 * - 버튼에 포커스가 있을 때의 Enter/Space는 네이티브 클릭에 맡긴다 (이중 실행 방지)
 * - 마운트 직후 잠깐은 무시한다 (화면 전환 순간 키 이월로 인한 오발동 방지)
 */
export function useHotkeys(map: HotkeyMap): void {
  const ref = useRef(map)
  const armedAt = useRef(0)

  useEffect(() => {
    ref.current = map
  })

  useEffect(() => {
    armedAt.current = performance.now() + ARM_DELAY_MS
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey || e.repeat) return
      if (performance.now() < armedAt.current) return
      const t = e.target as HTMLElement | null
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return
      const key = keyOf(e)
      if (t?.tagName === 'BUTTON' && (key === 'enter' || key === ' ')) return
      const handler = ref.current[key]
      if (!handler) return
      e.preventDefault()
      handler()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])
}
