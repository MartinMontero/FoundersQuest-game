# Founder's Quest — Cloudflare Deployment Runbook

Twenty minutes end to end. Exact steps, commands, and the gotchas that cost time or money.

## 0 · Prereqs (2 min)

Node 20+ (22 preferred), git, a Cloudflare account, this repo. One fix first:

```bash
echo ".dev.vars" >> .gitignore
```

`.dev.vars` holds your API key locally; it must never reach git.

## 1 · Verify locally before anything touches the cloud (5 min)

```bash
npm install
npm run build                      # must end: ✓ built
echo 'ANTHROPIC_API_KEY=sk-ant-your-key' > .dev.vars
npx wrangler pages dev dist        # serves the built app + /api/council locally
```

Open the printed localhost URL. Test: answer a question → refresh (persists via localStorage) → convene the Council (a real reading = the function works). For UI-only iteration, plain `npm run dev` is faster — the Council shows "not in session," which the app handles gracefully.

Nuance: `wrangler pages dev dist` serves the **built** output — rebuild to see changes. Day-to-day dev stays on `npm run dev`.

## 2 · Push to GitHub (2 min)

```bash
git init && git add -A && git commit -m "Founder's Quest v3 standalone"
git remote add origin git@github.com:YOUR-ORG/founders-quest.git
git push -u origin main
```

Pages git integration supports GitHub and GitLab only. No git host? See the direct-upload alternative in §9.

## 3 · Create the Pages project (3 min)

Dashboard → **Workers & Pages → Create → Pages → Connect to Git** → pick the repo.

Build settings:
- Framework preset: **Vite**
- Build command: `npm run build`
- Build output directory: `dist`
- Root directory: `/`

Add one build environment variable before saving: `NODE_VERSION` = `22` (Pages' default Node can lag; pin it).

Save → first deploy runs. `functions/` is auto-detected: `functions/api/council.js` becomes `POST /api/council` on the same origin. Nothing else to configure.

## 4 · Set the secret (1 min)

Project → **Settings → Variables and Secrets**:
- `ANTHROPIC_API_KEY` → type **Secret** → environment **Production only**
- `COUNCIL_MODEL` → optional plain variable; the function defaults to `claude-fable-5`

Money nuance: scoping the key to Production means preview deployments can't spend it. Want the Council on previews? Use a second key with a low spend limit, scoped to Preview.

Redeploy once after adding the secret (Deployments → Retry latest) — secrets bind at deploy time.

## 5 · Verify the function on the live URL (1 min)

```bash
curl -s https://YOUR-PROJECT.pages.dev/api/council \
  -H 'content-type: application/json' \
  -d '{"system":"You are a test. Reply with one word.","messages":[{"role":"user","content":"Say ok."}]}'
```

Expect `{"text":"..."}`. `{"error":"council-unconfigured"}` = secret not bound — redeploy. `502` = key wrong or out of credit.

## 6 · Custom domain (2 min)

Project → **Custom domains → Set up a domain** → enter it.
- DNS already on Cloudflare: records created automatically, live in ~1 min.
- DNS elsewhere: add the CNAME it shows you.

Apex domains work (Cloudflare flattens the CNAME). The `*.pages.dev` URL stays live alongside the custom domain — harmless, but know it exists.

## 7 · Rate-limit the Council before the URL is public (2 min)

Zone (your domain) → **Security → WAF → Rate limiting rules → Create**:
- If: URI Path equals `/api/council`
- Rate: 10 requests / 10 minutes per IP → Block for 10 minutes

The free plan includes exactly one rate-limiting rule — this is what it's for. Every Council call bills your Anthropic key (~a journal in, ~1k tokens out); this rule caps the blast radius of a scripted abuser.

## 8 · Smoke test on the real domain (2 min)

1. Answer a Stage 1 question → reload → it persists.
2. Convene the Council → reading returns → a follow-up works.
3. Export the Brief → plain browser download, no interstitial.
4. `curl -I https://yourdomain.tld` → confirm `X-Frame-Options: DENY` and friends (`public/_headers` is live).

## 9 · Operating it

- **Deploys:** every push to `main` → production; every other branch/PR → automatic preview URL.
- **Rollback:** Deployments → any prior build → Rollback. Instant, no rebuild.
- **Logs:** `npx wrangler pages deployment tail --project-name YOUR-PROJECT` — invocations and errors only; the function logs no journal content by design. Keep it that way.
- **Costs:** static hosting free and unmetered; Functions free to 100k requests/day; the only real bill is Anthropic, per reading.
- **No-git alternative:** `npm run build && npx wrangler pages deploy dist --project-name founders-quest` — direct upload; `functions/` is picked up from the working directory. (`npx wrangler login` first.)

## 10 · The 30-day exit plan (already true — written down on purpose)

`dist/` is pure static, deployable to any host in minutes. `functions/api/council.js` is a plain fetch handler, portable to self-hosted `workerd`, Deno, or a $5 VPS in under an hour; only the env-var name travels. Founder data never touches the host at all. The plank can snap; the bridge survives.
