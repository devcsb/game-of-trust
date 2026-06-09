import { useState } from 'react'
import './App.css'
import type { AppConfig } from './state/store'
import { DEFAULT_CONFIG } from './state/store'
import { getScenario } from './state/scenarios'
import { Controls } from './ui/controls/Controls'
import { ChallengePanel } from './ui/ChallengePanel'
import { HeadToHead } from './ui/modes/HeadToHead'
import { Heatmap } from './ui/modes/Heatmap'

type Tab = 'h2h' | 'heatmap'

function App() {
  const [config, setConfig] = useState<AppConfig>(DEFAULT_CONFIG)
  const [tab, setTab] = useState<Tab>('h2h')
  const scenario = getScenario(config.scenarioId)

  return (
    <div className="app">
      <aside className="panel">
        <h1 className="title">IPD 협력 시뮬레이터</h1>
        <p className="subtitle">반복 죄수의 딜레마에서 관용이 언제 이기는가</p>
        <Controls config={config} onChange={setConfig} />
        <ChallengePanel config={config} />
      </aside>
      <main className="stage">
        <div className="scenario-banner">
          <strong>{scenario.name}</strong> · {scenario.blurb}
        </div>
        <nav className="tabs">
          <button
            className={tab === 'h2h' ? 'tab active' : 'tab'}
            onClick={() => setTab('h2h')}
          >
            1:1 대결
          </button>
          <button
            className={tab === 'heatmap' ? 'tab active' : 'tab'}
            onClick={() => setTab('heatmap')}
          >
            히트맵
          </button>
        </nav>
        {tab === 'h2h' ? (
          <HeadToHead config={config} />
        ) : (
          <Heatmap config={config} />
        )}
      </main>
    </div>
  )
}

export default App
