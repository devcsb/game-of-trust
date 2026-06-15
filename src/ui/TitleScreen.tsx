import { useState } from 'react'
import { RulesModal } from './RulesModal'
import { useHotkeys } from './useHotkeys'

const SEEN_KEY = 'ipd-sim:seen-rules'

function seenRules(): boolean {
  try {
    return localStorage.getItem(SEEN_KEY) === '1'
  } catch {
    return false
  }
}

export function TitleScreen({
  onStart,
  onWorlds,
}: {
  onStart: () => void
  onWorlds?: () => void
}) {
  const [showRules, setShowRules] = useState(() => !seenRules())

  const closeRules = () => {
    setShowRules(false)
    try {
      localStorage.setItem(SEEN_KEY, '1')
    } catch {
      // ignore
    }
  }

  // 모달이 떠 있으면 모달(RulesModal)이 자체 단축키를 갖는다
  useHotkeys(showRules ? {} : { enter: onStart })

  return (
    <div className="screen center">
      <div className="card title-card">
        <h1>신뢰의 게임</h1>
        <p className="title-tagline">
          협력할까, 배신할까. 한 번의 선택이 신뢰를 쌓고, 또 무너뜨린다.
        </p>
        <p className="title-intro">
          누굴 믿을지, 겪어봐야 안다. 일곱 상대를 차례로 만나 협력과 배신 사이에서 서로를
          시험하고, 안개 속 정체 모를 상대의 다음 수를 읽어 최대 수확에 도전하세요.
        </p>
        <div className="actions stack">
          <button className="btn primary block" onClick={onStart}>
            캠페인 시작 <kbd className="kbd-hint">Enter</kbd>
          </button>
          {onWorlds && (
            <button className="btn secondary block" onClick={onWorlds}>
              🌫️ 안개의 세계
            </button>
          )}
        </div>
        <button className="btn ghost small title-rules" onClick={() => setShowRules(true)}>
          규칙 보기
        </button>
        {onWorlds && (
          <p className="title-mode-hint">
            🌫️ 안개의 세계: 상대 정체가 숨겨진 곳에서, 나의 기본 전략 하나로 최대 수확에
            도전해요.
          </p>
        )}
      </div>
      {showRules && <RulesModal onClose={closeRules} />}
    </div>
  )
}
