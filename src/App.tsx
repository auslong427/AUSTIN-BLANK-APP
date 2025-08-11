import "./app.css";
import React, { useEffect, useMemo, useState } from "react";
import { sleeper, dynastyProcess } from "./data/sources";
import { parseCSV, joinValuesByIDs, scarcityByPosition, simulateSeasonWins } from "./analysis/engine";

const fmt = new Intl.NumberFormat();

export default function App(){
  // League selection
  const [leagueId, setLeagueId] = useState("1221258906357997568");
  const [league, setLeague] = useState<any>(null);
  const [users, setUsers]   = useState<any[]>([]);
  const [rosters, setRosters] = useState<any[]>([]);
  const [players, setPlayers] = useState<Record<string,any>|null>(null);

  // Values
  const [mode, setMode] = useState<"1QB"|"2QB">("1QB");
  const [val1, setVal1] = useState<Map<string,number>>(new Map());
  const [val2, setVal2] = useState<Map<string,number>>(new Map());

  // Transactions
  const [tx, setTx] = useState<any[]>([]);
  const [season, setSeason] = useState<string>("");

  // Errors
  const [err, setErr] = useState<string>("");

  useEffect(()=>{ void loadAll(); },[]);

  async function loadAll(){
    setErr("");
    try {
      const lg = await sleeper.league(leagueId);
      setLeague(lg);
      const [us, rs] = await Promise.all([sleeper.users(leagueId), sleeper.rosters(leagueId)]);
      setUsers(us); setRosters(rs);

      // SF auto-detect
      const rp: string[] = lg?.roster_positions || [];
      const qbSlots = rp.filter(x=>x==='QB').length;
      setMode(rp.includes('SUPER_FLEX') || qbSlots >= 2 ? '2QB':'1QB');

      // DP values
      const [idsCSV, valsCSV] = await Promise.all([dynastyProcess.playerIdsCSV(), dynastyProcess.valuesPlayersCSV()]);
      const { bySleeper1QB, bySleeper2QB } = joinValuesByIDs(idsCSV, valsCSV);
      setVal1(bySleeper1QB); setVal2(bySleeper2QB);

      // Players (subset) – only what we’ll reference
      const dir = await sleeper.playersDir();
      const need = new Set<string>();
      for (const r of rs) {
        for (const pid of (r.players||[])) need.add(String(pid));
        for (const pid of (r.starters||[])) need.add(String(pid));
        for (const pid of (r.reserve||[])) need.add(String(pid));
      }
      const sub: Record<string,any> = {}; for (const pid of need) if (dir[pid]) sub[pid]=dir[pid];
      setPlayers(sub);

      // Transactions (dedup + newest-first)
      const all: any[] = [];
      for (let w=1; w<=18; w++) {
        try { all.push(...await sleeper.transactionsByWeek(leagueId, w)); } catch {}
      }
      const seen = new Set(); const uniq: any[] = [];
      for (const t of all.filter(t=>t?.type==='trade')) {
        const id = t.transaction_id || `${t.created}-${(t.roster_ids||[]).join('-')}`;
        if (seen.has(id)) continue; seen.add(id); uniq.push(t);
      }
      uniq.sort((a,b)=> (b.created||0)-(a.created||0));
      setTx(uniq);
      setSeason(lg?.season||"");
    } catch (e:any) {
      setErr(e?.message || String(e));
    }
  }

  function val(pid: string){ return (mode==='2QB' ? val2 : val1).get(String(pid)) || 0; }

  // Build team table
  const table = useMemo(()=>{
    if (!rosters?.length) return [];
    const byUser = new Map(users.map(u=>[u.user_id, u.display_name || u.username || u.user_id]));
    return rosters.map(r=>{
      const st = r.settings || {};
      const wins = Number(st.wins ?? 0);
      const losses = Number(st.losses ?? 0);
      const pf = Number(st.fpts ?? 0) + Number(st.fpts_decimal ?? 0)/100;
      let value = 0; for (const pid of (r.players||[])) value += val(String(pid));
      return { team: byUser.get(r.owner_id) || r.owner_id, wins, record: `${wins}-${losses}`, pf, value, roster: r };
    }).sort((a,b)=> (b.wins - a.wins) || (b.pf - a.pf));
  }, [users, rosters, val1, val2, mode]);

  // Advanced: scarcity + sims
  const scarcity = useMemo(()=> players ? scarcityByPosition(players, (pid)=>val(String(pid))) : {}, [players, val1, val2, mode]);
  const simWins = useMemo(()=>{
    if (!table.length) return [];
    const arr = table.map(r=>r.value);
    return simulateSeasonWins(arr, 13, 4000); // 13 weeks, 4k iters
  }, [table]);

  return (
    <div className="container">
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
        <div>
          <div className="h1">Dynasty Desktop</div>
          <div className="muted">Sleeper • DynastyProcess • Apple‑style UI</div>
        </div>
        <div style={{display:'flex',gap:8}}>
          <button className="btn primary" onClick={loadAll}>Refresh</button>
          <ModePill mode={mode} setMode={setMode} />
        </div>
      </div>

      {err && <div className="card" style={{borderColor:'#ff7b7b'}}>Error: {err}</div>}

      <div className="grid grid-3">
        <div className="card">
          <div className="muted" style={{fontSize:12}}>Active League</div>
          <div style={{fontWeight:600}}>{league?.name || '—'}</div>
          <div className="muted" style={{fontSize:12}}>{leagueId} • Season {season||'—'}</div>
        </div>

        <div className="card">
          <div style={{fontWeight:600, marginBottom:6}}>Scarcity Snapshot</div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8}}>
            {Object.entries(scarcity).map(([pos, s])=> (
              <div key={pos} className="card" style={{padding:'8px'}}>
                <div style={{fontWeight:600}}>{pos}</div>
                <div className="muted" style={{fontSize:12}}>Median: {Math.round(s.median)}</div>
                <div className="muted" style={{fontSize:12}}>Replacement: {Math.round(s.replacement)}</div>
                <div style={{marginTop:4}}>PSI: <b>{Math.round(s.scarcity)}</b></div>
              </div>
            ))}
            {!Object.keys(scarcity).length && <div className="muted">Load values to populate.</div>}
          </div>
        </div>

        <div className="card">
          <div style={{fontWeight:600, marginBottom:6}}>Simulated Wins (avg)</div>
          {simWins.length ? (
            <div style={{display:'grid',gap:6}}>
              {table.map((r,i)=>(
                <div key={r.team} style={{display:'flex',justifyContent:'space-between'}}>
                  <div>{r.team}</div>
                  <div className="muted">{simWins[i].toFixed(1)}</div>
                </div>
              ))}
            </div>
          ) : <div className="muted">Add values to run simulation.</div>}
        </div>
      </div>

      {/* Standings */}
      <div className="card" style={{marginTop:12}}>
        <div style={{fontWeight:600, marginBottom:6}}>Standings & Value</div>
        <div style={{overflow:'auto'}}>
          <table className="table">
            <thead><tr className="tr">
              {['Team','Record','PF','Team Value','Value Rank'].map(h=> <th key={h} className="th">{h}</th>)}
            </tr></thead>
            <tbody>
              {table.map((r,idx)=>{
                const vRank = table.slice().sort((a,b)=>b.value-a.value).findIndex(x=>x.team===r.team)+1;
                return (
                  <tr key={r.team} className="tr">
                    <td className="td">{r.team}</td>
                    <td className="td">{r.record}</td>
                    <td className="td">{r.pf.toFixed(2)}</td>
                    <td className="td">{fmt.format(Math.round(r.value))}</td>
                    <td className="td">{r.value ? vRank : '—'}</td>
                  </tr>
                );
              })}
              {!table.length && <tr><td className="td muted" colSpan={5}>No data yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {/* Transactions (Sleeper-style breakdown would go here – omitted for brevity) */}

    </div>
  );
}

function ModePill({mode, setMode}:{mode:"1QB"|"2QB", setMode:(m:"1QB"|"2QB")=>void}){
  return (
    <div style={{display:'inline-flex',border:'1px solid var(--border)',borderRadius:999,overflow:'hidden'}}>
      <button className="btn" style={{border:'none',background: mode==='1QB'?'white':'transparent', color: mode==='1QB'?'black':'var(--muted)'}} onClick={()=>setMode("1QB")}>1QB</button>
      <button className="btn" style={{border:'none',background: mode==='2QB'?'white':'transparent', color: mode==='2QB'?'black':'var(--muted)'}} onClick={()=>setMode("2QB")}>SF</button>
    </div>
  );
}
