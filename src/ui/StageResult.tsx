import { useEffect } from 'react'
import type { Stage } from '../game/stages'
import { StarRow } from './StarRow'
import { welfareOutcome, WELFARE_LABEL } from '../game/outcome'
import { play as soundPlay } from '../audio/sound'

export function StageResult({
  stage,
  stars,
  score,
  flips,
  welfare,
  isFinal,
  onRetry,
  onMap,
  onNext,
}: {
  stage: Stage
  stars: number
  score: number
  flips: number
  opponentScore: number // App 호환용 (현재 화면에서는 상대 비교를 쓰지 않음)
  welfare: number
  isFinal?: boolean
  onRetry: () => void
  onMap: () => void
  onNext?: () => void
}) {
  const cleared = stars >= 1
  const wo = welfareOutcome(welfare, stage.welfareGoal)
  const triumphant = cleared && (wo === null ? true : wo === 'achieved')
  const title = isFinal
    ? '🎉 모든 상대 클리어!'
    : cleared
      ? `${stage.character.name} 클리어`
      : '아쉬워요'

  useEffect(() => {
    soundPlay(cleared ? 'win' : 'lose')
    if (stars > 0) {
      const t = setTimeout(() => soundPlay('star'), 280)
      return () => clearTimeout(t)
    }
  }, [cleared, stars])

  return (
    <div className="screen center">
      <div className={`card result-card${triumphant ? ' victory' : ''}`}>
        <h2>{title}</h2>

        {wo !== null ? (
          <div className={`outcome-badge welfare-${wo}`}>
            {WELFARE_LABEL[wo]} · 함께 키운 파이 {welfare} / {stage.welfareGoal}
          </div>
        ) : (
          <div className="outcome-badge welfare-defense">
            방어 점수 {score} (이 상대와는 파이를 못 키워요)
          </div>
        )}

        <div className="result-stars">
          <StarRow stars={stars} animate />
        </div>

        {stage.executionNoise > 0 && <p className="result-flips">통신 오류 {flips}회</p>}
        <p className="lesson">{stage.lesson}</p>

        {isFinal && (
          <p className="ending">
            다섯 상대를 모두 만났어요. 호구는 이용당하고 악당과는 파이를 못 키웠죠. 거울에겐
            협력이 남는 장사였고요. 통신 오류가 끼자 용서 없는 복수귀와는 파이가 무너졌지만,
            관대한 상대는 실수를 용서하며 함께 파이를 되살렸어요. 협력이 세상 전체의 파이를
            가장 크게 키운다 — 이게 너그러운 맞대응의 힘이에요.
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
