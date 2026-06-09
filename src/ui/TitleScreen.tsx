export function TitleScreen({ onStart }: { onStart: () => void }) {
  return (
    <div className="screen center">
      <div className="card title-card">
        <h1>신뢰의 게임</h1>
        <p>
          협력할까, 배신할까? 다섯 상대를 차례로 만나며 신뢰가 어떻게 쌓이고
          무너지는지 직접 느껴보세요.
        </p>
        <button className="btn primary" onClick={onStart}>
          시작하기
        </button>
      </div>
    </div>
  )
}
