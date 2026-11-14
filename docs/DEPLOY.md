# Deploy Do-Over

Production is one Linux VPS, one domain, and Docker Compose. A person from the team runs deployment after a stage is reviewed and merged. Deployment is not complete until the public health endpoint reports the intended commit.

## 1. Prepare the server

1. Create a DNS A record for the chosen hostname pointing to the VPS. If you also create an AAAA record, its IPv6 address must reach this server. Set the DNS record to direct/DNS-only mode so Caddy sees the client connection.
2. Permit SSH and HTTP/HTTPS in the hosting provider's firewall. With UFW on a new Ubuntu server:

   ```sh
   sudo ufw allow 22/tcp
   sudo ufw allow 80/tcp
   sudo ufw allow 443/tcp
   sudo ufw allow 443/udp
   ```

   Keep your existing SSH access open if it uses a different port. Only Caddy publishes container ports; neither Redis nor the application port is public.

3. Install Docker Engine and the Compose plugin using the [official Ubuntu instructions](https://docs.docker.com/engine/install/ubuntu/) or [Debian instructions](https://docs.docker.com/engine/install/debian/). The package names from Docker's repository are `docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin`. Install `git`, `curl`, and `python3` using the distribution package manager. Verify:

   ```sh
   docker version
   docker compose version
   git --version
   curl --version
   python3 --version
   ```

   Use a deployment account with Docker access. Node is provided by the container and is not required on the VPS. The image uses Node 26 LTS, checked against [Node's release page](https://nodejs.org/en/blog/release/v26.13.1/) on 14 November 2026.

4. Clone the reviewed repository into a writable directory:

   ```sh
   git clone https://github.com/mrxfsociety/veltral-businesscap2.0.git do-over
   cd do-over
   cp .env.example .env
   chmod 600 .env
   ```

## 2. Configure `.env`

Edit `.env` with your editor. Never commit it or paste its contents into reports. Set:

| Variable                                      | Production value                                                         |
| --------------------------------------------- | ------------------------------------------------------------------------ |
| `DOMAIN`                                      | Your hostname, without `https://` or a path                              |
| `SITE_URL`                                    | `https://` followed by the same hostname                                 |
| `REDIS_URL`                                   | `redis://redis:6379` for the included private Redis service              |
| `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`         | Provider keys; empty keys enable rules-only operation                    |
| `OPENAI_MODEL`, `ANTHROPIC_MODEL`             | Model IDs selected and measured by track A; no default is assumed        |
| `LLM_PRIMARY`                                 | `openai` or `anthropic`, as chosen by the measured provider comparison   |
| `MODEL_DAILY_CALL_CAP`                        | Daily model budget, initially `20000`                                    |
| `ADMIN_KEY`                                   | A long random value, different from the provider keys                    |
| `NEXT_PUBLIC_PRO_PREVIEW`                     | `true` during the hackathon; `false` to test the Free limits             |
| `OPENAI_TRANSCRIBE_MODEL`, `OPENAI_TTS_MODEL` | Empty unless voice has been approved and implemented                     |
| `GIT_SHA`                                     | Leave `local`; the deploy script replaces it with the checked-out commit |

`NEXT_PUBLIC_PRO_PREVIEW` is a build-time browser value. The Compose build argument and runtime setting use the same value. Run the deploy script after changing it; restarting an old image does not rebuild its browser bundle. Provider keys are runtime-only and are excluded from the build context by `.dockerignore`.

Compose reads the environment file; the deploy script never executes it as a shell script. Shell environment variables override `.env`, as in [Docker's interpolation rules](https://docs.docker.com/compose/how-tos/environment-variables/variable-interpolation/). Avoid exporting stale overrides in the deployment terminal. Do not paste the output of `docker compose config` into a chat: the expanded configuration includes secrets. Use `docker compose config --quiet` for validation.

## 3. First deployment and updates

From the repository directory:

```sh
./scripts/deploy.sh
```

The script rejects uncommitted tracked changes, fetches `origin/main`, fast-forwards local `main`, and rejects a local branch ahead of the reviewed remote. It exports the full commit SHA, builds the standalone Next.js image, and starts web, Redis, and Caddy. Redis data and Caddy certificates use named volumes and survive container replacement.

Caddy obtains a certificate and redirects HTTP to HTTPS automatically. The web container runs as a non-root user and has a local `/api/health` check. The script then polls the public endpoint for up to 180 seconds after startup. It succeeds only if the JSON contains `ok: true` and the exact deployed commit. TLS validation remains enabled. A response from an older deployment never counts as success.

Verify directly using your actual domain:

```sh
curl --fail --silent --show-error https://YOUR_DOMAIN/api/health
git rev-parse HEAD
docker compose ps
```

The JSON's `commit` must match `git rev-parse HEAD`. `redis: "up"` confirms durable server storage; `redis: "memory"` is the documented fallback and warrants inspecting Redis before a public demo. A successful health check alone does not validate gameplay: follow it with the acceptance checks for the stage being deployed.

Deploy after accepted T0, J1, B3, B4, voice (only if approved), and J2. Record the commit and observed health result in the stage report. No public domain or successful production deployment is claimed by this repository until those steps are actually performed.

## Local container smoke test

Use a development checkout without production keys. Ports 80 and 443 must be free:

```sh
cp .env.example .env
DOMAIN=http://localhost SITE_URL=http://localhost ./scripts/deploy.sh --no-pull
curl --fail http://localhost/api/health
```

The explicit localhost setting serves HTTP without requesting a certificate. Production uses the hostname and HTTPS. CI runs this same local smoke test after `npm run verify` and deletes only its own temporary volumes afterward.

## Troubleshooting

```sh
docker compose ps
docker compose logs --tail=100 web caddy
docker compose logs --tail=100 redis
```

- Certificate errors: check DNS A/AAAA, port 80/443 reachability, and Caddy logs. Do not disable TLS verification to make a failed deploy pass.
- Image build errors: confirm `package-lock.json` is committed and `npm run verify` passes for the commit. Next.js must use `output: "standalone"`.
- Old commit in health: confirm the image was rebuilt and the public domain routes to this VPS. The script injects `GIT_SHA` at runtime.
- Provider errors: inspect the configured model IDs and keys locally. Do not log credentials or full parent replies.
- Interrupted deployment: failed containers are left for diagnosis. A lock under the repository's Git directory prevents overlapping deployments. After confirming no other deploy process is running, remove only that lock directory:

  ```sh
  rmdir "$(git rev-parse --git-path do-over-deploy.lock)"
  ```

The script does not delete server data, stop the prior deployment before building, or silently claim success on failure.

## Roll back

Pick a previously accepted commit or acceptance tag. With a clean checkout:

```sh
git switch --detach PREVIOUS_ACCEPTED_SHA
./scripts/deploy.sh --no-pull
```

`--no-pull` neither fetches nor switches to `main`, so the selected commit is what gets rebuilt and health-checked. The same persistent volumes are retained. Do not run `docker compose down --volumes` on production: that removes Redis data and certificates.

For the next normal update, run `./scripts/deploy.sh`; it returns to the reviewed remote `main`.

## Existing host: veltral.aituconnect.kz

The authorized host already serves other applications through nginx. This deployment uses [deploy/compose.nginx.yml](../deploy/compose.nginx.yml) instead of the three-service Caddy setup. It preserves the existing nginx services, publishes Do-Over only on `127.0.0.1:3310`, and keeps Redis on a private Docker network with AOF persistence. The dedicated nginx site terminates HTTPS for `veltral.aituconnect.kz`; its certificate and renewal hook are independent of the existing sites.

Store the application environment in `/opt/do-over/shared/.env` with mode `600`, outside all release directories and build contexts. Configure `OPENAI_MODEL=gpt-6-luna`, `OPENAI_REASONING_EFFORT=none`, `OPENAI_TEXT_VERBOSITY=low`, `LLM_PRIMARY=openai`; leave Anthropic values empty. Voice uses `gpt-4o-mini-transcribe` and `gpt-4o-mini-tts`. The current Speech API TTS model is scheduled to retire on 6 January 2027; migrate the audio adapter before then using [the official speech guide](https://developers.openai.com/api/docs/guides/text-to-speech).

The tested release may be deployed from an isolated review branch while main remains awaiting team review. Always use its exact full SHA; do not silently switch to main.

```sh
export GIT_SHA='<verified-full-commit>'
export DOOVER_RELEASE_PATH="/opt/do-over/releases/$GIT_SHA"
docker compose --env-file /opt/do-over/shared/.env -f /opt/do-over/infra/compose.yml config -q
docker compose --env-file /opt/do-over/shared/.env -f /opt/do-over/infra/compose.yml build web
docker compose --env-file /opt/do-over/shared/.env -f /opt/do-over/infra/compose.yml up -d --no-build
curl --fail https://veltral.aituconnect.kz/api/health
```

Check that health reports the selected SHA, Redis up and OpenAI configured. Then complete a real unranked library scene, check model/rules attribution, verify voice API responses and compare existing sites before/after. Never print expanded Compose configuration because it includes environment secrets. To roll back, select a previous verified SHA and release path and start its existing image with `up -d --no-build`; keep the Redis volume.
