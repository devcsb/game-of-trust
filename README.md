# 신뢰의 게임 (IPD 신뢰 게임)

반복 죄수의 딜레마를 캐릭터와 대결하며 배우는 미니 게임. 협력과 배신, 그리고 통신 오류가 끼었을 때 너그러운 맞대응(generous tit-for-tat)이 왜 강한지를 직접 플레이하며 깨닫는다. 서버 없이 브라우저에서 전부 계산하고 GitHub Pages로 배포된다.

플레이: https://devcsb.github.io/ipd-sim/

## 어떤 게임인가

매 라운드 협력/배신을 직접 선택해 다섯 AI 캐릭터와 차례로 대결한다. 각 스테이지가 한 가지 교훈을 준다.

| 스테이지 | 상대 | 교훈 |
|---|---|---|
| 1 호구 | 항상 협력 | 착한 상대는 이용당한다 (유혹) |
| 2 악당 | 항상 배신 | 무조건 협력하면 호구된다 (방어) |
| 3 거울 | 직전 수를 따라함 | 되갚는 상대에겐 협력이 남는 장사 |
| 4 복수귀 | 한 번 배신 = 영구 보복 + 통신오류 | 한 번의 오해가 영원한 파탄 |
| 5 관대한 거울 | 가끔 용서 + 통신오류 | 용서가 신뢰를 되살린다 |

학술 용어는 쓰지 않는다. noise는 "통신 오류"로 연출하고, 표정·점수 막대·신뢰 게이지·콤보·승패 판정으로 직관적으로 보여준다.

## 게임 요소

표정이 바뀌는 SVG 캐릭터, 나 vs 상대 점수 경쟁 막대, 신뢰 게이지(상호협력에 차고 배신에 깎임), 연속 협력 콤보, 라운드 연출(악수/충돌), Web Audio 합성 효과음(음소거 토글), 별 1~3개·잠금 해제·진행 저장(localStorage).

## 기술

React + Vite + TypeScript. 외부 UI 라이브러리/이미지 에셋 0 (인라인 SVG + CSS keyframes + Web Audio API). 검증된 게임이론 엔진(전략 8종, 시드 PRNG, payoff, noise) 위에 비주얼 레이어만 얹었다. `prefers-reduced-motion` 존중.

## 구조

```
src/core/   순수 도메인 (전략, payoff, rng, noise)
src/sim/    gameRunner(라운드 단위 진행), match(전략 대 전략, 테스트용)
src/game/   stages, progress, mood, trust, combo, outcome (히스토리 파생 순수 함수)
src/ui/     게임 화면 (Avatar, GamePlay, StageMap, StageResult, ScoreBar, TrustGauge ...)
src/audio/  sound (합성 효과음)
tests/      47개 (도메인 회귀 + 게임 파생 로직)
```

## 실행

```bash
npm install
npm run dev        # http://localhost:5173/ipd-sim/
npm run test:run   # 회귀 + 게임 로직 테스트
npm run build      # dist/ 정적 빌드
```

## 배경

게임이론 결과를 플레이 경험으로 옮긴 교육용 게임이다. Axelrod(1984) 토너먼트에서 tit-for-tat의 성공 4속성(nice, retaliatory, forgiving, clear), Nowak & Sigmund(1992)의 generous tit-for-tat이 noisy 환경에서 우월하다는 결과가 스테이지 설계의 뼈대다. 표준 payoff(T=5, R=3, P=1, S=0)와 noise=0 결정론 결과는 `tests/golden/`이 코드로 잠근다.
