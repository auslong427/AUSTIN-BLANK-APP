// Tauri HTTP (scoped; configured in tauri.conf.json)
import { fetch as tfetch } from "@tauri-apps/plugin-http";

export async function getJSON<T>(url: string): Promise<T> {
  const res = await tfetch(url, { method: "GET", headers: { Accept: "application/json" } });
  if (res.status >= 400) throw new Error(`${url} -> ${res.status}`);
  return res.json() as Promise<T>;
}
export async function getText(url: string): Promise<string> {
  const res = await tfetch(url, { method: "GET" });
  if (res.status >= 400) throw new Error(`${url} -> ${res.status}`);
  return res.text();
}

/** Sleeper API (free, read-only) */
const SLP = "https://api.sleeper.app/v1"; // leagues, users, rosters, transactions
export const sleeper = {
  league: (id: string) => getJSON<any>(`${SLP}/league/${id}`),
  users: (id: string)  => getJSON<any[]>(`${SLP}/league/${id}/users`),
  rosters: (id: string)=> getJSON<any[]>(`${SLP}/league/${id}/rosters`),
  transactionsByWeek: (id: string, week: number) => getJSON<any[]>(`${SLP}/league/${id}/transactions/${week}`),
  playersDir: () => getJSON<Record<string, any>>(`https://api.sleeper.app/v1/players/nfl`),
};

/** DynastyProcess open data (weekly-updated) */
const GH = "https://raw.githubusercontent.com/dynastyprocess/data/gh-pages/files";
export const dynastyProcess = {
  playerIdsCSV:    () => getText(`${GH}/db_playerids.csv`),   // sleeper_id ↔ fantasypros_id, etc.
  valuesPlayersCSV:()=> getText(`${GH}/values-players.csv`),  // value_1qb, value_2qb by fp_id
  valuesPicksCSV:  () => getText(`${GH}/values-picks.csv`)    // rookie/future pick values
};
