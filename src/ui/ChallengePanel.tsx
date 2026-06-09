import { useEffect, useState } from 'react'
import type { AppConfig } from '../state/store'
import { CHALLENGES } from '../sim/challenges'
import { loadCompleted, saveCompleted } from '../state/progress'

export function ChallengePanel({ config }: { config: AppConfig }) {
  const [completed, setCompleted] = useState<Set<string>>(() => loadCompleted())

  useEffect(() => {
    let changed = false
    const next = new Set(completed)
    for (const ch of CHALLENGES) {
      if (!next.has(ch.id) && ch.check(config)) {
        next.add(ch.id)
        changed = true
      }
    }
    if (changed) {
      setCompleted(next)
      saveCompleted(next)
    }
  }, [config, completed])

  return (
    <div className="challenges">
      <h3 className="panel-h">
        가이드 챌린지 {completed.size}/{CHALLENGES.length}
      </h3>
      <ul className="challenge-list">
        {CHALLENGES.map((ch) => {
          const done = completed.has(ch.id)
          const active = !done && ch.check(config)
          return (
            <li key={ch.id} className={done ? 'done' : active ? 'active' : ''}>
              <span className="mark">{done ? '✓' : '○'}</span>
              <span>{ch.title}</span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
