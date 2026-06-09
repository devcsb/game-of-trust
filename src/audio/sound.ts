type SoundName = 'click' | 'coop' | 'defect' | 'combo' | 'star' | 'win' | 'lose'

let ctx: AudioContext | null = null
let muted = readMuted()

const MUTE_KEY = 'ipd-sim:muted'

function readMuted(): boolean {
  try {
    return localStorage.getItem(MUTE_KEY) === '1'
  } catch {
    return false
  }
}

export function isMuted(): boolean {
  return muted
}

export function setMuted(v: boolean): void {
  muted = v
  try {
    localStorage.setItem(MUTE_KEY, v ? '1' : '0')
  } catch {
    // ignore
  }
}

export function toggleMuted(): boolean {
  setMuted(!muted)
  return muted
}

function ac(): AudioContext | null {
  if (typeof window === 'undefined') return null
  if (!ctx) {
    const Ctor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!Ctor) return null
    ctx = new Ctor()
  }
  return ctx
}

/** 첫 사용자 제스처에서 호출해 suspended 상태를 깨운다. */
export function resumeAudio(): void {
  void ac()?.resume()
}

function tone(
  freq: number,
  dur: number,
  type: OscillatorType,
  peak = 0.18,
  when = 0,
): void {
  const c = ac()
  if (!c) return
  const t0 = c.currentTime + when
  const osc = c.createOscillator()
  const g = c.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq, t0)
  g.gain.setValueAtTime(0.0001, t0)
  g.gain.exponentialRampToValueAtTime(peak, t0 + 0.01)
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur)
  osc.connect(g).connect(c.destination)
  osc.start(t0)
  osc.stop(t0 + dur + 0.02)
}

const RECIPES: Record<SoundName, () => void> = {
  click: () => tone(440, 0.05, 'square', 0.1),
  coop: () => {
    tone(523, 0.12, 'sine')
    tone(784, 0.16, 'sine', 0.14, 0.06)
  },
  defect: () => {
    tone(180, 0.18, 'sawtooth', 0.16)
    tone(120, 0.22, 'sawtooth', 0.12, 0.02)
  },
  combo: () => {
    ;[523, 659, 784, 1047].forEach((f, i) => tone(f, 0.1, 'triangle', 0.14, i * 0.05))
  },
  star: () => {
    tone(880, 0.08, 'triangle', 0.16)
    tone(1320, 0.12, 'triangle', 0.14, 0.07)
  },
  win: () => {
    ;[523, 659, 784, 1047].forEach((f, i) => tone(f, 0.18, 'sine', 0.18, i * 0.12))
  },
  lose: () => {
    ;[392, 330, 262].forEach((f, i) => tone(f, 0.22, 'sine', 0.16, i * 0.14))
  },
}

export function play(name: SoundName): void {
  if (muted) return
  const c = ac()
  if (!c) return
  if (c.state === 'suspended') void c.resume()
  RECIPES[name]()
}
