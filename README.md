# Dynasty Browser

Single-file dynasty analytics app that runs entirely in your browser. Just open `browser.html`—no installs, no API keys.

## Quick start
1. Download this repository as a ZIP.
2. Double-click `browser.html`.

The page will:
- **Ingest** public data: DynastyProcess values-players & values-picks (weekly), FantasyCalc values (daily), Fantasy Football Calculator ADP (daily), and Sleeper league rosters.
- **Normalize** players to DynastyProcess `db_playerids`, attaching position, age and team metadata.
- **Blend** the sources into a composite value:
  
  `V = w1 * DP_value + w2 * FC_value + w3 * f(ADP)`
  
  (defaults: w1=0.5, w2=0.3, w3=0.2, `f(ADP) = 300 - ADP`)
- **Serve** a dashboard with team values, positional scarcity and Monte Carlo win simulations directly in the browser.

All analytics run client-side with caching (24h for FantasyCalc/ADP, weekly for DynastyProcess). Drop the file anywhere and open it to get updated numbers.
