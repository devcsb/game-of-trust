import { useHotkeys } from './useHotkeys'

export function RulesModal({ onClose }: { onClose: () => void }) {
  useHotkeys({ escape: onClose, enter: onClose })

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal card" onClick={(e) => e.stopPropagation()}>
        <h2>게임 규칙</h2>
        <p className="rules-intro">
          매 라운드 협력 또는 배신을 골라요. 두 사람의 선택에 따라 점수가 정해져요.
        </p>
        <table className="payoff-table">
          <thead>
            <tr>
              <th></th>
              <th>상대 협력</th>
              <th>상대 배신</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <th>내 협력</th>
              <td>나 3 · 상대 3</td>
              <td>나 0 · 상대 5</td>
            </tr>
            <tr>
              <th>내 배신</th>
              <td>나 5 · 상대 0</td>
              <td>나 1 · 상대 1</td>
            </tr>
          </tbody>
        </table>
        <p className="rules-key">
          둘이 협력하면 합쳐서 <strong>6</strong>(가장 큼), 한쪽만 배신하면 <strong>5</strong>, 둘
          다 배신하면 <strong>2</strong>예요. 그래서 함께 키우는 수확은 서로 협력할 때 가장 커요.
          배신은 잠깐 내 점수를 올리지만 전체 수확은 줄여요.
        </p>
        <div className="actions">
          <button className="btn primary" onClick={onClose}>
            알겠어요 <kbd className="kbd-hint">Enter</kbd>
          </button>
        </div>
      </div>
    </div>
  )
}
