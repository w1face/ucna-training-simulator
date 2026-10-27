# UCN Academy Training Simulator

A browser-based and offline-capable Academy for the Bridge Command / EmptyEpsilon community.

**Online Academy:** https://w1face.github.io/ucna-training-simulator/

**Offline training:** The older v1.4 *Offline Core* remains available for four original exercises. v1.7 mobile/UX changes and the Tractor Beam trainer are currently online-only. Offline training records never publish automatically.

## Academy modules
- Radar Scanning
- Radar Icon Identification
- Radar Signature Analysis
- Hacking
- Tractor Beam


## Release 1.7 — Lt Doug review updates

- Simplified the masthead to **United Confederation Navy Academy / Training Simulator**; standardised module titles.
- Mobile homepage now suppresses lengthy welcome paragraphs while preserving them on larger screens.
- Hacking navigation reset now re-enables the Breach button and difficulty selector after leaving an active grid.
- Tractor Beam mobile layout pins a compact tactical radar while the officer adjusts controls.
- Icon Identification flashcards now resemble a dark tactical display with a contrasting white border, explicit navigation/marking button pairs, and a true *Recognised on first review* counter.
- Signature Analysis now teaches **Biological / Thermal** wording, names physical bands alongside colours, clarifies non-zero quiet baselines, distinguishes its non-scored Warp Signal Lab, and makes rare jump scenarios uncommon.
- HUD and mission symbology retain their traditional treatment; instructional copy received targeted legibility improvements.

**Not yet incorporated:** A separate Helm trainer, a standalone Warp Signature training module, general power-distribution exercises, and the suggested live-game EMP colour check. Those require separate design/source verification rather than a hasty cosmetic edit.

**Compatibility:** Existing local records, public score schema, and Worker configuration remain unchanged. The public leaderboard is optional. The v1.4 offline core is a separate legacy download and does not contain these v1.7 changes.

## Public records (v1.6)
The homepage now includes a **voluntary public leaderboard**. Local scores are never uploaded automatically.

Public score publishing uses a configured Cloudflare Worker with Turnstile. The v1.6 site also supports an **optional public crew / ship affiliation**. To enable crew publishing, the Cloudflare Worker must be redeployed with the new source. Follow [the existing-Worker upgrade and administrator guide](LEADERBOARD_SETUP.md). Credentials must remain secrets in Cloudflare, never in this repository.

Public entries are self-reported, sorted separately by training exercise. Callsigns, optional crew names, and results are visible to all, including GitHub's version history. Existing entries without a crew remain intact.

## Architecture
- `index.html` — public online Academy launcher
- `trainers/` — five modular exercise HTMLs
- `assets/icons/` — monochrome Academy navigation icons
- `assets/leaderboard.js` — opt-in leaderboard user interface
- `assets/leaderboard-config.js` — public Worker URL and Turnstile **sitekey**, with no private credentials
- `worker/src/index.js` — Cloudflare Worker server, with server-side Turnstile verification
- `data/leaderboard.json` — current published, non-authoritative scores
- `downloads/` — self-contained historical offline core bundles (separate from current online release)

Training records are stored per browser using localStorage. Officer data is not synchronised across devices; use the CSV/JSON export for personal backups.

## Rights and attribution
Unofficial, non-commercial fan project; not endorsed, sponsored or affiliated with the Bridge Command or EmptyEpsilon developers. Names, insignia and related intellectual property belong to their respective rights holders.
