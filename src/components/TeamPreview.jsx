import { TIER_INFO, LANE_INFO } from '../api.js'

export default function TeamPreview({ label, players, sum }) {
  return (
    <div className="tprev">
      <div className="tprev-header">
        <span className="tprev-label">{label}</span>
        <span className="tprev-sum">{sum}pt</span>
      </div>
      <ul className="tprev-list">
        {players.map(p => {
          const ti = TIER_INFO[p.tier] || TIER_INFO.UNRANKED
          const li = LANE_INFO[p.lane] || LANE_INFO.UNKNOWN
          return (
            <li key={p.id} className="tprev-item">
              <span className="tprev-lane" style={{ color: li.color }}>{li.short}</span>
              <span className="tprev-name">{p.nickname}</span>
              <span className="tprev-tier" style={{ color: ti.color }}>
                {ti.nameKo}{p.rank ? ` ${p.rank}` : ''}
              </span>
              <span className="tprev-pts">{p.points}pt</span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
