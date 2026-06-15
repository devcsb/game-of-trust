type SoundName =
  | 'click'
  | 'coop'
  | 'defect'
  | 'combo'
  | 'star'
  | 'win'
  | 'lose'
  | 'drumroll'
  | 'flip'
  | 'glitch'
  | 'read'
  | 'streak'
  | 'fuse'
  | 'forgive'

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

/** 화이트노이즈 버스트 (통신 글리치). 유일한 비-오실레이터 레시피. */
function noiseBurst(dur: number, peak = 0.14, when = 0, centerHz = 1800): void {
  const c = ac()
  if (!c) return
  const t0 = c.currentTime + when
  const len = Math.max(1, Math.floor(c.sampleRate * dur))
  const buf = c.createBuffer(1, len, c.sampleRate)
  const data = buf.getChannelData(0)
  for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1
  const src = c.createBufferSource()
  src.buffer = buf
  const bp = c.createBiquadFilter()
  bp.type = 'bandpass'
  bp.frequency.value = centerHz
  bp.Q.value = 0.7
  const g = c.createGain()
  g.gain.setValueAtTime(peak, t0)
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur)
  src.connect(bp).connect(g).connect(c.destination)
  src.start(t0)
  src.stop(t0 + dur + 0.02)
}

/** 콤보 단계만큼 반음을 올린다 (사운드 에스컬레이션). */
const semi = (steps: number) => Math.pow(2, Math.min(Math.max(steps, 0), 8) / 12)

const RECIPES: Record<SoundName, (intensity: number) => void> = {
  click: () => tone(440, 0.05, 'square', 0.1),
  coop: (i) => {
    tone(523 * semi(i), 0.12, 'sine')
    tone(784 * semi(i), 0.16, 'sine', 0.14, 0.06)
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
  drumroll: () => {
    ;[0, 1, 2, 3].forEach((i) => tone(196, 0.035, 'square', 0.07, i * 0.085))
  },
  flip: () => tone(660, 0.06, 'triangle', 0.12),
  glitch: () => noiseBurst(0.16),
  read: () => {
    tone(988, 0.07, 'triangle', 0.14)
    tone(1319, 0.09, 'triangle', 0.12, 0.05)
  },
  streak: () => {
    ;[659, 880, 1175, 1568].forEach((f, i) => tone(f, 0.09, 'triangle', 0.14, i * 0.06))
  },
  fuse: () => {
    tone(82, 0.5, 'sawtooth', 0.16)
    tone(55, 0.6, 'sawtooth', 0.12, 0.08)
  },
  forgive: () => {
    tone(880, 0.18, 'sine', 0.1)
    tone(1760, 0.24, 'sine', 0.06, 0.08)
  },
}

export function play(name: SoundName, intensity = 0): void {
  if (muted) return
  const c = ac()
  if (!c) return
  if (c.state === 'suspended') void c.resume()
  RECIPES[name](intensity)
}
