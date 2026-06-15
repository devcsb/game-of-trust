import { runMatch } from './match'
import type { MatchOutcome } from './match'
import { runEvolution } from './evolution'
import type { SpeciesRef } from './evolution'
import { mulberry32 } from '../core/rng'
import type { RNG } from '../core/rng'
import { resolveStrategy } from '../core/strategy/registry'
import type { StrategySpec } from '../core/strategy/registry'
import type { FogWorld, PopMember } from '../game/worlds'
import {
  FIRST_MOVES,
  ON_COOPS,
  ON_DEFECTS,
} from '../core/strategy/custom'
import type { CustomStrategyDef } from '../core/strategy/custom'

/** 한 세계에서 치르는 조우 횟수. 변동 라운드 수와 함께 통계적 텍스처를 만든다. */
export const ENCOUNTERS = 6

export interface Encounter {
  index: number
  oppSpec: StrategySpec
  oppLabel: string // 정체. 조우가 끝난 뒤에야 안개가 걷히며 드러난다.
  rounds: number
  playerScore: number
  oppScore: number
  outcome: MatchOutcome
}

export interface GauntletResult {
  encounters: Encounter[]
  totalPlayer: number
  totalOpp: number
  totalWelfare: number // 두 점수의 합 (사회후생)
  rounds: number // 전체 누적 라운드 수
}

/** 안개 속 상대의 본색. 조우 동안 상대가 실제로 협력한 비율로 가른다. */
export type ReadClass = 'coop' | 'hostile'

/** 상대가 그 조우에서 실제 전달한 수 중 협력 비율 0..1. */
export function opponentCoopRate(enc: Encounter): number {
  const r = enc.outcome.rounds
  if (r.length === 0) return 0
  const coops = r.filter((x) => x.played[1] === 'C').length
  return coops / r.length
}

/** 협력 ≥ 50%면 '협력적', 아니면 '적대적'. 읽기 베팅의 정답 기준. */
export function encounterClass(enc: Encounter): ReadClass {
  return opponentCoopRate(enc) >= 0.5 ? 'coop' : 'hostile'
}

/** 정규화 누적 분포에서 인덱스를 뽑는다. r ∈ [0,1). */
function sampleIndex(weights: number[], r: number): number {
  const sum = weights.reduce((a, b) => a + b, 0)
  if (sum <= 0) return 0
  let acc = 0
  const target = r * sum
  for (let i = 0; i < weights.length; i++) {
    acc += weights[i]
    if (target < acc) return i
  }
  return weights.length - 1
}

/** [min, max] 정수 라운드 수를 r ∈ [0,1)에서 뽑는다 (양 끝 포함). */
function sampleRounds(min: number, max: number, r: number): number {
  if (max <= min) return min
  return min + Math.floor(r * (max - min + 1))
}

/**
 * 진화하는 세계에서 조우별 샘플링 분포를 만든다. 플레이어 전략을 생태계에 섞어
 * replicator를 돌린 뒤, 각 세대 분포에서 플레이어 몫을 빼고 세계 구성원으로 재정규화한다.
 * 착취 전략은 자기가 마주칠 들판을 직접 단단하게(또는 무르게) 만든다.
 */
function evolvingDistributions(world: FogWorld, playerSpec: StrategySpec): number[][] {
  const members = world.population
  const species: SpeciesRef[] = [...members.map((m) => m.spec), playerSpec]
  const total = members.reduce((a, m) => a + m.weight, 0)
  const initial = [
    ...members.map((m) => (m.weight / total) * 0.85), // 세계가 85%, 플레이어가 15%로 진입
    0.15,
  ]
  const evo = runEvolution({
    strategies: species,
    rounds: 20,
    payoff: world.payoff,
    executionNoise: world.executionNoise,
    seed: world.seed,
    generations: ENCOUNTERS,
    initial,
  })
  // 각 세대의 세계 구성원 몫(플레이어 제외)만 추려 분포로 쓴다.
  return evo.history.map((gen) => gen.slice(0, members.length))
}

/**
 * 고정 세계의 조우별 분포 — 모든 조우가 동일한 개체군 비중을 쓴다.
 */
function staticDistributions(members: PopMember[]): number[][] {
  const w = members.map((m) => m.weight)
  return Array.from({ length: ENCOUNTERS + 1 }, () => w)
}

/**
 * 하나의 기본 전략을 안개의 세계에 투입해 ENCOUNTERS번의 조우를 치른다.
 * RNG 소비 순서가 채점 재현성 계약이다 (절대 변경 금지):
 *   각 조우마다 → 상대 추출 r → 라운드 수 r → 매치(자체 시드)
 * 같은 (playerSpec, world)는 항상 같은 결과를 낸다.
 */
