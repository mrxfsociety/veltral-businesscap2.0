# Deploy Do-Over

Two deployment paths are maintained. The existing production host uses nginx. The root Compose/Caddy stack is for a new host where ports 80 and 443 are available. Do not start the Caddy stack on the existing nginx host.

| Deployment | Configuration | Public ingress | Runtime environment |
| --- | --- | --- | --- |
| Existing `veltral.aituconnect.kz` | `deploy/compose.nginx.yml` and `deploy/nginx.https.conf` | Existing host nginx → `127.0.0.1:3310` | `/opt/do-over/shared/.env` |
| New dedicated VPS | `docker-compose.yml` and `Caddyfile` | Caddy on 80/443 → private `web:3000` | `.env` in the deployment checkout |

Both paths use the same non-root standalone Next.js image and private persistent Redis. Neither publishes Redis. Provider credentials remain outside Git and image build contexts.

## Recorded deployment evidence

The review branch reports a working HTTPS release at [veltral.aituconnect.kz](https://veltral.aituconnect.kz). The recorded first deployment is commit `fd172030d2a8c4d08db8691b32dd95050121b1c8`, measured on 14 November 2026 in [production-latency.json](evidence/production-latency.json): 20 successful HTTPS practice turns, 19 model responses and one rules fallback, median 2034.68 ms and p90 2787.47 ms. Daily ranking counters were unchanged. This is evidence for that release; it does not establish which commit is running now or mean that a later unified A/B commit has been deployed.

Before reporting any deployment complete, fetch the live `/api/health`, compare its full commit with the selected source revision and perform the appropriate gameplay checks. [TRACK-A-REPORT.md](build/TRACK-A-REPORT.md) records the separate real-provider and server checks; [TRACK-B-REPORT.md](build/TRACK-B-REPORT.md) records browser and integration evidence. Human label review and a real-device microphone acceptance are not inferred from server tests.

## Shared build and runtime settings

Use the committed `package-lock.json` and `npm ci`. The Docker image uses Node 26 LTS; the VPS needs Docker Engine with the Compose plugin, Git, curl and Python 3, but not a separate Node installation. Next.js must use `output: "standalone"` and trace the runtime content/evaluation JSON files into that output.

`SITE_URL` and `NEXT_PUBLIC_PRO_PREVIEW` are passed at build time and runtime in both Compose configurations. Rebuild after changing them: generated metadata and browser flags can be fixed in the build output. A runtime restart alone is insufficient. Provider keys, reasoning settings and model IDs are runtime-only.

| Variable | Meaning |
| --- | --- |
| `DOMAIN` | Caddy hostname without scheme; the existing nginx hostname is declared in its site configuration |
| `SITE_URL` | Canonical origin, `https://veltral.aituconnect.kz` on the existing host |
| `REDIS_URL` | `redis://redis:6379`; nginx Compose pins the private service |
| `OPENAI_API_KEY` | Private OpenAI credential; never prefix with `NEXT_PUBLIC_` |
| `OPENAI_MODEL` | Selected runtime structured-output model |
| `OPENAI_REASONING_EFFORT` | Optional model-supported effort; the reviewed OpenAI deployment uses `none` |
| `OPENAI_TEXT_VERBOSITY` | Optional supported detail level; the reviewed deployment uses `low` |
| `ANTHROPIC_API_KEY`, `ANTHROPIC_MODEL` | Optional adapter settings; leave empty for the owner's OpenAI-only deployment |
| `LLM_PRIMARY` | `openai` for the selected deployment |
| `MODEL_DAILY_CALL_CAP` | Maximum daily model calls, initially `20000`; over budget uses rules |
| `OPENAI_TRANSCRIBE_MODEL`, `OPENAI_TTS_MODEL` | Speech models, configured independently of the text model |
| `NEXT_PUBLIC_PRO_PREVIEW` | `true` for the hackathon preview; `false` for Free-limit testing |
| `ADMIN_KEY` | Long random secret protecting team statistics; different from provider keys |
| `GIT_SHA` | Exact full source revision used for the image and runtime health response |

The reviewed production configuration selected `OPENAI_MODEL=gpt-6-luna`, `OPENAI_REASONING_EFFORT=none`, `OPENAI_TEXT_VERBOSITY=low`, `LLM_PRIMARY=openai`, with Anthropic credentials empty. The recorded voice API checks used `gpt-4o-mini-transcribe` and `gpt-4o-mini-tts`; they were performed with synthetic audio, not a real microphone. Track A records the current TTS model's scheduled retirement on 6 January 2027; consult the [official speech guide](https://developers.openai.com/api/docs/guides/text-to-speech) before the required adapter migration.

Compose parses environment files; do not execute them using shell `source`. Shell variables override file values, so avoid stale exported settings. Expanded Compose configuration includes secrets: use `config --quiet` for validation and do not paste `docker compose config` output into reports.

## Existing nginx host

Preserve the nginx services and certificates for the host's other applications. The installed Do-Over Compose file lives at `/opt/do-over/infra/compose.yml` and follows `deploy/compose.nginx.yml`. Its web binding is loopback-only on port 3310. Redis uses an AOF volume, a 192 MB `noeviction` policy and a 256 MB container memory limit; the web container has a 1 GB limit.

Keep private runtime values in `/opt/do-over/shared/.env`, mode `600`, outside all release directories. `DOOVER_ENV_FILE` can override that default path for isolated configuration checks; it must identify the same private file passed to Compose's `--env-file`. `DOOVER_RELEASE_PATH` must point to the already prepared, reviewed source directory matching the selected full SHA. Do not silently change branches or deploy an unverified checkout.

Synchronize the installed Compose template with a reviewed release before using newly added environment settings. The nginx snippets are specific to `veltral.aituconnect.kz`. `deploy/nginx.http.conf` is the HTTP/ACME bootstrap configuration; the final HTTPS configuration is `deploy/nginx.https.conf`, which redirects regular HTTP requests and preserves the ACME challenge path. The certificate and renewal hook belong to this dedicated site; do not replace the host's other nginx configuration.

After the source directory, installed Compose file and private settings have been prepared and reviewed, the operator runs:

```sh
export GIT_SHA='<verified-full-commit>'
export DOOVER_RELEASE_PATH="/opt/do-over/releases/$GIT_SHA"
export DOOVER_ENV_FILE=/opt/do-over/shared/.env
docker compose --env-file "$DOOVER_ENV_FILE" -f /opt/do-over/infra/compose.yml config --quiet
docker compose --env-file "$DOOVER_ENV_FILE" -f /opt/do-over/infra/compose.yml build web
docker compose --env-file "$DOOVER_ENV_FILE" -f /opt/do-over/infra/compose.yml up -d --no-build
curl --fail --silent --show-error https://veltral.aituconnect.kz/api/health | python3 -c '
import json, os, sys
health = json.load(sys.stdin)
if health.get("ok") is not True or health.get("commit") != os.environ["GIT_SHA"]:
    sys.exit("Health did not confirm the selected release")
print("Healthy commit:", health["commit"])
'
```

Also verify Redis is `up`, the configured provider is reported and the existing host sites still respond. Complete an unranked library scene, check model/rules attribution and do-over, then run the relevant browser checks against the real HTTPS origin. A pushed Git commit or a build alone is not a completed deployment.

To roll back, select the previous verified SHA and its matching release path and run `up -d --no-build` against its existing image. Preserve the Redis volume. If that image has been removed, rebuild it from the matching reviewed source before starting it. The root `scripts/deploy.sh` is not used for this nginx path.

## New dedicated VPS with Caddy

1. Create a DNS A record for the hostname pointing to the VPS. If an AAAA record exists, its IPv6 address must reach the same server. Use direct/DNS-only mode for this setup.
2. Keep SSH access and allow HTTP/HTTPS in the hosting provider's firewall. With UFW on a new Ubuntu server:

   ```sh
   sudo ufw allow 22/tcp
   sudo ufw allow 80/tcp
   sudo ufw allow 443/tcp
   sudo ufw allow 443/udp
   ```

   Keep the actual SSH port open if different. Do not bind Caddy's ports over an existing web server.

3. Install Docker Engine and the Compose plugin using the [official Ubuntu](https://docs.docker.com/engine/install/ubuntu/) or [Debian](https://docs.docker.com/engine/install/debian/) instructions. Install `git`, `curl` and `python3`. Confirm `docker version` and `docker compose version` succeed for the deployment account.
4. Clone the reviewed repository and create the private environment file:

   ```sh
   git clone https://github.com/mrxfsociety/veltral-businesscap2.0.git do-over
   cd do-over
   cp .env.example .env
   chmod 600 .env
   ```

5. Edit `.env` with the actual `DOMAIN`, matching `SITE_URL`, private provider configuration and `ADMIN_KEY`. Never commit it. Run:

   ```sh
   ./scripts/deploy.sh
   ```

The script rejects uncommitted tracked changes, fetches `origin/main`, fast-forwards local `main` and refuses a local branch ahead of that reviewed remote. It exports the full commit SHA, rebuilds the image and starts web, Redis and Caddy. It accepts the deployment only when the public health response has `ok: true` and the exact commit, with normal TLS validation. A stale healthy response does not pass. Caddy obtains the certificate automatically; data and certificates survive replacement in named volumes.

The script polls health for up to 180 seconds after startup. Failure leaves containers available for diagnosis and exits nonzero. A deployment lock under the Git directory prevents concurrent runs. After confirming no deployment process is active, a stale lock can be removed with `rmdir "$(git rev-parse --git-path do-over-deploy.lock)"`.

For rollback on this Caddy path:

```sh
git switch --detach PREVIOUS_ACCEPTED_SHA
./scripts/deploy.sh --no-pull
```

`--no-pull` builds and checks the selected current commit without fetching or switching branches. A later normal invocation returns to reviewed remote `main`.

## Local validation

For a local Caddy smoke test, use a development checkout without production credentials and free ports 80/443:

```sh
cp .env.example .env
DOMAIN=http://localhost SITE_URL=http://localhost ./scripts/deploy.sh --no-pull
curl --fail http://localhost/api/health
```

`http://localhost` is the explicit local-only HTTP option. Production uses HTTPS. CI includes the container smoke test and parses both deployment configurations. The nginx configuration can be checked without touching a VPS or using a private file:

```sh
DOOVER_RELEASE_PATH="$PWD" DOOVER_ENV_FILE="$PWD/.env.example" GIT_SHA="$(git rev-parse HEAD)" \
  docker compose --env-file .env.example -f deploy/compose.nginx.yml config --quiet
```

Parsing a configuration is not a runtime/container test. CI results count only after its jobs actually execute; track A recorded an account billing lock that previously prevented Actions from starting.

## Operational checks

Use the appropriate Compose file and environment path for the chosen deployment when running `ps` or `logs --tail=100`. Check DNS, certificate issuance and the reverse proxy when a request fails. Never bypass TLS validation to make a health check pass. Inspect model IDs and credentials locally without logging them or full parent replies.

`redis: "memory"` is the documented availability fallback, not durable storage. The fallback is sticky for that web process to avoid reconnecting to stale session state. Recover Redis, restart web deliberately and check a new session. Memory-only sessions cannot be promised to survive a restart.

Do not run `docker compose down --volumes` on production: it deletes persistent data. CI removes only its disposable test volumes.

## Voice acceptance

Voice requires HTTPS on actual phones and laptops. After model configuration, test calibration/recalibration, a calm reply, the same words spoken at least 10 dB above baseline, playback, microphone denial and typing fallback. Re-run the text suite. Browser capture stops around 11.8 seconds to leave encoder-padding room within the server's 12-second and 1 MB input limit.

Input audio is discarded after processing. Generated child speech can be cached by session and text hash for up to one hour. Synthetic WAV transcription, a decoded provider MP3 or a passing loudness unit test does not replace real-device microphone checks. Record device/browser and observed outcomes before declaring that acceptance complete.
