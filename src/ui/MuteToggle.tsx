import { useState } from 'react'
import { isMuted, toggleMuted, play, resumeAudio } from '../audio/sound'

export function MuteToggle() {
  const [muted, setMuted] = useState(isMuted())
  return (
    <button
      className="mute-toggle"
      aria-pressed={muted}
      aria-label={muted ? '소리 켜기' : '소리 끄기'}
      onClick={() => {
        resumeAudio()
        const m = toggleMuted()
        setMuted(m)
        if (!m) play('click')
      }}
    >
      {muted ? '🔇' : '🔊'}
    </button>
  )
}
