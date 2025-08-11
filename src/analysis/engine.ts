// Minimal CSV parser (robust to quotes)
export function parseCSV(text: string): Record<string,string>[] {
  if (!text) return []; const lines = text.replace(/^\uFEFF/,'').split(/\r?\n/);
  let head: string[]|null = null; const rows: Record<string,string>[] = [];
  for (const line of lines) {
    if (!line.trim()) continue;
    const cells:string[] = []; let c=""; let q=false;
    for (let i=0;i<line.length;i++){
      const ch=line[i];
      if (ch === '"') { if (q && line[i+1]=='"'){c+='"';i++;} else q=!q; }
      else if (ch === ',' && !q) { cells.push(c); c=""; }
      else c+=ch;
    } cells.push(c);
    if (!head) { head=cells; continue; }
    const row: Record<string,string> = {}; head.forEach((h,i)=> row[h] = (cells[i] ?? "").trim());
    rows.push(row);
  }
  return rows;
}

export type ValueMaps = { bySleeper1QB: Map<string, number>, bySleeper2QB: Map<string, number> };

export function joinValuesByIDs(idsCSV: string, valuesCSV: string): ValueMaps {
  const ids = parseCSV(idsCSV);
  const vals = parseCSV(valuesCSV);
  // locate columns
  const sidCol = Object.keys(ids[0]||{}).find(c=>/sleeper_id/i.test(c)) || "sleeper_id";
  const fpColI = Object.keys(ids[0]||{}).find(c=>/(fp_|fantasypros).*id/i.test(c)) || "fantasypros_id";
  const fpColV = Object.keys(vals[0]||{}).find(c=>/^fp_id$/i.test(c)) || "fp_id";
  const v1Col  = Object.keys(vals[0]||{}).find(c=>/value_1qb/i.test(c)) || "value_1qb";
  const v2Col  = Object.keys(vals[0]||{}).find(c=>/value_2qb/i.test(c)) || "value_2qb";

  const fpBySleeper = new Map(ids.map(r=>[String(r[sidCol]||"").trim(), String(r[fpColI]||"").trim()]));
  const values = new Map(vals.map(r=>[String(r[fpColV]||"").trim(),
    { v1: +String(r[v1Col]||"0").replace(/[^0-9.\-]/g,""), v2: +String(r[v2Col]||"0").replace(/[^0-9.\-]/g,"") }]));

  const bySleeper1QB = new Map<string,number>(), bySleeper2QB = new Map<string,number>();
  for (const [sid, fpid] of fpBySleeper.entries()) {
    const v = values.get(fpid); if (!v) continue;
    if (Number.isFinite(v.v1)) bySleeper1QB.set(sid, v.v1);
    if (Number.isFinite(v.v2)) bySleeper2QB.set(sid, v.v2);
  }
  return { bySleeper1QB, bySleeper2QB };
}

/** Positional Scarcity Index (PSI) and Replacement Curves */
export function scarcityByPosition(playersDir: Record<string, any>, valueForPid: (pid: string)=>number) {
  const buckets: Record<string, number[]> = {};
  for (const pid of Object.keys(playersDir)) {
    const p = playersDir[pid]; const pos = p?.position || "UNK";
    const v = valueForPid(pid); if (!v) continue;
    (buckets[pos] ||= []).push(v);
  }
  const out: Record<string,{median:number; replacement:number; scarcity:number}> = {};
  for (const [pos, arr] of Object.entries(buckets)) {
    arr.sort((a,b)=>b-a);
    const median = arr.length ? arr[Math.floor(arr.length*0.5)] : 0;
    const replacement = arr.length ? arr[Math.floor(arr.length*0.67)] : 0; // ~WR3/RB3/TE2/QB2 tier
    out[pos] = { median, replacement, scarcity: (median - replacement) };
  }
  return out;
}

/** Monte Carlo: simulate season wins using team values as strength proxy */
export function simulateSeasonWins(teamValues: number[], weeks: number, iters=5000) {
  // model: score ~ N(teamValue, sigma), sigma from league spread
  const mu = teamValues; const n = mu.length; const sigma = Math.max(50, Math.std?.(teamValues) ?? 100);
  const wins = new Array(n).fill(0);
  function rnd() { // Box–Muller
    let u=0,v=0; while(!u)u=Math.random(); while(!v)v=Math.random();
    return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v);
  }
  for (let k=0;k<iters;k++){
    const w = new Array(n).fill(0);
    for (let week=0; week<weeks; week++){
      for (let a=0;a<n;a++){
        for (let b=a+1;b<n;b++){
          const sa = mu[a] + sigma*rnd();
          const sb = mu[b] + sigma*rnd();
          if (sa>sb) w[a]++; else w[b]++;
        }
      }
    }
    for (let i=0;i<n;i++) wins[i]+=w[i];
  }
  return wins.map(x=>x/iters);
}

/** Trade package optimizer: greedy by needs + value delta */
export function proposeTrades(
  rosters: {team:string; positions:Record<string,number>; value:number; players:string[]}[],
  shortage: Record<string, string[]>, // team -> needed positions
  valueForName: (name:string)=>number,
  maxPackagesPerTeam=3
){
  // heuristic: for team T needing POS, find another team with surplus POS, propose near-equal value swaps
  const proposals: {from:string; to:string; give:string[]; get:string[]; delta:number}[] = [];
  for (const t of rosters) {
    for (const need of (shortage[t.team]||[])) {
      const donors = rosters.filter(o => o!==t && (o.positions[need]||0) > (t.positions[need]||0)+1);
      donors.sort((a,b)=> (b.positions[need]-a.positions[need]));
      for (const d of donors.slice(0,3)) {
        // select top surplus piece from d and a fair return from t
        const donorBest = d.players.filter(n=>valueForName(n)>0).sort((a,b)=>valueForName(b)-valueForName(a))[0];
        const wantValue = valueForName(donorBest)||0;
        const give = t.players.filter(n=>valueForName(n)>0).sort((a,b)=>Math.abs(valueForName(a)-wantValue)-Math.abs(valueForName(b)-wantValue))[0];
        const delta = (valueForName(donorBest)||0) - (valueForName(give)||0);
        proposals.push({ from:d.team, to:t.team, give:[donorBest], get:[give], delta });
        if (proposals.length>=maxPackagesPerTeam) break;
      }
    }
  }
  // rank by absolute closeness to zero (fairness)
  return proposals.sort((a,b)=>Math.abs(a.delta)-Math.abs(b.delta)).slice(0, 20);
}
