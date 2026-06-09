import { useEffect, useState } from 'react'
import './App.css'
import type { AppConfig } from './state/store'
import { getScenario } from './state/scenarios'
import { loadConfigFromUrl, syncConfigToUrl } from './state/url'
import { Controls } from './ui/controls/Controls'
import { ChallengePanel } from './ui/ChallengePanel'
import { HeadToHead } from './ui/modes/HeadToHead'
import { Heatmap } from './ui/modes/Heatmap'

type Tab = 'h2h' | 'heatmap'

function App() {
  const [config, setConfig] = useState<AppConfig>(() => loadConfigFromUrl())
  const [tab, setTab] = useState<Tab>('h2h')
  const [copied, setCopied] = useState(false)
  const scenario = getScenario(config.scenarioId)

  useEffect(() => {
    syncConfigToUrl(config)
  }, [config])

  const share = async () => {
    syncConfigToUrl(config)
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // 클립보드 불가 환경 무시
    }
  }

  return (
    <div className="app">
      <aside className="panel">
        <h1 className="title">IPD 협력 시뮬레이터</h1>
        <p className="subtitle">반복 죄수의 딜레마에서 관용이 언제 이기는가</p>
        <Controls config={config} onChange={setConfig} />
        <ChallengePanel config={config} />
      </aside>
      <main className="stage">
        <div className="topbar">
          <div className="scenario-banner">
            <strong>{scenario.name}</strong> · {scenario.blurb}
          </div>
          <button className="share" onClick={share} aria-label="현재 설정을 URL로 복사">
            {copied ? '복사됨' : '공유 링크'}
          </button>
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
