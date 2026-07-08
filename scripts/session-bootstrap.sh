#!/usr/bin/env bash
# Founder's Quest — remote-session bootstrap.
# The Claude Code remote container is ephemeral: osv-scanner and gitleaks
# installed into /usr/local/bin disappear when the container is reclaimed.
# GitHub release-asset downloads are blocked by the egress proxy, but
# proxy.golang.org is reachable, so both scanners (Go programs) are built
# from source at pinned versions. Idempotent — skips anything already present.
#
# Run at the start of every remote session (or wire into a SessionStart hook).
set -euo pipefail

OSV_VERSION=v2.4.0
GITLEAKS_VERSION=8.30.1
BIN_DIR=/usr/local/bin

if command -v osv-scanner >/dev/null 2>&1; then
  echo "osv-scanner: already present ($(osv-scanner --version | head -1))"
else
  echo "osv-scanner: installing ${OSV_VERSION} via proxy.golang.org..."
  go install "github.com/google/osv-scanner/v2/cmd/osv-scanner@${OSV_VERSION}"
  cp "$(go env GOPATH)/bin/osv-scanner" "${BIN_DIR}/"
  osv-scanner --version
fi

if command -v gitleaks >/dev/null 2>&1; then
  echo "gitleaks: already present ($(gitleaks version))"
else
  echo "gitleaks: installing ${GITLEAKS_VERSION} via proxy.golang.org..."
  # Module path is the project's old name; -X stamps the version string,
  # which `go install` does not do on its own.
  go install -ldflags "-X=github.com/zricethezav/gitleaks/v8/version.Version=${GITLEAKS_VERSION}" \
    "github.com/zricethezav/gitleaks/v8@v${GITLEAKS_VERSION}"
  cp "$(go env GOPATH)/bin/gitleaks" "${BIN_DIR}/"
  gitleaks version
fi

# Phase 7a note: the egress proxy denies api.osv.dev (osv-scanner's default
# online mode fails with 403/Forbidden). storage.googleapis.com IS allowed,
# so local scans in remote sessions must use offline mode:
#   osv-scanner scan source --offline-vulnerabilities --download-offline-databases .
# CI on GitHub Actions runs on GitHub's network and can use the default online mode.

echo "bootstrap: done"
