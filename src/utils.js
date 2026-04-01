import { LANE_ORDER } from './api.js'

export function parseInput(text) {
  return [...new Set(
    text.split('\n')
      .map(l => l.trim())
      .filter(Boolean)
  )].slice(0, 10)
}

export function sortByLane(players) {
  return [...players].sort(
    (a, b) => LANE_ORDER.indexOf(a.lane) - LANE_ORDER.indexOf(b.lane)
  )
}

// C(10,5) = 252개 조합 완전 탐색 밸런싱
export function balanceTeams(players) {
  function combos(arr, k) {
    if (k === 0) return [[]]
    if (arr.length < k) return []
    const [head, ...tail] = arr
    return [
      ...combos(tail, k - 1).map(c => [head, ...c]),
      ...combos(tail, k),
    ]
  }

  let best = null
  let bestScore = -Infinity

  for (const t1 of combos(players, 5)) {
    const ids = new Set(t1.map(p => p.id))
    const t2 = players.filter(p => !ids.has(p.id))

    const sum1 = t1.reduce((s, p) => s + p.points, 0)
    const sum2 = t2.reduce((s, p) => s + p.points, 0)
    const diff = Math.abs(sum1 - sum2)

    // 포지션 커버리지 우선, 그 다음 점수 차이 최소화
    const cover1 = new Set(t1.map(p => p.lane).filter(l => l !== 'UNKNOWN')).size
    const cover2 = new Set(t2.map(p => p.lane).filter(l => l !== 'UNKNOWN')).size
    const score = (cover1 + cover2) * 1000 - diff

    if (score > bestScore) {
      bestScore = score
      best = { team1: sortByLane(t1), team2: sortByLane(t2), sum1, sum2, diff }
    }
  }
  return best
}

export function winRateColor(wr) {
  if (wr >= 60) return '#35c466'
  if (wr >= 50) return '#c89b3c'
  return '#e84057'
}
