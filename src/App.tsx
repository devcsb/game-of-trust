import { useState } from 'react'
import './App.css'
import { STAGES, stageById } from './game/stages'
import type { ProgressMap } from './game/progress'
import { loadProgress, saveProgress, recordStageResult } from './game/progress'
import { TitleScreen } from './ui/TitleScreen'
import { StageMap } from './ui/StageMap'
import { GamePlay } from './ui/GamePlay'
import { StageResult } from './ui/StageResult'

type Screen =
  | { name: 'title' }
  | { name: 'map' }
  | { name: 'play'; stageId: string }
  | { name: 'result'; stageId: string; stars: number; score: number; flips: number }

function App() {
  const [screen, setScreen] = useState<Screen>({ name: 'title' })
  const [progress, setProgress] = useState<ProgressMap>(() => loadProgress())

  if (screen.name === 'title') {
    return <TitleScreen onStart={() => setScreen({ name: 'map' })} />
  }

  if (screen.name === 'map') {
    return <StageMap progress={progress} onSelect={(id) => setScreen({ name: 'play', stageId: id })} />
  }

  if (screen.name === 'play') {
    const stage = stageById(screen.stageId)!
    return (
      <GamePlay
        key={stage.id}
        stage={stage}
        onQuit={() => setScreen({ name: 'map' })}
        onComplete={({ stars, score, flips }) => {
          const next = recordStageResult(progress, stage.id, stars, score)
          setProgress(next)
          saveProgress(next)
          setScreen({ name: 'result', stageId: stage.id, stars, score, flips })
        }}
      />
    )
  }

  // result
  const stage = stageById(screen.stageId)!
  const idx = stage.index
  const hasNext = idx + 1 < STAGES.length
  const canAdvance = hasNext && screen.stars >= 1
  return (
    <StageResult
      stage={stage}
      stars={screen.stars}
      score={screen.score}
      flips={screen.flips}
      isFinal={!hasNext && screen.stars >= 1}
      onRetry={() => setScreen({ name: 'play', stageId: stage.id })}
      onMap={() => setScreen({ name: 'map' })}
      onNext={canAdvance ? () => setScreen({ name: 'play', stageId: STAGES[idx + 1].id }) : undefined}
    />
  )
}

export default App
