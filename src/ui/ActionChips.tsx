/**
 * 통찰을 소비하는 행동 칩.
 * 엿보기: 예측 단계에서 상대 의도를 미리 본다 (그 라운드는 간파 적립 없음 — 이중 이득 방지).
 * 재전송: 통신 오류로 뒤집힌 내 수를 정정한다 (공개 후 3초 윈도우).
 */
export function PeekChip({
  cost,
  disabled,
  onPeek,
}: {
  cost: number
  disabled: boolean
  onPeek: () => void
}) {
  return (
    <button className="chip" disabled={disabled} onClick={onPeek}>
      👁 엿보기 <span className="chip-cost">−{cost}</span> <kbd className="kbd-hint">E</kbd>
    </button>
  )
}

export function ResendChip({ cost, onResend }: { cost: number; onResend: () => void }) {
  return (
    <button className="chip chip-urgent" onClick={onResend}>
      📡 재전송 — 내 의도를 다시 보내기 <span className="chip-cost">−{cost}</span>{' '}
      <kbd className="kbd-hint">R</kbd>
      <span className="chip-timer" />
    </button>
  )
}
