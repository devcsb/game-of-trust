import { WORLDS } from '../game/worlds'
import type { WorldProgressMap } from '../game/worldProgress'
import { isWorldUnlocked } from '../game/worldProgress'
import { StarRow } from './StarRow'
import { useHotkeys } from './useHotkeys'
import type { HotkeyMap } from './useHotkeys'

/**
 * 안개의 세계 지도. 캠페인의 StageMap과 달리 상대 정체를 라벨로 노출하지 않는다 —
 * 분위기 한 줄(blurb)과 안개만 보여준다. 정체는 들어가서 읽어내야 한다.
 */
export function WorldMap({
  progress,
  onSelect,
  onBack,
}: {
  progress: WorldProgressMap
  onSelect: (id: string) => void
  onBack: () => void
}) {
  const hotkeys: HotkeyMap = { escape: onBack }
  WORLDS.forEach((w, i) => {
    if (isWorldUnlocked(progress, WORLDS, i)) hotkeys[String(i + 1)] = () => onSelect(w.id)
  })
  useHotkeys(hotkeys)

  return (
    <div className="screen">
      <h2 className="screen-title">🌫️ 안개의 세계</h2>
      <p className="hint">
        상대의 정체는 안개에 가려 있어요. 단서만 읽고 나의 기본 전략 하나를 정해, 불확실한
        세계에서 최대한 많이 거두세요.
      </p>
      <div className="stage-list">
        {WORLDS.map((w, i) => {
          const unlocked = isWorldUnlocked(progress, WORLDS, i)
          const p = progress[w.id]
          return (
            <button
              key={w.id}
              className={`card stage-card${unlocked ? '' : ' locked'}`}
              disabled={!unlocked}
              onClick={() => onSelect(w.id)}
            >
              <span className="glyph">{unlocked ? w.glyph : '🔒'}</span>
              <span className="stage-name">
                {i + 1}. {unlocked ? w.name : '???'}
              </span>
              <span className="stage-blurb">
                {unlocked ? w.blurb : '이전 세계를 클리어하면 열려요'}
              </span>
              <StarRow stars={p?.bestStars ?? 0} />
            </button>
          )
        })}
      </div>
      <div className="actions">
        <button className="btn ghost" onClick={onBack}>
          돌아가기 <kbd className="kbd-hint">Esc</kbd>
        </button>
      </div>
    </div>
  )
}
