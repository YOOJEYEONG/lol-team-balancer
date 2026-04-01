import { useState, useRef } from 'react'
import { getPlayerData } from './api.js'
import { parseInput, balanceTeams } from './utils.js'
import PlayerSlot from './components/PlayerSlot.jsx'
import TeamPreview from './components/TeamPreview.jsx'
import FinalTeam from './components/FinalTeam.jsx'
import './App.css'

const PRO_PLAYERS = [
  'Selfless#KR11',
  'hle pyeonsik#HLE',
  'T1 Guardian#KR3',
  'HLE Gumayusi#0298',
  'suis#kr7',
  'Juhana#IsYou',
  '미 키#0313',
  'Loopy#1813',
  'NinjaKiwi#KoR',
  'KRX Vincenzo#KR4',
].join('\n')

export default function App() {
  const [inputText, setInputText] = useState('')
  const [slots, setSlots] = useState([])
  const [teams, setTeams] = useState(null)
  const [blueTeam, setBlueTeam] = useState(null)
  const [redTeam, setRedTeam] = useState(null)
  const [isFetching, setIsFetching] = useState(false)
  const abortRef = useRef(false)

  const parsedIds = parseInput(inputText)
  const allDone = slots.length > 0 && slots.every(s => s.status === 'done')
  const anyFailed = slots.some(s => s.status === 'error')

  const updateSlot = (idx, patch) =>
    setSlots(prev => prev.map((s, i) => i === idx ? { ...s, ...patch } : s))

  const clearResults = () => {
    setSlots([])
    setTeams(null)
    setBlueTeam(null)
    setRedTeam(null)
  }

  const fetchPlayer = async (riotId, idx) => {
    updateSlot(idx, { status: 'loading', error: null })
    try {
      const data = await getPlayerData(riotId, msg => updateSlot(idx, { progress: msg }))
      updateSlot(idx, { status: 'done', data, progress: '' })
    } catch (e) {
      updateSlot(idx, { status: 'error', error: e.message, progress: '' })
    }
  }

  const handleFetch = async () => {
    if (parsedIds.length !== 10) return
    abortRef.current = false
    setTeams(null)
    setBlueTeam(null)
    setRedTeam(null)

    setSlots(parsedIds.map(riotId => ({ riotId, status: 'idle', data: null, error: null, progress: '' })))
    setIsFetching(true)

    for (let i = 0; i < parsedIds.length; i++) {
      if (abortRef.current) break
      await fetchPlayer(parsedIds[i], i)
    }
    setIsFetching(false)
  }

  const handleRetry = (idx) => fetchPlayer(slots[idx].riotId, idx)

  const handleBalance = () => {
    const players = slots.filter(s => s.status === 'done').map(s => s.data)
    if (players.length !== 10) return
    setTeams(balanceTeams(players))
    setBlueTeam(null)
    setRedTeam(null)
  }

  const handleAssign = () => {
    if (!teams) return
    const swap = Math.random() < 0.5
    setBlueTeam(swap ? teams.team1 : teams.team2)
    setRedTeam(swap ? teams.team2 : teams.team1)
  }

  const handleReset = () => {
    abortRef.current = true
    setInputText('')
    clearResults()
    setIsFetching(false)
  }

  const handleTestData = () => {
    abortRef.current = true
    setInputText(PRO_PLAYERS)
    clearResults()
    setIsFetching(false)
  }

  return (
    <div className="app">
      <header className="header">
        <div className="header-bar top" />
        <div className="header-inner">
          <div className="logo">
            <span className="logo-sword">⚔</span>
            <div>
              <h1 className="logo-title">LOL 팀 밸런서</h1>
              <p className="logo-sub">Riot API 기반 5대5 자동 팀 구성</p>
            </div>
          </div>
        </div>
        <div className="header-bar bottom" />
      </header>

      <main className="main">
        <section className="card">
          <h2 className="card-title">소환사 10명 입력</h2>
          <p className="card-desc">
            한 줄에 한 명 · 형식: <code>닉네임#태그</code> (태그 생략 시 <code>#KR1</code> 자동 적용)
          </p>
          <div className="input-area-wrap">
            <textarea
              className="nickname-textarea"
              placeholder={"Hide on bush#KR1\nFaker#KR1\nZeus#KR1\nDeokdam#KR1\nKeria#KR1\nPlayer6#KR1\nPlayer7#KR1\nPlayer8#KR1\nPlayer9#KR1\nPlayer10#KR1"}
              value={inputText}
              onChange={e => { setInputText(e.target.value); clearResults() }}
              onKeyDown={e => {
                if (e.key === 'Enter' && parsedIds.length >= 10 && !isFetching) {
                  e.preventDefault()
                  handleFetch()
                }
              }}
              rows={11}
              spellCheck={false}
            />
            <div className="input-side">
              <div className="input-count-box">
                <span
                  className="input-count-num"
                  style={{ color: parsedIds.length === 10 ? '#35c466' : parsedIds.length > 0 ? '#c89b3c' : '#556677' }}
                >
                  {parsedIds.length}
                </span>
                <span className="input-count-label">/ 10명</span>
              </div>

              {parsedIds.length > 0 && parsedIds.length < 10 && (
                <p className="input-hint" style={{ color: '#e84057' }}>
                  {10 - parsedIds.length}명 더<br />필요합니다
                </p>
              )}
              {parsedIds.length > 10 && (
                <p className="input-hint" style={{ color: '#e84057' }}>
                  10명 초과<br />(처음 10명만 사용)
                </p>
              )}

              <button
                className="fetch-btn"
                onClick={handleFetch}
                disabled={parsedIds.length < 10 || isFetching}
              >
                {isFetching ? <><span className="spinner" /> 조회 중...</> : '조회하기'}
              </button>
              <button className="test-btn" onClick={handleTestData} disabled={isFetching} title="프로선수 10명으로 채우기">
                테스트
              </button>
              <button className="reset-btn" onClick={handleReset} title="초기화">
                초기화
              </button>
            </div>
          </div>

          {parsedIds.length > 0 && !isFetching && slots.length === 0 && (
            <div className="parsed-preview">
              <span className="parsed-label">인식된 소환사</span>
              <div className="parsed-list">
                {parsedIds.map((id, i) => (
                  <span key={i} className="parsed-tag">{id}</span>
                ))}
              </div>
            </div>
          )}
        </section>

        {slots.length > 0 && (
          <section className="card">
            <div className="section-row">
              <h2 className="card-title">플레이어 정보</h2>
              {anyFailed && !isFetching && (
                <span className="warn-badge">일부 조회 실패</span>
              )}
            </div>
            <div className="player-grid">
              {slots.map((slot, idx) => (
                <PlayerSlot key={slot.riotId + idx} slot={slot} idx={idx} onRetry={() => handleRetry(idx)} />
              ))}
            </div>

            {allDone && !teams && (
              <button className="action-btn green" onClick={handleBalance}>
                ⚖ 팀 나누기
              </button>
            )}
          </section>
        )}

        {teams && !blueTeam && (
          <section className="card">
            <h2 className="card-title center">균형 팀 구성</h2>
            <div className="diff-badge">
              점수 차이 <strong>{teams.diff}pt</strong>
            </div>
            <div className="teams-grid">
              <TeamPreview label="팀 A" players={teams.team1} sum={teams.sum1} />
              <div className="vs-text">VS</div>
              <TeamPreview label="팀 B" players={teams.team2} sum={teams.sum2} />
            </div>
            <button className="action-btn gold" onClick={handleAssign}>
              🎲 팀 선택 (블루/레드 랜덤 배정)
            </button>
          </section>
        )}

        {blueTeam && redTeam && (
          <section className="card final-card">
            <h2 className="card-title center">최종 팀 배정</h2>
            <div className="final-grid">
              <FinalTeam side="blue" label="🔵 블루팀" players={blueTeam} />
              <div className="final-vs">VS</div>
              <FinalTeam side="red" label="🔴 레드팀" players={redTeam} />
            </div>
            <div className="final-actions">
              <button className="action-btn outline" onClick={handleAssign}>🔄 다시 배정</button>
              <button className="action-btn outline" onClick={handleBalance}>⚖ 팀 재구성</button>
            </div>
          </section>
        )}
      </main>

      <footer className="footer">
        이 사이트는 Riot Games와 관련이 없으며, Riot Games의 공식 제품이 아닙니다.
      </footer>
    </div>
  )
}
