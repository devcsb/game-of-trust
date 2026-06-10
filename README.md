# 신뢰의 게임 (IPD 신뢰 게임)

반복 죄수의 딜레마를 캐릭터와 대결하며 배우는 미니 게임. 협력과 배신, 통신 오류, 그리고 "왜 협력이 세상 전체에 이로운가"를 직접 플레이하며 깨닫는다. 서버 없이 브라우저에서 전부 계산하고 GitHub Pages로 배포된다.

플레이: https://devcsb.github.io/game-of-trust/

## 어떤 게임인가

매 라운드 협력/배신을 직접 골라 일곱 AI 캐릭터와 차례로 대결한다. 각 스테이지가 한 가지 교훈을 준다.

| # | 상대 | 교훈 |
|---|---|---|
| 1 호구 | 항상 협력 | 착한 상대는 이용당한다 (유혹) |
| 2 악당 | 항상 배신 | 무조건 협력하면 호구된다 (방어) |
| 3 거울 | 직전 수를 따라함 | 되갚는 상대에겐 협력이 남는 장사 |
| 4 복수귀 | 한 번 배신 = 영구 보복 + 통신오류 | 한 번의 오해가 영원한 파탄 |
| 5 관대한 거울 | 가끔 용서 + 통신오류 | 용서가 신뢰를 되살린다 |
| 6 변덕쟁이 | 이기면 유지, 지면 전환 + 통신오류 | 결과에 반응하는 상대 |
| 7 동전 | 완전 무작위 | 무작위엔 전략이 통하지 않는다 (운) |

학술 용어는 쓰지 않는다. noise는 "통신 오류"로, 협력의 사회적 가치는 "공동 수확"으로 보여준다.

## 게임 요소

- 표정이 바뀌는 SVG 캐릭터(협력하면 웃고, 배신당하면 화남)
- **공동 수확 HUD**: 두 점수의 합(사회후생)을 목표선과 함께. 협력은 6, 일방배신은 5(손실), 상호배신은 2.
- **공동 정원**: 라운드마다 셀이 협력=만개, 배신=시듦으로 누적
- **자원 교환 연출**: 협력=공동 풀로 흐름, 배신=강탈+균열
- 신뢰 게이지, 연속 협력 콤보, Web Audio 합성 효과음(음소거 토글)
- **규칙 온보딩**(payoff 표), 별 1~3개·잠금 해제·진행 저장(localStorage)
- **진화 토너먼트**: 엔딩 후, 여섯 전략이 한 인구에서 경쟁하며 어떤 전략이 번성/소멸하는지 보여준다
- **플레이 스타일 분석**: 클리어 후 "낙관가 / 균형가 / 회의가 · 협력률"
- 화면 전환 애니메이션, `prefers-reduced-motion` 존중

## 기술

React + Vite + TypeScript. 외부 UI 라이브러리/이미지 에셋 0 (인라인 SVG + CSS keyframes + Web Audio API). 검증된 게임이론 엔진(전략 8종, 시드 PRNG, payoff, noise) 위에 비주얼 레이어만 얹었다. 모든 시각 상태는 라운드 히스토리에서 파생되는 순수 함수에서 나온다.

## 구조

```
src/core/   순수 도메인 (전략 8종, payoff, rng, noise)
src/sim/    gameRunner(라운드 진행), match(전략 대 전략), evolution(replicator dynamics)
src/game/   stages, progress, mood, trust, combo, outcome, world, welfareMessage, analysis
src/ui/     게임 화면 (Avatar, GamePlay, StageMap, StageResult, GardenWorld, WelfareHud,
            ExchangeStage, EvolutionView, RulesModal, TrustGauge ...)
src/audio/  sound (합성 효과음)
tests/      67개 (도메인 회귀 + 게임 파생 로직 + 진화/분석)
```

## 실행

```bash
npm install
npm run dev        # http://localhost:5173/game-of-trust/
npm run test:run   # 회귀 + 게임 로직 테스트
npm run build      # dist/ 정적 빌드
```

## 배경

게임이론 결과를 플레이 경험으로 옮긴 교육용 게임이다. Axelrod(1984) tit-for-tat의 성공 4속성(nice, retaliatory, forgiving, clear), Nowak & Sigmund(1992)의 generous tit-for-tat이 noisy 환경에서 우월하다는 결과, 그리고 협력이 사회후생(2R > T+S, 즉 6 > 5)을 극대화한다는 점이 설계의 뼈대다. 핵심 명제(일방배신은 수확 손실이라는 단조성, AllD가 AllC를 잠식하지만 TFT는 살아남는다는 진화 결과)는 `tests/`가 코드로 잠근다.
