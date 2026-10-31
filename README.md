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


## Academy versioning policy

The online Academy uses **MAJOR.MINOR.PATCH** numbers (for example, `1.9.0`):

- **PATCH** (`1.9.1`, `1.9.2`): small visual, layout, wording, accessibility, or bug fixes without changes to the training experience or records format.
- **MINOR** (`1.10.0`): a new trainer, substantial capability, or meaningful new Academy feature that remains compatible with existing records.
- **MAJOR** (`2.0.0`): a significant incompatible redesign or data/protocol change requiring migration.

Current Academy release is **1.9.0**. The next small improvement should become **1.9.1**, not `1.10`. Individual trainers retain their own internal version numbers, which are separate from the Academy release number.

## Release 1.9.2 — Readable typography across the Academy

- **Exo 2**, in regular mixed case, is the standard typeface for Academy navigation, explanations, tutorials, descriptions, training selection screens and feedback.
- The condensed **Bebas Neue / EmptyEpsilon-style font and uppercase presentation** are reserved for the actual scanner, signature display, icon-test, hacking-grid and tractor-beam controls and instrument readouts.
- Normal explanatory material within the console, such as hints and operating notes, stays in Exo 2.
- Exo 2 is served via Google Fonts on the online edition, with a local system-font fallback when unavailable. The legacy v1.4 offline download is unchanged.
- This is a visual-only patch; exercise mechanics, local records and public leaderboard data are unchanged.

## Release 1.9.1 — Mobile welcome disclosure

- On screens 650px wide or narrower, **Welcome aboard, Officer.** starts collapsed and has a small chevron button to expand and collapse the full original welcome message.
- Desktop and wider screens continue to display the welcome text in full, without a disclosure button.
- The button has an accessible expand/collapse label and state, keyboard support, and reduced-motion handling; without JavaScript the text remains readable.
- All modules, published scores, training records, and offline downloads remain unchanged.

## Release 1.9.0 — Tractor Beam distraction-free navigation

- Inside Tractor Beam training, scrolling down retracts the Academy's otherwise fixed 58px launcher bar so the simulator gains the entire available height.
- A small, accessible **← Academy** button remains available for returning home while the full launcher bar is hidden.
- Scrolling back near the top or returning to the Tractor Beam exercise menu restores the original launcher bar.
- This behaviour is restricted to the online Tractor Beam simulator; all other trainers, score records, and the offline download remain unchanged.

## Release 1.8 — Tractor Beam station layout and mobile guidance

- **Tractor Beam v0.3.2:** Exercise setup (Basic target selector or 360 Maze start panel) now spans the full width **above** the console.
- On desktop, tablet and narrow portrait phones, **Range / Direction / Arc sliders stay to the left of the tactical radar** to match the bridge station.
- On phones, the radar becomes compact and stays visible to the right while scrolling through the controls; controls are resized for touch without changing tractor-beam physics.
- The Academy main assignments page and Tractor Beam course selection now advise: “If using your personal communications device for training, portrait mode is strongly encouraged.”
- Score storage, public leaderboard, existing training courses, and the older separately-labelled v1.4 Offline Core have not been altered.

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
