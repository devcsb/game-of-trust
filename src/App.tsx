import { useState } from 'react'
import './App.css'
import { STAGES, stageById } from './game/stages'
import type { ProgressMap } from './game/progress'
import { loadProgress, saveProgress, recordStageResult } from './game/progress'
import type { PlayAnalysis } from './game/analysis'
import type { CustomStrategyDef } from './core/strategy/custom'
import { loadStrategies, saveStrategies } from './game/storage'
import { TitleScreen } from './ui/TitleScreen'
import { StageMap } from './ui/StageMap'
import { GamePlay } from './ui/GamePlay'
import { StageResult } from './ui/StageResult'
import { EvolutionView } from './ui/EvolutionView'
import { BuilderView } from './ui/BuilderView'
import { MuteToggle } from './ui/MuteToggle'
import { WorldMap } from './ui/WorldMap'
import { GauntletView } from './ui/GauntletView'
import { worldById } from './game/worlds'
import {
  loadWorldProgress,
  saveWorldProgress,
  recordWorldResult,
} from './game/worldProgress'

type Screen =
  | { name: 'title' }
  | { name: 'map' }
  | { name: 'play'; stageId: string }
  | {
      name: 'result'
      stageId: string
      stars: number
      score: number
      flips: number
      opponentScore: number
      welfare: number
      analysis: PlayAnalysis
    }
  | { name: 'evolution' }
  | { name: 'builder' }
  | { name: 'worlds' }
  | { name: 'gauntlet'; worldId: string }

function App() {
  const [screen, setScreen] = useState<Screen>({ name: 'title' })
  const [progress, setProgress] = useState<ProgressMap>(() => loadProgress())
  const [myStrategy, setMyStrategy] = useState<CustomStrategyDef | null>(
    () => loadStrategies()[0] ?? null,
  )
  const [worldFile, setWorldFile] = useState(() => loadWorldProgress())

  function renderScreen() {
    if (screen.name === 'title') {
      return (
        <TitleScreen
          onStart={() => setScreen({ name: 'map' })}
          onWorlds={() => setScreen({ name: 'worlds' })}
        />
      )
    }
    if (screen.name === 'worlds') {
      return (
        <WorldMap
          progress={worldFile.progress}
          onSelect={(id) => setScreen({ name: 'gauntlet', worldId: id })}
          onBack={() => setScreen({ name: 'title' })}
        />
      )
    }
    if (screen.name === 'gauntlet') {
      const world = worldById(screen.worldId)!
      return (
        <GauntletView
          key={world.id}
          world={world}
          initialStance={worldFile.lastStance ?? myStrategy}
          onQuit={() => setScreen({ name: 'worlds' })}
          onComplete={({ stars, efficiency, stance }) => {
            const next = recordWorldResult(worldFile, world.id, stars, efficiency, stance)
            setWorldFile(next)
            saveWorldProgress(next)
            setScreen({ name: 'worlds' })
          }}
        />
      )
    }
    if (screen.name === 'map') {
      const finalCleared = Boolean(progress[STAGES[STAGES.length - 1].id]?.cleared)
      return (
        <StageMap
          progress={progress}
          onSelect={(id) => setScreen({ name: 'play', stageId: id })}
          onEvolution={finalCleared ? () => setScreen({ name: 'evolution' }) : undefined}
          onBack={() => setScreen({ name: 'title' })}
        />
      )
    }
    if (screen.name === 'evolution') {
      return (
        <EvolutionView
          playerDef={myStrategy}
          onCreateStrategy={() => setScreen({ name: 'builder' })}
          onBack={() => setScreen({ name: 'map' })}
        />
      )
    }
    if (screen.name === 'builder') {
      return (
        <BuilderView
          initial={myStrategy}
          onSave={(def) => {
            setMyStrategy(def)
            saveStrategies([def])
            setScreen({ name: 'evolution' })
          }}
          onBack={() => setScreen({ name: 'evolution' })}
        />
      )
    }
    if (screen.name === 'play') {
      const stage = stageById(screen.stageId)!
      return (
        <GamePlay
          key={stage.id}
          stage={stage}
          onQuit={() => setScreen({ name: 'map' })}
          onComplete={({ stars, score, flips, opponentScore, welfare, analysis }) => {
            const next = recordStageResult(progress, stage.id, stars, score)
            setProgress(next)
            saveProgress(next)
            setScreen({
              name: 'result',
              stageId: stage.id,
              stars,
              score,
              flips,
              opponentScore,
              welfare,
              analysis,
            })
          }}
        />
      )
    }
    const stage = stageById(screen.stageId)!
    const idx = stage.index
    const hasNext = idx + 1 < STAGES.length
    const canAdvance = hasNext && screen.stars >= 1
    const isFinal = !hasNext && screen.stars >= 1
    return (
      <StageResult
        stage={stage}
        stars={screen.stars}
        score={screen.score}
        flips={screen.flips}
        opponentScore={screen.opponentScore}
        welfare={screen.welfare}
        analysis={screen.analysis}
        isFinal={isFinal}
        onRetry={() => setScreen({ name: 'play', stageId: stage.id })}
        onMap={() => setScreen({ name: 'map' })}
        onNext={canAdvance ? () => setScreen({ name: 'play', stageId: STAGES[idx + 1].id }) : undefined}
        onEvolution={isFinal ? () => setScreen({ name: 'evolution' }) : undefined}
      />
    )
  }

  return (
    <>
      <MuteToggle />
      <div className="view" key={screen.name}>
        {renderScreen()}
      </div>
    </>
  )
}

export default App
