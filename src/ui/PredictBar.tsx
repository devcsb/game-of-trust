import type { Move } from '../core/types'

/**
 * 예측 단계 입력. "상대의 다음 수는?"에 답해야 커밋으로 넘어간다.
 * predict-then-verify: 공개 전에 예측을 강제해 상대 전략 모델링을 학습시킨다.
 */
export function PredictBar({
  streak,
  onPredict,
}: {
  streak: number
  onPredict: (m: Move) => void
}) {
  return (
    <div className="predict-bar">
      <span className="predict-q">🔮 상대의 다음 수는?</span>
      <div className="predict-btns">
        <button className="btn predict-c" onClick={() => onPredict('C')}>
          협력할 듯 <kbd className="kbd-hint">1</kbd>
        </button>
        <button className="btn predict-d" onClick={() => onPredict('D')}>
          배신할 듯 <kbd className="kbd-hint">2</kbd>
        </button>
      </div>
      {streak >= 2 && <span className="predict-streak">👁 {streak}연속 간파 중</span>}
    </div>
  )
}
