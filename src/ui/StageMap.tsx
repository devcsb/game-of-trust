import { STAGES } from '../game/stages'
import type { ProgressMap } from '../game/progress'
import { isUnlocked } from '../game/progress'
import { StarRow } from './StarRow'
import { useHotkeys } from './useHotkeys'
import type { HotkeyMap } from './useHotkeys'

export function StageMap({
  progress,
  onSelect,
  onEvolution,
  onBack,
}: {
  progress: ProgressMap
  onSelect: (id: string) => void
  /** 캠페인 클리어 후 진화의 정원 진입 (미클리어 시 undefined) */
  onEvolution?: () => void
  /** 타이틀로 복귀 (안개의 세계 등 다른 모드 선택용) */
  onBack: () => void
}) {
  // 키보드: 숫자키로 스테이지 선택 (잠긴 스테이지 무시), G 진화의 정원, Esc 타이틀
  const hotkeys: HotkeyMap = { escape: onBack }
  STAGES.forEach((s, i) => {
    if (isUnlocked(progress, STAGES, i)) hotkeys[String(i + 1)] = () => onSelect(s.id)
  })
  if (onEvolution) hotkeys['g'] = onEvolution
  useHotkeys(hotkeys)

  return (
    <div className="screen">
      <h2 className="screen-title">스테이지</h2>
      <div className="stage-list">
        {STAGES.map((s, i) => {
          const unlocked = isUnlocked(progress, STAGES, i)
          const p = progress[s.id]
          return (
            <button
              key={s.id}
              className={`card stage-card${unlocked ? '' : ' locked'}`}
              disabled={!unlocked}
              onClick={() => onSelect(s.id)}
            >
              <span className="glyph">{unlocked ? s.character.glyph : '🔒'}</span>
              <span className="stage-name">
                {i + 1}. {unlocked ? s.character.name : '???'}
              </span>
              <span className="stage-blurb">
                {unlocked ? s.character.blurb : '이전 상대를 클리어하면 열려요'}
              </span>
              <StarRow stars={p?.bestStars ?? 0} />
            </button>
          )
        })}
        {onEvolution && (
          <button className="card stage-card garden-card" onClick={onEvolution}>
            <span className="glyph">🌱</span>
            <span className="stage-name">
              진화의 정원 <kbd className="kbd-hint">G</kbd>
            </span>
            <span className="stage-blurb">내 전략을 일곱 번째 종으로 심고 생존을 지켜봐요</span>
            <span className="stars" aria-hidden>
              →
            </span>
          </button>
        )}
      </div>
      <div className="actions">
        <button className="btn ghost" onClick={onBack}>
          돌아가기 <kbd className="kbd-hint">Esc</kbd>
        </button>
      </div>
    </div>
  )
}
