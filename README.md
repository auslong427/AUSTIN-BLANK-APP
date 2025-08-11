# Dynasty Desktop

Ready-to-build Tauri + React (Vite + TS) app with baked-in dynasty analytics.

## Quick start (no build tools)

1. Download this repository as a ZIP.
2. Double‑click `browser.html` and your default browser will load the app.

The browser version fetches Sleeper and DynastyProcess data directly and runs all analytics on the client—no installs or API keys required.

## Build the desktop `.exe`

1. **Fork this repo**.
2. In GitHub, go to **Actions → build-tauri → Run workflow**.
3. After it finishes, download the `dynasty-desktop` artifact. It contains the Windows installer and portable `.exe`.

All external data (Sleeper, DynastyProcess) is public and requires no additional configuration.
