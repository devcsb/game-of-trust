# 신뢰의 게임 (The Game of Trust)

반복 죄수의 딜레마(Iterated Prisoner's Dilemma)를 직접 플레이하면서 "왜 협력이 진화하는가"라는 오래된 질문을 손으로 만져 보는 인터랙티브 시뮬레이터다. 교육용 미니 게임으로 시작했지만, 화면 뒤에서는 Axelrod 토너먼트(1984) 이후 게임이론이 쌓아 온 핵심 결과를 그대로 재현한 결정론적 엔진이 돈다. 모든 명제를 말로 설명하지 않고 코드로 계산하며, 테스트 115개가 그 계산을 검증한다.

플레이: https://devcsb.github.io/game-of-trust/

서버 없이 브라우저에서 전부 계산하고 GitHub Pages로 배포한다. 외부 UI 라이브러리도, 이미지 에셋도 쓰지 않는다 (인라인 SVG, CSS keyframes, Web Audio API).

## 무엇을 배우는가

죄수의 딜레마는 한 판만 보면 배신이 우월 전략이다. 그런데 같은 상대를 반복해서 만나면(IPD) 이야기가 달라진다. Axelrod & Hamilton(1981)이 보였듯, 미래의 그림자가 충분히 길면 협력이 진화적으로 안정될 수 있다. 플레이어는 이 게임에서 그 전환점을 직접 지난다.

설계 철학은 단순하다. 학술 용어는 화면에서 추방하되, 그 아래 수학은 한 톨도 깎지 않는다. noise는 통신 오류로, social welfare는 공동 수확으로, replicator dynamics는 요동치는 들판으로 옮겼다. 플레이어는 Tit-for-Tat이라는 이름을 몰라도 카드 세 장으로 그것을 다시 발명하고, "거울을 재발명했어요"라는 메시지를 보고서야 자신이 무엇을 찾아냈는지 알게 된다.

## 캠페인: 정체가 드러난 일곱 상대

매 라운드 **예측, 선택, 동시 공개, 정산** 네 단계로 일곱 AI와 차례로 대결한다. 상대는 모두 게임이론 문헌의 정준 전략 하나이고, 스테이지마다 교훈 하나가 박혀 있다.

| # | 상대 | 전략 (문헌명) | 교훈 |
|---|---|---|---|
| 1 호구 | 항상 협력 | Always Cooperate | 착한 상대는 이용당한다 (유혹) |
| 2 악당 | 항상 배신 | Always Defect | 무조건 협력하면 호구된다 (방어) |
| 3 거울 | 직전 수를 따라함 | Tit-for-Tat (Rapoport) | 되갚는 상대에겐 협력이 남는 장사 |
| 4 복수귀 | 한 번 배신은 영구 보복 | Grim Trigger (Friedman 1971) | 한 번의 오해가 영원한 파탄 |
| 5 관대한 거울 | 가끔 용서 | Generous TFT, q=1/3 (Nowak & Sigmund 1992) | 용서가 신뢰를 되살린다 |
| 6 변덕쟁이 | 이기면 유지, 지면 전환 | Pavlov / Win-Stay-Lose-Shift (Nowak & Sigmund 1993) | 결과에 반응하는 상대 |
| 7 동전 | 완전 무작위 | Random | 무작위엔 전략이 통하지 않는다 (운) |

거울(TFT)이 중심이다. Axelrod가 꼽은 성공하는 전략의 네 속성을 이 캐릭터 하나에 담았다. 먼저 배신하지 않고(nice), 배신은 갚고(retaliatory), 다시 협력하면 용서하고(forgiving), 행동이 단순해 읽히는(clear) 성질이다.

빌더 모드에서는 카드 세 장(첫 만남, 협력받으면, 배신당하면)으로 나만의 전략을 조립한다. 조립한 조합이 빌트인 전략과 행동이 같아지면 그 정체를 알려 준다. Axelrod 원칙을 따라 부품을 끼우다 보면 TFT, GTFT, Grudger를 스스로 다시 발명하게 된다.

## 안개의 세계: 정체가 숨겨진 개체군

캠페인이 정체가 공개된 상대 한 명을 차례로 상대한다면, 안개의 세계는 정반대다. 상대 스탠스가 숨겨진 **혼합 개체군**에 나의 **기본 전략 하나**를 들고 들어가, 불확실성 속에서 수확을 극대화한다. 정답을 따라가는 게 아니라, 단서를 읽어 세계마다 다른 최적 스탠스를 찾는 게임이다.

| 세계 | 숨은 구성 | 비틂 | 교훈 |
|---|---|---|---|
| 🌫️ 안개 낀 장터 | TFT 다수, AllC와 AllD 소수 | 표준 보수 | 받은 대로 갚는 게 남는 장사 |
| 🏜️ 굶주린 변경 | Grudger 다수 | 유혹 T 증가 (T=6, R=4) | 유혹에 넘어가면 영원히 등 돌림 |
| 🌁 메아리 협곡 | TFT/GTFT 혼합 | 통신 오류 20%, 인식 오류 10% | 엄격함은 독, 약간의 용서가 악순환을 끊음 |
| 🌪️ 요동치는 들판 | AllC/TFT/AllD/Pavlov | 진화하는 분포 (replicator) | 너그러운 보복이 내가 거둘 땅을 비옥하게 함 |

전략을 고를 때는 여섯 **페르소나**(거울, 현자, 복수귀, 성자, 여우, 가시) 가운데 하나를 빠르게 집은 뒤 카드로 다듬는다. 페르소나는 저마다 문헌의 전략 하나에 대응하므로(거울=TFT, 현자=GTFT, 복수귀=Grudger, 성자=AllC, 여우=AllD 계열), 이모지를 고르는 일이 곧 게임이론 전략을 고르는 일이다.

조우는 **안개 읽기 베팅**이다. 정체가 드러나기 전, 흐릿한 실루엣과 직전 흐름만 보고 "협력적인가 적대적인가"를 먼저 읽는다. 안개가 걷히면 표정 SVG 아바타와 행동 트레이스, 정체가 드러나고, 읽기가 맞으면 통찰이 쌓인다. 정해진 스탠스를 따라가는 게 아니라, 불완전 정보 아래에서 베이지안 추론을 하는 루프다.

## 시뮬레이션 엔진

게임 결과는 모두 `src/core`와 `src/sim`의 순수 함수에서 나온다. 비주얼은 그 위에 얇게 얹은 레이어일 뿐이다.

**보수 행렬.** 표준 값은 T=5, R=3, P=1, S=0이다. 죄수의 딜레마 조건 T>R>P>S와 더불어, 반복 게임에서 협력을 의미 있게 만드는 추가 제약 2R>T+S(여기서 6>5)를 만족한다. 이 부등식이 곧 상호 협력이 사회후생을 극대화한다는 명제의 형식적 근거이고, 게임에서는 이를 공동 수확 HUD로 보여준다.

**전략 8종.** Always Cooperate, Always Defect, Random, Tit-for-Tat, Generous TFT, Tit-for-Two-Tats, Grim Trigger(Grudger), Pavlov(WSLS). Generous TFT의 관대함 q는 표준 보수에서의 이론적 최적값 1/3로 고정했다(Nowak & Sigmund 1992). Tit-for-Two-Tats는 Axelrod의 1차 토너먼트에 출전했다면 우승했을 전략으로 꼽힌다.

**이중 노이즈 모델.** 현실에서 협력은 두 종류의 잡음을 견뎌야 한다. 이 게임에서는 둘을 나눠 모델링한다.
- 실행 오류(`executionNoise`): 의도한 수와 실제로 둔 수가 어긋난다. Selten(1975)의 trembling hand에 해당한다.
- 인식 오류(`perceptionNoise`): 실제로 둔 수와 상대가 본 수가 어긋난다. 신호 오인(misperception)에 해당한다.

매 라운드는 의도, 실행, 인식의 사슬을 따른다. 그래서 "읽기는 정확했지만 전파만 어긋난" 순간이 생기고, 메아리 협곡에서 엄격한 보복이 왜 스스로를 무너뜨리는지가 플레이로 드러난다. Wu & Axelrod(1995)가 noisy IPD에서 관대함과 참회가 왜 필요한지 보인 것과 같은 결론이다.

**replicator dynamics.** 진화의 정원과 요동치는 들판은 이산 복제자 방정식을 돌린다.

```
x_i' = x_i · f_i / f̄      (f_i = 전략 i의 평균 적합도, f̄ = 개체군 평균)
```

각 전략쌍을 맞붙여 적합도 행렬 A를 만들고(A[i][j] = i가 j 상대로 얻는 라운드당 평균 점수), 세대마다 위 식으로 분포를 갱신한다(Taylor & Jonker 1978; Hofbauer & Sigmund 1998). 내 전략은 일곱 번째 종으로 이 생태계에 참가하고, 착취 전략은 자기가 마주칠 들판을 스스로 단단하게 만든다.

**효율 채점.** 안개의 세계는 절대 점수가 아니라 이론적 최선 대비 효율로 평가한다. 카드 공간의 기본 전략 16개를 전수(brute-force) 평가해 그 세계의 상한을 찾고, 무조건 배신(AllD)을 하한으로 잡아, 내 점수가 그 구간의 몇 %인지로 별을 매긴다. 앵커는 플레이어와 무관한 순수값이라 세계마다 한 번만 계산해 메모이즈한다. 결정성은 시드 PRNG(mulberry32)와 고정된 RNG 소비 순서로 보장한다. 같은 (전략, 세계)는 언제나 같은 결과를 낸다.

## 게임 요소

- **예측(간파) 시스템**: 매 라운드 상대의 다음 수를 예측한다. 채점은 상대의 의도를 기준으로 하므로, 통신 오류가 끼면 "읽기는 정확, 전파만 어긋남" 상태가 따로 보인다.
- **통찰 경제**: 점수와 분리된 자원이다. 엿보기(상대 의도 미리 보기)와 재전송(노이즈로 뒤집힌 내 수를 정정, 복수귀의 도화선을 끌 유일한 수단)에 쓴다.
- **스테이지 시그니처 텔**: 호구의 열린 손, 악당의 도발 말풍선(말과 행동이 다름), 거울 속 잔상, 복수귀의 도화선, 관대한 거울의 용서 카운터, 변덕쟁이의 기분 풍향계, 동전의 적중률 미터.
- **진화의 정원**: 내 전략을 일곱 번째 종으로 출전시킨다. 실행 전에 "60세대 뒤 번성, 생존, 멸종?"을 먼저 예측하게 하고, 멸종하면 사인을 한 줄로 분석해 준다.
- **공동 수확 HUD**: 두 점수의 합(사회후생)을 목표선과 함께 보여준다. 상호 협력 6, 일방 배신 5, 상호 배신 2.
- 표정이 바뀌는 SVG 캐릭터, 동시 공개 연출(드럼롤, 동시 플립, 글리치, 간파 스탬프), 신뢰 게이지, 협력 콤보 화음, Web Audio 합성 효과음(음소거 토글).
- 규칙 온보딩(payoff 표), 별 최대 3개, 잠금 해제, 진행 저장(localStorage), 플레이 스타일 분석(낙관가, 균형가, 회의가, 협력률, 읽기 정확도).
- 화면 전환 애니메이션, `prefers-reduced-motion` 존중(모든 연출 스킵, 즉시 정산).

## 기술과 구조

React + Vite + TypeScript. 모든 시각 상태는 라운드 히스토리에서 파생한 순수 함수에서 나온다.

```
src/core/   순수 도메인 (전략 8종 + 커스텀 전략 컴파일러, payoff, rng, noise)
src/sim/    gameRunner(라운드 진행 상태기계), match(전략 대 전략),
            evolution(replicator dynamics, 커스텀 종 참가),
            gauntlet(안개의 세계 조우 + brute-force 최선 앵커 + 효율 채점)
src/game/   stages, worlds(안개의 세계 4종), progress, insight(통찰 경제),
            twists, mood, trust, combo, analysis, storage
src/ui/     게임 화면 (GamePlay 4단계 상태기계, BuilderView, EvolutionView,
            StageMap, WorldMap, GauntletView 등)
src/audio/  sound (합성 효과음, 콤보 에스컬레이션, 글리치 노이즈)
tests/      115개 (도메인 회귀 + 커스텀 전략 동치 골든 + 안개의 세계 결정성,
            채점 앵커, 읽기 분류, 베팅 플로우)
```

## 실행

```bash
npm install
npm run dev        # http://localhost:5173/game-of-trust/
npm run test:run   # 회귀 + 게임 로직 테스트
npm run build      # dist/ 정적 빌드
```

`main`에 push하면 GitHub Actions가 테스트를 게이트로 돌린 뒤 Pages로 자동 배포한다.

## 참고문헌

게임 메커니즘이 기대는 핵심 문헌이다.

- Axelrod, R., & Hamilton, W. D. (1981). The evolution of cooperation. *Science*, 211(4489), 1390–1396.
- Axelrod, R. (1984). *The Evolution of Cooperation*. Basic Books. (토너먼트, TFT의 네 속성)
- Friedman, J. W. (1971). A non-cooperative equilibrium for supergames. *Review of Economic Studies*, 38(1), 1–12. (trigger 전략)
- Selten, R. (1975). Reexamination of the perfectness concept for equilibrium points in extensive games. *International Journal of Game Theory*, 4(1), 25–55. (trembling hand)
- Maynard Smith, J. (1982). *Evolution and the Theory of Games*. Cambridge University Press. (ESS)
- Taylor, P. D., & Jonker, L. B. (1978). Evolutionary stable strategies and game dynamics. *Mathematical Biosciences*, 40(1–2), 145–156. (replicator dynamics)
- Nowak, M. A., & Sigmund, K. (1992). Tit for tat in heterogeneous populations. *Nature*, 355, 250–253. (Generous TFT, 최적 관대함)
- Nowak, M. A., & Sigmund, K. (1993). A strategy of win-stay, lose-shift that outperforms tit-for-tat. *Nature*, 364, 56–58. (Pavlov / WSLS)
- Wu, J., & Axelrod, R. (1995). How to cope with noise in the iterated prisoner's dilemma. *Journal of Conflict Resolution*, 39(1), 183–189. (노이즈 대응)
- Hofbauer, J., & Sigmund, K. (1998). *Evolutionary Games and Population Dynamics*. Cambridge University Press.
- Press, W. H., & Dyson, F. J. (2012). Iterated Prisoner's Dilemma contains strategies that dominate any evolutionary opponent. *PNAS*, 109(26), 10409–10413. (zero-determinant / 착취 전략, 더 읽을거리)
