#!/usr/bin/env bash
set -euo pipefail

usage() {
  printf '%s\n' 'Usage: ./scripts/deploy.sh [--no-pull]' \
    'Normal: fast-forward main, build, and verify the public health endpoint.' \
    '--no-pull: deploy the current commit without fetching or switching branches.'
}

pull=true
case "${1:-}" in
  '') ;;
  --no-pull) pull=false ;;
  --help|-h) usage; exit 0 ;;
  *) usage >&2; exit 2 ;;
esac
if [ "$#" -gt 1 ]; then usage >&2; exit 2; fi

repo_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$repo_dir"
for dependency in git docker curl python3; do
  command -v "$dependency" >/dev/null || {
    printf 'Missing required command: %s\n' "$dependency" >&2
    exit 1
  }
done
docker compose version >/dev/null
if [ ! -f .env ]; then
  printf '%s\n' 'Create .env from .env.example and configure DOMAIN and SITE_URL first.' >&2
  exit 1
fi
if ! git diff --quiet || ! git diff --cached --quiet; then
  printf '%s\n' 'Refusing to deploy tracked files with uncommitted changes.' >&2
  exit 1
fi

lock_dir="$(git rev-parse --git-path do-over-deploy.lock)"
if ! mkdir "$lock_dir" 2>/dev/null; then
  printf '%s\n' 'Another deployment is running, or its lock remains. See docs/DEPLOY.md.' >&2
  exit 1
fi
health_file=''
error_file=''
cleanup() {
  [ -z "$health_file" ] || rm -f -- "$health_file"
  [ -z "$error_file" ] || rm -f -- "$error_file"
  rmdir -- "$lock_dir"
}
trap cleanup EXIT
trap 'exit 130' INT
trap 'exit 143' TERM

if [ "$pull" = true ]; then
  git fetch origin main
  git switch main
  git merge --ff-only origin/main
  if [ "$(git rev-parse HEAD)" != "$(git rev-parse origin/main)" ]; then
    printf '%s\n' 'Local main is ahead of origin/main. Deploy only the reviewed remote main.' >&2
    exit 1
  fi
fi
GIT_SHA="$(git rev-parse HEAD)"
export GIT_SHA

# Compose parses .env. Never execute .env as shell code or print its resolved secrets.
health_origin="$(docker compose --env-file .env config --format json | python3 -c '
import json, re, sys
config = json.load(sys.stdin)
domain = config["services"]["caddy"]["environment"]["DOMAIN"]
if domain == "http://localhost":
    print(domain)
elif re.fullmatch(r"(?=.{1,253}$)(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,63}", domain):
    print("https://" + domain)
else:
    sys.exit("DOMAIN must be a public hostname, or http://localhost for a local smoke test.")
')"

printf 'Building and deploying commit %s\n' "$GIT_SHA"
docker compose --env-file .env up -d --build --remove-orphans
health_file="$(mktemp)"
error_file="$(mktemp)"
deadline=$((SECONDS + 180))
while [ "$SECONDS" -lt "$deadline" ]; do
  if curl --fail --silent --show-error --connect-timeout 3 --max-time 5 \
    --proto '=http,https' --header 'Cache-Control: no-cache' \
    --output "$health_file" "$health_origin/api/health?deploy=$GIT_SHA" 2>"$error_file" \
    && python3 -c '
import json, sys
try:
    with open(sys.argv[1], encoding="utf-8") as response:
        health = json.load(response)
    valid = isinstance(health, dict) and health.get("ok") is True and health.get("commit") == sys.argv[2]
except (ValueError, OSError):
    valid = False
sys.exit(0 if valid else 1)
' "$health_file" "$GIT_SHA"; then
    printf 'Healthy: %s/api/health reports commit %s\n' "$health_origin" "$GIT_SHA"
    exit 0
  fi
  sleep 2
done
printf 'Deployment failed: %s/api/health did not report ok=true with commit %s within 180 seconds.\n' \
  "$health_origin" "$GIT_SHA" >&2
if [ -s "$error_file" ]; then cat "$error_file" >&2; fi
printf '%s\n' 'Inspect docker compose ps and docker compose logs --tail=100 web caddy.' \
  'The new containers are left in place for diagnosis; rollback is documented in docs/DEPLOY.md.' >&2
exit 1
