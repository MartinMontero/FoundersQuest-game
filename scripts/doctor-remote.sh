#!/usr/bin/env bash
# Founder's Quest — doctor, adapted for the Claude Code remote environment.
# The original doctor block (setup guide §3) assumes a local machine; four of
# its lines can never pass in this container:
#   gh auth status              -> no gh here; GitHub goes through MCP + an
#                                  authenticated git proxy (checked via ls-remote)
#   ls ~/.cache/ms-playwright   -> browsers are pre-baked at $PLAYWRIGHT_BROWSERS_PATH
#   test -f .dev.vars           -> created per the user's Step-5 decision, never by the agent
#   ls docs/canon | wc -l == 6  -> canon docs must be supplied by the user
#
# Exit codes: 0 = all pass · 2 = only PENDING_USER items remain · 1 = hard failure.
set -uo pipefail

FAIL=0
PENDING=0
ok()      { printf 'PASS     %s\n' "$1"; }
pend()    { printf 'PENDING  %s\n' "$1"; PENDING=1; }
bad()     { printf 'FAIL     %s\n' "$1"; FAIL=1; }

REPO_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO_DIR"

claude --version >/dev/null 2>&1 && ok "claude $(claude --version 2>/dev/null)" || bad "claude CLI missing"

node -v | grep -qE "^v(2[2-9]|[3-9][0-9])" && ok "node $(node -v)" || bad "node $(node -v 2>/dev/null || echo missing) — need v22+"

git --version >/dev/null 2>&1 && ok "$(git --version)" || bad "git missing"

git ls-remote origin >/dev/null 2>&1 && ok "GitHub auth via git proxy (ls-remote origin)" || bad "git remote unreachable — proxy/auth problem"

command -v osv-scanner >/dev/null 2>&1 && ok "$(osv-scanner --version | head -1)" || bad "osv-scanner missing — run scripts/session-bootstrap.sh"

command -v gitleaks >/dev/null 2>&1 && ok "gitleaks $(gitleaks version 2>/dev/null)" || bad "gitleaks missing — run scripts/session-bootstrap.sh"

PW_DIR="${PLAYWRIGHT_BROWSERS_PATH:-$HOME/.cache/ms-playwright}"
ls "$PW_DIR" 2>/dev/null | grep -qi chromium && ok "Chromium pre-baked at $PW_DIR" || bad "no Chromium under $PW_DIR — do NOT 'playwright install' here (CDN blocked); browsers should be pre-baked"

grep -q '^\.dev\.vars$' .gitignore && git check-ignore -q .dev.vars && ok ".dev.vars ignore rule effective" || bad ".dev.vars not covered by .gitignore"

if [ -f .dev.vars ]; then
  ok ".dev.vars present (per Step-5 decision)"
else
  pend ".dev.vars absent — Council key strategy is the user's Step-5 decision (local-only key + remote mock, or environment secret)"
fi

CANON_COUNT=$(ls docs/canon 2>/dev/null | wc -l)
if [ "$CANON_COUNT" -eq 6 ]; then
  ok "docs/canon: 6 canon docs"
else
  pend "docs/canon: $CANON_COUNT of 6 canon docs — user must supply 01-constitution.md … 06-deploy-runbook.md"
fi

[ -f .claude/settings.json ] && [ -f CLAUDE.md ] && ok "agent config present (.claude/settings.json + CLAUDE.md)" || bad "agent config missing"

echo
if [ "$FAIL" -eq 1 ]; then echo "DOCTOR: FAIL — fix hard failures above"; exit 1; fi
if [ "$PENDING" -eq 1 ]; then echo "DOCTOR: PENDING — user decisions/items outstanding; do not paste Part B yet"; exit 2; fi
echo "DOCTOR: ALL CLEAR — ready for Part B"
