import { useEffect } from 'react'
import type { Stage } from '../game/stages'
import { StarRow } from './StarRow'
import { matchOutcome, OUTCOME_LABEL } from '../game/outcome'
import { play as soundPlay } from '../audio/sound'

export function StageResult({
  stage,
  stars,
  score,
  flips,
  opponentScore,
  isFinal,
  onRetry,
  onMap,
  onNext,
}: {
  stage: Stage
  stars: number
  score: number
  flips: number
  opponentScore: number
  isFinal?: boolean
  onRetry: () => void
  onMap: () => void
  onNext?: () => void
}) {
  const cleared = stars >= 1
  const outcome = matchOutcome(score, opponentScore)
  const title = isFinal
    ? '🎉 모든 상대 클리어!'
    : cleared
      ? `${stage.character.name} 클리어`
      : '아쉬워요'

  useEffect(() => {
    soundPlay(outcome === 'lose' ? 'lose' : 'win')
    if (stars > 0) {
      const t = setTimeout(() => soundPlay('star'), 280)
      return () => clearTimeout(t)
    }
  }, [outcome, stars])

  return (
    <div className="screen center">
      <div className={`card result-card${outcome !== 'lose' ? ' victory' : ''}`}>
        <h2>{title}</h2>
        <div className={`outcome-badge outcome-${outcome}`}>{OUTCOME_LABEL[outcome]}</div>
        <div className="result-stars">
          <StarRow stars={stars} animate />
        </div>
        <p className="result-score">
          나 {score} : {opponentScore} {stage.character.name}
        </p>
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
