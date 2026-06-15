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
        <p>
          협력할까, 배신할까? 상대를 차례로 만나며 신뢰가 어떻게 쌓이고 무너지는지 직접
          느껴보세요.
        </p>
        <div className="actions">
          <button className="btn primary" onClick={onStart}>
            캠페인 시작 <kbd className="kbd-hint">Enter</kbd>
          </button>
          {onWorlds && (
            <button className="btn primary" onClick={onWorlds}>
              🌫️ 안개의 세계
            </button>
          )}
          <button className="btn ghost" onClick={() => setShowRules(true)}>
            규칙 보기
          </button>
        </div>
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
