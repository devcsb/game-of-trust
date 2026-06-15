import { useEffect } from 'react'
import type { Stage } from '../game/stages'
import { StarRow } from './StarRow'
import { welfareOutcome, WELFARE_LABEL } from '../game/outcome'
import type { PlayAnalysis } from '../game/analysis'
import { STYLE_LABEL, STYLE_BLURB } from '../game/analysis'
import { play as soundPlay } from '../audio/sound'
import { useHotkeys } from './useHotkeys'

export function StageResult({
  stage,
  stars,
  score,
  flips,
  welfare,
  analysis,
  isFinal,
  onRetry,
  onMap,
  onNext,
  onEvolution,
}: {
  stage: Stage
  stars: number
  score: number
  flips: number
  opponentScore: number // App 호환용 (상대 비교는 쓰지 않음)
  welfare: number
  analysis: PlayAnalysis
  isFinal?: boolean
  onRetry: () => void
  onMap: () => void
  onNext?: () => void
  onEvolution?: () => void
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

  // 키보드: Enter 다음(또는 진화/지도), R 다시, M 지도
  useHotkeys({
    enter: onNext ?? onEvolution ?? onMap,
    r: onRetry,
    m: onMap,
  })

  return (
    <div className="screen center">
      <div className={`card result-card${triumphant ? ' victory' : ''}`}>
        <h2>{title}</h2>

        {wo !== null ? (
          <div className={`outcome-badge welfare-${wo}`}>
            {WELFARE_LABEL[wo]} · 공동 수확 {welfare} / {stage.welfareGoal}
          </div>
        ) : (
          <div className="outcome-badge welfare-defense">
            방어 점수 {score} (이 상대와는 함께 거둘 게 없어요)
          </div>
        )}

        <div className="result-stars">
          <StarRow stars={stars} animate />
        </div>

        {analysis.rounds > 0 && (
          <div className="analysis">
            <span className="analysis-style">
              내 플레이: {STYLE_LABEL[analysis.style]} · 협력 {Math.round(analysis.coopRate * 100)}%
            </span>
            <span className="analysis-blurb">{STYLE_BLURB[analysis.style]}</span>
            {analysis.readAccuracy !== null && (
              <span className="analysis-read">
                🔮 읽기 정확도 {Math.round(analysis.readAccuracy * 100)}%
                {analysis.bestStreak >= 2 && <> · 최고 연속 간파 {analysis.bestStreak}</>}
                {analysis.readAccuracy >= 0.8 && analysis.rounds >= 5 && (
                  <span className="mindreader-badge"> 독심술사!</span>
                )}
              </span>
            )}
          </div>
        )}

        {stage.executionNoise > 0 && <p className="result-flips">통신 오류 {flips}회</p>}
        <p className="lesson">{stage.lesson}</p>

        {isFinal && (
          <p className="ending">
            일곱 상대를 모두 만났어요. 호구·악당·거울·복수귀·관대한 거울, 그리고 변덕쟁이와
            무작위인 동전까지. 협력이 통하는 상대에겐 함께 수확을 키우는 게 언제나 최선이었고,
            통하지 않는 상대에겐 방어가 답이었죠. 그래도 협력이 통할 때 세상 전체의 수확이 가장
            커진다 — 이게 너그러운 맞대응의 힘이에요.
          </p>
        )}

        <div className="actions">
          <button className="btn ghost" onClick={onRetry}>
            다시 <kbd className="kbd-hint">R</kbd>
          </button>
          <button className="btn ghost" onClick={onMap}>
            지도 <kbd className="kbd-hint">M</kbd>
          </button>
          {onNext && (
            <button className="btn primary" onClick={onNext}>
              다음 <kbd className="kbd-hint">Enter</kbd>
            </button>
          )}
          {onEvolution && (
            <button className="btn primary" onClick={onEvolution}>
              진화의 정원 <kbd className="kbd-hint">Enter</kbd>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