export function runGauntlet(playerSpec: StrategySpec, world: FogWorld): GauntletResult {
  const rng: RNG = mulberry32(world.seed)
  const members = world.population
  const dists = world.evolving
    ? evolvingDistributions(world, playerSpec)
    : staticDistributions(members)

  const encounters: Encounter[] = []
  let totalPlayer = 0
  let totalOpp = 0
  let rounds = 0

  for (let i = 0; i < ENCOUNTERS; i++) {
    const dist = dists[Math.min(i, dists.length - 1)]
    const oppIdx = sampleIndex(dist, rng.next())
    const member = members[oppIdx]
    const r = sampleRounds(world.roundsMin, world.roundsMax, rng.next())
    const matchSeed = (world.seed + i * 7919) >>> 0
    const out = runMatch(
      playerSpec,
      member.spec,
      {
        rounds: r,
        payoff: world.payoff,
        executionNoise: world.executionNoise,
        perceptionNoise: world.perceptionNoise,
        seed: matchSeed,
      },
      mulberry32(matchSeed),
    )
    totalPlayer += out.score[0]
    totalOpp += out.score[1]
    rounds += r
    encounters.push({
      index: i,
      oppSpec: member.spec,
      oppLabel: resolveStrategy(member.spec).label,
      rounds: r,
      playerScore: out.score[0],
      oppScore: out.score[1],
      outcome: out,
    })
  }

  return {
    encounters,
    totalPlayer,
    totalOpp,
    totalWelfare: totalPlayer + totalOpp,
    rounds,
  }
}

/** 빌더 카드 공간의 16개 기본 전략을 모두 열거한다. */
export function allBaseStrategies(): CustomStrategyDef[] {
  const out: CustomStrategyDef[] = []
  for (const firstMove of FIRST_MOVES) {
    for (const onCoop of ON_COOPS) {
      for (const onDefect of ON_DEFECTS) {
        out.push({ v: 1, name: 'cand', glyph: '🌟', firstMove, onCoop, onDefect })
      }
    }
  }
  return out
}

export interface BestBase {
  def: CustomStrategyDef
  score: number // 그 세계에서 거둔 개인 총점
}

/**
 * 이 세계에서 개인 수확이 가장 큰 기본 전략을 brute-force로 찾는다 (채점 앵커).
 * "정답"이 아니라 "이 안개 속에서 이론적으로 가능한 최선의 기본 전략"이다.
 */
export function bestBaseStrategy(world: FogWorld): BestBase {
  let best: BestBase | null = null
  for (const def of allBaseStrategies()) {
    const res = runGauntlet({ custom: def }, world)
    if (!best || res.totalPlayer > best.score) {
      best = { def, score: res.totalPlayer }
    }
  }
  return best!
}

/** 항상 배신(AllD)의 수확 — 효율 채점의 하한 앵커. */
export function worstReasonableScore(world: FogWorld): number {
  return runGauntlet({ id: 'alld' }, world).totalPlayer
}

export interface WorldAnchors {
  bestScore: number
  bestDef: CustomStrategyDef
  floorScore: number
}

/**
 * 세계의 채점 앵커(이론적 최선 + 무조건 배신 하한)는 플레이어와 무관한 순수값이라
 * 세계당 한 번만 계산하면 된다. brute-force 16회 + AllD 1회 시뮬이 무거우므로
 * world.id로 메모이즈해 결과 화면 재방문/재도전 때 재계산하지 않는다.
 */
const ANCHOR_CACHE = new Map<string, WorldAnchors>()

export function worldAnchors(world: FogWorld): WorldAnchors {
  const cached = ANCHOR_CACHE.get(world.id)
  if (cached) return cached
  const best = bestBaseStrategy(world)
  const anchors: WorldAnchors = {
    bestScore: best.score,
    bestDef: best.def,
    floorScore: worstReasonableScore(world),
  }
  ANCHOR_CACHE.set(world.id, anchors)
  return anchors
}

export interface GauntletGrade {
  playerScore: number
  bestScore: number
  floorScore: number
  /** 하한 대비 최선까지의 구간에서 내 위치 0..1 (효율). */
  efficiency: number
  stars: number // 0..3
  bestDef: CustomStrategyDef
  /** 채점에 쓴 플레이어 조우 결과 — 재시뮬 없이 UI가 그대로 쓴다. */
  playerResult: GauntletResult
}

/**
 * 절대 점수가 아니라 "이 세계의 이론적 최선 대비 효율"로 채점한다.
 * 정답을 따라가는 게 아니라, 불확실성 하에서 내 전략이 최선에 얼마나 근접했나를 본다.
 * 플레이어 조우 결과도 함께 반환해 호출부가 runGauntlet을 중복 호출하지 않게 한다.
 */
export function gradeGauntlet(playerSpec: StrategySpec, world: FogWorld): GauntletGrade {
  const player = runGauntlet(playerSpec, world)
  const { bestScore, bestDef, floorScore } = worldAnchors(world)
  const span = bestScore - floorScore
  const efficiency =
    span <= 0 ? 1 : Math.max(0, Math.min(1, (player.totalPlayer - floorScore) / span))
  const stars = efficiency >= 0.95 ? 3 : efficiency >= 0.8 ? 2 : efficiency >= 0.55 ? 1 : 0
  return {
    playerScore: player.totalPlayer,
    bestScore,
    floorScore,
    efficiency,
    stars,
    bestDef,
    playerResult: player,
  }
}
