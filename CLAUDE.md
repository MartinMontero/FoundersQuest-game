# Founder's Quest — game build
Greenfield build of a playable validation-journey game. The kickoff prompt (first
message of the session) is the operating contract. If context has been compacted,
re-read it and this file before acting.

- Canon: docs/canon/01..06 — read in order; 01-constitution outranks everything.
- Canon copies update in the same commit as any change they describe.
- Only E2+ evidence moves Truth; invalidation pays 1.5x; gates warn, never block.
- Family Dinner: schema keys only — no UI, never serialized.
- Sanctioned services ONLY: Anthropic API, Cloudflare Pages/Functions, GitHub(+Actions).
- BYOK: this game is for the general public — each player brings their OWN Anthropic
  API key, entered at runtime. There is NO server-side ANTHROPIC_API_KEY, no owner key,
  no shared key, no Function in the Council path (browser→api.anthropic.com direct).
  Never store, log, or commit a player's key; it lives device-side under its own
  storage key, never serialized or exported. (Decision log, 2026-07-08.)
- Scanning: osv-scanner and gitleaks. Never Trivy. No telemetry of any kind.
- Consent before any journal text leaves the device. Function logs no bodies.
- Stop for: canon/floor changes, Rule 9 actions, missing sources, D-scope items
  (D2, D5, Earned Hunch, i18n, Dinner UI, sync endpoint), three-strike blockers.
- Verify claims against actual tool results before reporting. Mark UNTESTED plainly.
