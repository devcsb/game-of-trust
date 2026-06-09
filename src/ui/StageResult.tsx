import type { Stage } from '../game/stages'
import { StarRow } from './StarRow'

export function StageResult({
  stage,
  stars,
  score,
  flips,
  isFinal,
  onRetry,
  onMap,
  onNext,
}: {
  stage: Stage
  stars: number
  score: number
  flips: number
  isFinal?: boolean
  onRetry: () => void
  onMap: () => void
  onNext?: () => void
}) {
  const cleared = stars >= 1
  const title = isFinal
    ? '🎉 모든 상대 클리어!'
    : cleared
      ? `${stage.character.name} 클리어`
      : '아쉬워요'

  return (
    <div className="screen center">
      <div className="card result-card">
        <h2>{title}</h2>
        <StarRow stars={stars} />
        <p className="result-score">점수 {score}</p>
        {stage.executionNoise > 0 && <p className="result-flips">통신 오류 {flips}회</p>}
        <p className="lesson">{stage.lesson}</p>
        {isFinal && (
          <p className="ending">
            다섯 상대를 모두 만났어요. 호구는 이용당하고 악당에겐 방어가 필요했죠. 거울에겐
            협력이 남는 장사였고요. 그런데 통신 오류가 끼자 용서 없는 복수귀와는 관계가
            무너졌지만, 관대한 상대는 실수를 용서하며 신뢰를 되살렸어요. 이게 너그러운
            맞대응이 시끄러운 세상에서 강한 이유예요.
          </p>
        )}
        <div className="actions">
          <button className="btn ghost" onClick={onRetry}>
            다시
          </button>
          <button className="btn ghost" onClick={onMap}>
            지도
          </button>
          {onNext && (
            <button className="btn primary" onClick={onNext}>
              다음
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
