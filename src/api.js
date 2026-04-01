// 글로벌 순차 요청 큐 (65ms 간격 → ~15 req/s, 한도 20/s 안전)
let chain = Promise.resolve()
const sleep = ms => new Promise(r => setTimeout(r, ms))

async function riotFetch(url) {
  const doFetch = async () => {
    const res = await fetch(url)
    if (res.status === 429) {
      const wait = (parseInt(res.headers.get('Retry-After') || '2') + 1) * 1000
      console.warn(`[Riot API] 429 Rate Limited → ${wait}ms 대기`)
      await sleep(wait)
      return doFetch()
    }
    if (res.status === 404) throw new Error('소환사를 찾을 수 없습니다')
    if (res.status === 401) throw new Error('API 키가 유효하지 않습니다')
    if (res.status === 403) throw new Error('API 키 권한이 없습니다')
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      throw new Error(body.status?.message || `API 오류 (${res.status})`)
    }
    return res.json()
  }

  const req = chain.then(doFetch)
  chain = req.catch(() => {}).then(() => sleep(65))
  return req
}

// 티어 포인트 계산
const TIER_RANKS = ['IV', 'III', 'II', 'I']
const TIER_ORDER = ['IRON', 'BRONZE', 'SILVER', 'GOLD', 'PLATINUM', 'EMERALD', 'DIAMOND', 'MASTER', 'GRANDMASTER', 'CHALLENGER']

export function getTierPoints(tier, rank) {
  if (!tier || tier === 'UNRANKED') return 0
  const ti = TIER_ORDER.indexOf(tier)
  if (ti < 0) return 0
  if (ti >= 7) return 30 + (ti - 7) * 5
  const ri = TIER_RANKS.indexOf(rank || 'IV')
  return ti * 4 + (ri < 0 ? 0 : ri) + 1
}

// 티어 표시 정보
export const TIER_INFO = {
  IRON:        { nameKo: '아이언',       color: '#9e7a5a', bg: '#2a1e16' },
  BRONZE:      { nameKo: '브론즈',       color: '#c0834a', bg: '#2a1a0e' },
  SILVER:      { nameKo: '실버',         color: '#a8bcc8', bg: '#16202a' },
  GOLD:        { nameKo: '골드',         color: '#c89b3c', bg: '#2a2008' },
  PLATINUM:    { nameKo: '플래티넘',     color: '#4fc6b0', bg: '#082a24' },
  EMERALD:     { nameKo: '에메랄드',     color: '#35c466', bg: '#082a14' },
  DIAMOND:     { nameKo: '다이아몬드',   color: '#5fbde6', bg: '#081e2a' },
  MASTER:      { nameKo: '마스터',       color: '#aa55ee', bg: '#1a0828' },
  GRANDMASTER: { nameKo: '그랜드마스터', color: '#e05555', bg: '#280810' },
  CHALLENGER:  { nameKo: '챌린저',       color: '#f4c874', bg: '#2a1e08' },
  UNRANKED:    { nameKo: '언랭크',       color: '#556677', bg: '#141e28' },
}

// 포지션 표시 정보
export const LANE_INFO = {
  TOP:     { nameKo: '탑',     color: '#e8884a', short: 'TOP' },
  JUNGLE:  { nameKo: '정글',   color: '#35c466', short: 'JGL' },
  MIDDLE:  { nameKo: '미드',   color: '#aa55ee', short: 'MID' },
  BOTTOM:  { nameKo: '원딜',   color: '#4ac8e8', short: 'BOT' },
  UTILITY: { nameKo: '서폿',   color: '#e8c44a', short: 'SUP' },
  UNKNOWN: { nameKo: '미확인', color: '#556677', short: '???' },
}

export const LANE_ORDER = ['TOP', 'JUNGLE', 'MIDDLE', 'BOTTOM', 'UTILITY', 'UNKNOWN']

// 최근 매치에서 주 포지션 분석
async function analyzeLane(matchIds, puuid) {
  const laneCounts = {}
  for (const matchId of matchIds.slice(0, 5)) {
    try {
      const match = await riotFetch(`/api/asia/lol/match/v5/matches/${matchId}`)
      const participant = match.info.participants.find(p => p.puuid === puuid)
      const pos = participant?.teamPosition
      if (pos && pos !== '' && pos !== 'Invalid') {
        laneCounts[pos] = (laneCounts[pos] || 0) + 1
      }
    } catch {
      // skip
    }
  }
  const sorted = Object.entries(laneCounts).sort((a, b) => b[1] - a[1])
  return sorted.length > 0 ? sorted[0][0] : 'UNKNOWN'
}

// Riot API 플레이어 데이터 조회
export async function getPlayerData(riotIdInput, onProgress) {
  const trimmed = riotIdInput.trim()
  const sepIdx = trimmed.lastIndexOf('#')
  const gameName = (sepIdx >= 0 ? trimmed.slice(0, sepIdx) : trimmed).trim()
  const tagLine  = (sepIdx >= 0 ? trimmed.slice(sepIdx + 1) : '').trim() || 'KR1'

  if (!gameName) throw new Error('소환사명이 비어있습니다')

  onProgress?.('계정 조회 중...')
  const account = await riotFetch(
    `/api/asia/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`
  )

  onProgress?.('랭크 조회 중...')
  const entries = await riotFetch(
    `/api/kr/lol/league/v4/entries/by-puuid/${account.puuid}`
  )

  const soloEntry = entries.find(e => e.queueType === 'RANKED_SOLO_5x5')
  const tier   = soloEntry?.tier || 'UNRANKED'
  const rank   = soloEntry?.rank || ''
  const lp     = soloEntry?.leaguePoints || 0
  const wins   = soloEntry?.wins || 0
  const losses = soloEntry?.losses || 0

  onProgress?.('포지션 분석 중...')
  let matchIds = []
  try {
    matchIds = await riotFetch(
      `/api/asia/lol/match/v5/matches/by-puuid/${account.puuid}/ids?queue=420&start=0&count=10`
    )
  } catch {
    // 매치 기록 없어도 진행
  }

  const lane = matchIds.length > 0 ? await analyzeLane(matchIds, account.puuid) : 'UNKNOWN'

  return {
    id:       account.puuid,
    riotId:   `${account.gameName}#${account.tagLine}`,
    nickname: account.gameName,
    tagLine:  account.tagLine,
    tier, rank, lp, wins, losses,
    points:   getTierPoints(tier, rank),
    lane,
  }
}
