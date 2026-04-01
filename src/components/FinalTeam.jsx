import { TIER_INFO, LANE_INFO } from '../api.js'
import { winRateColor } from '../utils.js'

export default function FinalTeam({ side, label, players }) {
  const sum = players.reduce((s, p) => s + p.points, 0)
  return (
    <div className={`fteam ${side}`}>
      <div className="fteam-header">
        <h3 className="fteam-label">{label}</h3>
        <span className="fteam-sum">{sum}pt</span>
      </div>
      <ul className="fteam-list">
        {players.map(p => {
          const ti = TIER_INFO[p.tier] || TIER_INFO.UNRANKED
          const li = LANE_INFO[p.lane] || LANE_INFO.UNKNOWN
          const total = p.wins + p.losses
          const wr = total > 0 ? Math.round((p.wins / total) * 100) : null
          return (
            <li key={p.id} className="fteam-item">
              <span
                className="fteam-pos"
                style={{ color: li.color, borderColor: li.color + '55', background: li.color + '18' }}
              >
                {li.short}
              </span>
              <div className="fteam-info">
                <span className="fteam-name">{p.nickname}</span>
                <span className="fteam-tag">#{p.tagLine}</span>
              </div>
              <div className="fteam-right">
                <span
                  className="fteam-tier"
                  style={{ color: ti.color, background: ti.bg, borderColor: ti.color + '44' }}
                >
                  {ti.nameKo}{p.rank ? ` ${p.rank}` : ''}
                  {p.tier !== 'UNRANKED' && <> {p.lp}LP</>}
                </span>
                {wr !== null && (
                  <span className="fteam-wr" style={{ color: winRateColor(wr) }}>
                    {wr}%
                  </span>
                )}
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
