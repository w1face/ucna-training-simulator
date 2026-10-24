## Updating an existing UCNA Worker for the optional Crew field (v1.6)

If public scores are already working, **you do not need new secrets or a new Worker**.

1. Open **Cloudflare Dashboard → Workers & Pages → ucna-leaderboard → Edit code**.
2. Replace the existing Worker source with the updated [`worker/src/index.js`](worker/src/index.js) file from this repository.
3. Click **Deploy**.
4. Open [the Worker health check](https://ucna-leaderboard.w1face.workers.dev/health). Successful deployment returns:
   ```json
   {"status":"ok","writesEnabled":true,"features":["crew"]}
   ```
5. Refresh [the Academy homepage](https://w1face.github.io/ucna-training-simulator/) (Ctrl+F5). The public score form will offer an optional **Crew / ship** field alongside the public callsign.

Crew names are publicly visible and committed into Git history, just like callsigns. Officers who don't have a crew can leave it blank. Existing published entries are unchanged and display **—** in the Crew column. To add crew affiliation to a previously published result, the officer can select and republish their original local attempt (if it still exists in that browser), using the crew field.

Until the Worker is redeployed, the website deliberately blocks **crew-labelled submissions only** to avoid silently discarding affiliation. Publishing without a crew continues to work.

---

# Enable the UCNA Public Leaderboard

UCNA v1.5 includes optional public scores, with local training records still private by default. The site reads public results from `data/leaderboard.json` on GitHub Pages. A Cloudflare Worker writes new results **only after explicit opt-in and Turnstile verification**. Scores are self-reported and are not authoritative qualifications.

## One-time setup (Academy administrator only)

### 1. Cloudflare account and Worker
1. Create or sign into your free Cloudflare account: https://dash.cloudflare.com/
2. In **Workers & Pages**, create a Worker called `ucna-leaderboard`.
3. Deploy the source from [`worker/src/index.js`](worker/src/index.js) using Cloudflare's browser editor or Wrangler. A `worker/wrangler.toml` is supplied for command-line deployment.
4. Note the **public Worker URL**, usually `https://ucna-leaderboard.<account>.workers.dev`. This is not a secret.

### 2. Bot protection
1. In the Cloudflare dashboard choose **Turnstile → Add widget**.
2. Allow the hostname `w1face.github.io` and use Managed mode.
3. Copy the **public sitekey** for the Academy config.
4. Add the **secret key** to the Worker settings (see next step). Never put it in GitHub or in ChatGPT.

Cloudflare checks tokens on the server, including the expected hostname and `ucna-public-score` action. The offline HTML edition cannot submit public scores.

### 3. GitHub restricted token (never paste it into a chat)
1. On GitHub, open https://github.com/settings/personal-access-tokens/new.
2. Make a **fine-grained** personal access token, limiting its repository access to `w1face/ucna-training-simulator` only.
3. Under **Repository permissions**, enable **Contents: Read and write**. Do not grant additional repository permissions.
4. Give the token a limited expiration and plan to rotate it.

In the Cloudflare Worker dashboard open **Settings → Variables and Secrets**, and create **encrypted secrets**:

- `GITHUB_TOKEN`: the limited GitHub token
- `TURNSTILE_SECRET`: the private Cloudflare Turnstile secret

These must be Worker *secrets*, not public JavaScript constants and not checked into GitHub. After secrets are saved, test `<worker-url>/health` — it should report `writesEnabled: true`.

### 4. Enable the Academy
Update the public file [`assets/leaderboard-config.js`](assets/leaderboard-config.js):

```js
window.UCNA_LEADERBOARD_CONFIG = {
  endpoint: "https://ucna-leaderboard.YOUR-ACCOUNT.workers.dev",
  turnstileSiteKey: "YOUR_PUBLIC_SITEKEY"
};
```

Only the Worker URL and the **public** sitekey belong there. GitHub Pages will publish this after committing. Training and offline downloads work normally before setup, but public submission remains disabled.

### 5. Test end to end
1. Open https://w1face.github.io/ucna-training-simulator/ and refresh.
2. Complete an exercise. Verify it appears under Training Records.
3. Under Public Leaderboard, select an eligible attempt and enter a **public callsign** (not a real name).
4. Read and check the explicit publication consent box; complete Turnstile.
5. Confirm that the Worker accepts the submission and updates `data/leaderboard.json` in GitHub.
6. After GitHub Pages deploys, refresh the leaderboard to see the new public score.

## Operational notes

- **No accounts for officers.** Public submission requires a callsign and a fresh human-verification token.
- **No automatic publication.** Results start in local browser storage. Each published entry requires separate consent.
- **No personal identifiers are intentionally collected in the score file**, other than what someone voluntarily puts in their callsign. The Worker uses the visitor IP transiently only when asking Turnstile to validate the challenge; it does not save IP addresses in GitHub.
- **Publication cannot be fully undone.** Entries become part of a public Git history, including older revisions. For privacy, publish nicknames only. Moderator removal from the current leaderboard will not erase public repository history; complete erasure needs special repository-history and external-cache procedures and may not be possible.
- **Rankings are self-reported.** Anyone can alter client-side score payloads, so do not use these rankings to award official qualifications.
- **Leaderboards are separated by exercise and difficulty.** The page shows the best result per callsign in a category, sorting higher accuracy first and faster times as the tie-breaker.
- The Worker stores at most 1,000 current public results. Previous entries remain in Git history.
- GitHub Pages deployment is not instantaneous; an accepted submission can take some time to appear on the live leaderboard.
- The Worker throttles same-callsign submissions via the recent published record (basic moderation), but is not a comprehensive rate limiter. Add Cloudflare rate-limiting/WAF rules if abuse is observed.
- The Github token will expire; rotate it in Cloudflare Worker secrets when needed.

## API

- `GET /health`: configuration status
- `GET /scores`: public scores JSON from GitHub
- `POST /scores`: one opt-in score, with Turnstile token and user consent; only accepts `https://w1face.github.io` Origin and validates the Turnstile hostname

The active entry point for all trainees remains: https://w1face.github.io/ucna-training-simulator/
