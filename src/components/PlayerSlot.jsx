import { TIER_INFO, LANE_INFO } from '../api.js'
import { winRateColor } from '../utils.js'

export default function PlayerSlot({ slot, idx, onRetry }) {
  const { status, data, error, progress, riotId } = slot

  if (status === 'idle') {
    return (
      <div className="pslot idle">
        <span className="pslot-num">{idx + 1}</span>
        <span className="pslot-name">{riotId}</span>
      </div>
    )
  }

  if (status === 'loading') {
    return (
      <div className="pslot loading">
        <span className="pslot-num">{idx + 1}</span>
        <span className="spinner sm" />
        <div className="pslot-loading-info">
          <span className="pslot-name">{riotId}</span>
          <span className="pslot-progress">{progress}</span>
        </div>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="pslot error">
        <span className="pslot-num">{idx + 1}</span>
        <div className="pslot-error-info">
          <span className="pslot-name">{riotId}</span>
          <span className="pslot-error-msg">{error}</span>
        </div>
        <button className="retry-btn" onClick={onRetry}>재시도</button>
      </div>
    )
  }

  const { nickname, tagLine, tier, rank, lp, wins, losses, lane, points } = data
  const tierInfo = TIER_INFO[tier] || TIER_INFO.UNRANKED
  const laneInfo = LANE_INFO[lane] || LANE_INFO.UNKNOWN
  const total = wins + losses
  const wr = total > 0 ? Math.round((wins / total) * 100) : null

  return (
    <div className="pslot done" style={{ '--tc': tierInfo.color, '--tbg': tierInfo.bg }}>
      <span className="pslot-num">{idx + 1}</span>
      <span
        className="lane-badge"
        style={{ color: laneInfo.color, borderColor: laneInfo.color + '55', background: laneInfo.color + '18' }}
      >
        {laneInfo.short}
      </span>
      <div className="pslot-name-wrap">
        <span className="pslot-name">{nickname}</span>
        <span className="pslot-tag">#{tagLine}</span>
      </div>
      <div
        className="tier-badge"
        style={{ color: tierInfo.color, background: tierInfo.bg, borderColor: tierInfo.color + '44' }}
      >
        {tierInfo.nameKo}{rank ? ` ${rank}` : ''}
        {tier !== 'UNRANKED' && <span className="tier-lp">{lp}LP</span>}
      </div>
      {wr !== null && (
        <span className="win-rate" style={{ color: winRateColor(wr) }}>
          {wr}%
        </span>
      )}
      <span className="pslot-pts">{points}pt</span>
    </div>
  )
}
