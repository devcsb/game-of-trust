export function FloatingPoints({ amount }: { amount: number }) {
  const tone = amount >= 3 ? 'good' : amount === 0 ? 'bad' : 'mid'
  return <span className={`float-points fp-${tone}`}>+{amount}</span>
}
