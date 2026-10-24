# UCNA Training Simulator

A browser-based and offline-capable Academy for the Bridge Command / EmptyEpsilon community.

**Online Academy:** https://w1face.github.io/ucna-training-simulator/

**Offline training:** Download v1.4 on the Academy homepage. The offline edition keeps training records locally and does not publish to the public leaderboard.

## Academy modules
- Radar Scanning
- Radar Icon Recognition
- Radar Signature Analysis
- Hacking & System Disruption

## Public records (v1.6)
The homepage now includes a **voluntary public leaderboard**. Local scores are never uploaded automatically.

Public score publishing uses a configured Cloudflare Worker with Turnstile. The v1.6 site also supports an **optional public crew / ship affiliation**. To enable crew publishing, the Cloudflare Worker must be redeployed with the new source. Follow [the existing-Worker upgrade and administrator guide](LEADERBOARD_SETUP.md). Credentials must remain secrets in Cloudflare, never in this repository.

Public entries are self-reported, sorted separately by training exercise. Callsigns, optional crew names, and results are visible to all, including GitHub's version history. Existing entries without a crew remain intact.

## Architecture
- `index.html` — public online Academy launcher
- `trainers/` — four modular exercise HTMLs
- `assets/icons/` — monochrome Academy navigation icons
- `assets/leaderboard.js` — opt-in leaderboard user interface
- `assets/leaderboard-config.js` — public Worker URL and Turnstile **sitekey**, with no private credentials
- `worker/src/index.js` — Cloudflare Worker server, with server-side Turnstile verification
- `data/leaderboard.json` — current published, non-authoritative scores
- `downloads/` — self-contained offline Academy

Training records are stored per browser using localStorage. Officer data is not synchronised across devices; use the CSV/JSON export for personal backups.

## Rights and attribution
Unofficial, non-commercial fan project; not endorsed, sponsored or affiliated with the Bridge Command or EmptyEpsilon developers. Names, insignia and related intellectual property belong to their respective rights holders.
