import type { Mood } from '../game/mood'

export type AvatarKind = 'sucker' | 'villain' | 'mirror' | 'grudger' | 'generous'

const FACE: Record<AvatarKind, { fill: string; accent: string }> = {
  sucker: { fill: '#fde68a', accent: '#f59e0b' },
  villain: { fill: '#c084fc', accent: '#7c3aed' },
  mirror: { fill: '#93c5fd', accent: '#3b82f6' },
  grudger: { fill: '#fca5a5', accent: '#dc2626' },
  generous: { fill: '#a7f3d0', accent: '#10b981' },
}

const MOUTH: Record<Mood, string> = {
  happy: 'M35 62 Q50 76 65 62',
  neutral: 'M37 64 L63 64',
  wary: 'M37 66 Q50 60 63 66',
  angry: 'M37 70 Q50 60 63 70',
  smug: 'M38 62 Q56 70 64 60',
}

const BROWS: Record<Mood, { l: string; r: string }> = {
  happy: { l: 'M30 38 L44 36', r: 'M56 36 L70 38' },
  neutral: { l: 'M30 37 L44 37', r: 'M56 37 L70 37' },
  wary: { l: 'M30 35 L44 39', r: 'M56 39 L70 35' },
  angry: { l: 'M30 34 L44 41', r: 'M56 41 L70 34' },
  smug: { l: 'M30 38 L44 35', r: 'M56 38 L70 36' },
}

function KindMark({ kind, accent }: { kind: AvatarKind; accent: string }) {
  switch (kind) {
    case 'villain':
      return (
        <path
          d="M22 18 L30 32 M78 18 L70 32"
          stroke={accent}
          strokeWidth="4"
          strokeLinecap="round"
        />
      )
    case 'grudger':
      return (
        <path
          d="M50 4 L50 22 M44 10 L56 10"
          stroke={accent}
          strokeWidth="4"
          strokeLinecap="round"
        />
      )
    case 'mirror':
      return (
        <path
          d="M14 50 L24 50 M76 50 L86 50"
          stroke={accent}
          strokeWidth="4"
          strokeLinecap="round"
        />
      )
    case 'generous':
      return <circle cx="50" cy="14" r="6" fill="none" stroke={accent} strokeWidth="3" />
    case 'sucker':
      return <path d="M50 6 Q44 14 50 20 Q56 14 50 6" fill={accent} />
  }
}

export function Avatar({
  kind,
  mood,
  size = 96,
}: {
  kind: AvatarKind
  mood: Mood
  size?: number
}) {
  const c = FACE[kind]
  const eyeY = mood === 'happy' ? 47 : 46
  return (
    <svg
      className={`avatar avatar-${mood}`}
      width={size}
      height={size}
      viewBox="0 0 100 100"
      role="img"
      aria-label={`상대 표정 ${mood}`}
    >
      <circle cx="50" cy="50" r="40" fill={c.fill} stroke={c.accent} strokeWidth="3" />
      <KindMark kind={kind} accent={c.accent} />
      {mood === 'happy' ? (
        <>
          <path
            d="M34 47 Q40 42 46 47"
            fill="none"
            stroke="#1f2937"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <path
            d="M54 47 Q60 42 66 47"
            fill="none"
            stroke="#1f2937"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </>
      ) : (
        <>
          <circle cx="40" cy={eyeY} r="4" fill="#1f2937" />
          <circle cx="60" cy={eyeY} r="4" fill="#1f2937" />
        </>
      )}
      <path d={BROWS[mood].l} stroke="#1f2937" strokeWidth="3" strokeLinecap="round" />
      <path d={BROWS[mood].r} stroke="#1f2937" strokeWidth="3" strokeLinecap="round" />
      <path d={MOUTH[mood]} fill="none" stroke="#1f2937" strokeWidth="3" strokeLinecap="round" />
    </svg>
  )
}
