# IPD 협력 시뮬레이터 (ipd-sim)

반복 죄수의 딜레마(iterated prisoner's dilemma)에서 너그러운 tit-for-tat이 언제 우월한지를 슬라이더로 직접 만지며 깨닫는 인터랙티브 시뮬레이터. 서버 없이 브라우저에서 전부 계산하고 GitHub Pages로 배포한다.

## 핵심 질문

noise(검증 실패)가 없으면 엄격한 tit-for-tat으로 충분하다. 하지만 noise가 끼면 엄격함이 보복 루프(echo)를 만들고, 약간의 관용이 그 루프를 깬다. 그리고 그 최적 관용도는 고정값(1/3)이 아니라 payoff와 noise가 함께 정한다. 1/3은 표준 payoff(T=5,R=3,P=1,S=0)의 특수해일 뿐이다.

## 기능

- 1:1 대결: 8개 전략(AllC, AllD, Random, TFT, GTFT, TF2T, Grudger, Pavlov)을 붙여 라운드별 선택과 누적 점수를 본다.
- 2D 히트맵: noise × 관용도 격자에서 GTFT의 평균 점수를 색으로, Nowak-Sigmund 이론 최적선과 실측 최적선을 겹쳐 비교한다.
- payoff 에디터: T/R/P/S를 바꾸면 이론 최적선이 움직여 "1/3은 보편 법칙이 아님"을 직접 확인한다.
- 시나리오 스킨: 추상 게임을 "AI 연구소 조정", "군비 통제"로 바꿔 noise를 검증 불가능성으로 매핑한다.
- 가이드 챌린지: 발견을 유도하는 과제와 localStorage 진행 추적.
- URL 공유: 시드 PRNG로 결과까지 동일하게 재현되는 링크.

## 실행

```bash
npm install
npm run dev        # http://localhost:5173/ipd-sim/
npm run test:run   # 도메인 회귀 테스트
npm run build      # dist/ 로 정적 빌드
```

## 구조

의존 방향은 한쪽으로만 흐른다. 도메인 코어는 DOM/React/시간/전역난수에 의존하지 않는 순수 모듈이다.

```
src/core/   순수 도메인 (types, payoff, rng, noise, strategy)
src/sim/    시뮬레이션 (match, sweep, challenges)
src/ui/viz/ 시각화 (Timeline, ScoreLine, HeatmapCanvas)
src/ui/     React UI (controls, modes)
src/state/  앱 상태, 시나리오, URL, progress
tests/      도메인 + golden 회귀
```

## 학술 근거

- Axelrod (1984): tit-for-tat의 성공 4속성 (nice, retaliatory, forgiving, clear).
- Nowak & Sigmund (1992): generous tit-for-tat 최적 용서 확률 `q* = min{1 - (T-R)/(R-S), (R-P)/(T-P)}`.
- 표준 payoff 제약: `T > R > P > S`, `2R > T + S`.

회귀 테스트(`tests/golden/`)가 이 주장들을 코드로 잠근다. noise=0 결정론 결과, noise 환경에서 GTFT 페어 우월, noise 증가 시 최적 관용도 상승 등.
