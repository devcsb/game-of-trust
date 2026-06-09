import { STAGES } from '../game/stages'
import type { ProgressMap } from '../game/progress'
import { isUnlocked } from '../game/progress'
import { StarRow } from './StarRow'

export function StageMap({
  progress,
  onSelect,
}: {
  progress: ProgressMap
  onSelect: (id: string) => void
}) {
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
      </div>
    </div>
  )
}
