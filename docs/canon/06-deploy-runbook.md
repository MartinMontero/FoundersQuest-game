# Founder's Quest — Cloudflare Deployment Runbook

Fifteen minutes end to end. Exact steps, commands, and the gotchas that cost time or money.

**Why there is no secret step:** the game is BYOK (decision log, 2026-07-08). Every player brings their own Anthropic API key, entered in-app, stored on their device, sent only browser→`api.anthropic.com`. No server-side key exists — owner, dev, or prod — so production is a pure static site: no Pages Function, no secret binding, no WAF rule guarding a shared wallet.

## 0 · Prereqs (2 min)

Node 20+ (22 preferred), git, a Cloudflare account, this repo. No `.dev.vars`, no secrets: there is nothing server-side to configure.

## 1 · Verify locally before anything touches the cloud (4 min)

```bash
npm install
npm run build                      # must end: ✓ built
npm run preview                    # serves the built app locally
```

Open the printed localhost URL and play as player zero: answer a question → refresh (persists via localStorage) → enter **your own** Anthropic key in-app, exactly as any player would → convene the Council (a real reading = the BYOK path works). Your key goes in the UI, never in a file — and BYOK means the Council works identically in plain `npm run dev`, so day-to-day dev needs no special setup.

Nuance: `npm run preview` serves the **built** output — rebuild to see changes. Day-to-day dev stays on `npm run dev`.

## 2 · Push to GitHub (2 min)

```bash
git init && git add -A && git commit -m "Founder's Quest v3 standalone"
git remote add origin git@github.com:YOUR-ORG/founders-quest.git
git push -u origin main
```

Pages git integration supports GitHub and GitLab only. No git host? See the direct-upload alternative in §6.

## 3 · Create the Pages project (3 min)

Dashboard → **Workers & Pages → Create → Pages → Connect to Git** → pick the repo.

Build settings:
- Framework preset: **Vite**
- Build command: `npm run build`
- Build output directory: `dist`
- Root directory: `/`

Add one build environment variable before saving: `NODE_VERSION` = `22` (Pages' default Node can lag; pin it).

Save → first deploy runs. Pure static — there is no `functions/` directory and nothing else to configure.

## 4 · Custom domain (2 min)

Project → **Custom domains → Set up a domain** → enter it.
- DNS already on Cloudflare: records created automatically, live in ~1 min.
- DNS elsewhere: add the CNAME it shows you.

Apex domains work (Cloudflare flattens the CNAME). The `*.pages.dev` URL stays live alongside the custom domain — harmless, but know it exists.

## 5 · Smoke test on the real domain (2 min)

1. Answer a Stage 1 question → reload → it persists.
2. Enter a key → convene the Council → reading returns → a follow-up works → remove the key via its visible control.
3. Export the Brief → plain browser download, no interstitial.
4. `curl -I https://yourdomain.tld` → confirm `X-Frame-Options: DENY` and friends (`public/_headers` is live), and that the CSP `connect-src` allows exactly `'self'` and `https://api.anthropic.com` — nothing else.

## 6 · Operating it

- **Deploys:** every push to `main` → production; every other branch/PR → automatic preview URL. Previews work fully — BYOK means there is no production-scoped secret for previews to miss.
- **Rollback:** Deployments → any prior build → Rollback. Instant, no rebuild.
- **Logs:** there is no server component in the Council path, so there is nothing that *could* log a journal or a key. Keep it that way.
- **Costs:** static hosting free and unmetered. Council calls bill each player's own Anthropic key — your bill is zero, and a scripted abuser can spend nobody's money but their own.
- **No-git alternative:** `npm run build && npx wrangler pages deploy dist --project-name founders-quest` — direct upload of the static output. (`npx wrangler login` first.)

## 7 · The 30-day exit plan (already true — written down on purpose)

`dist/` is pure static, deployable to any host in minutes — there is no function to port, no env var to carry, nothing server-side at all. Founder data and player keys never touch the host. The plank can snap; the bridge survives.
