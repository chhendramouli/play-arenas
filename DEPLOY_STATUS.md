# Play Arenas — Live Deployment Status

> **Purpose**: This is a living handoff document. If the agent driving this
> deployment runs out of credits, anyone (human or another LLM) can pick it up
> by reading this file plus `/tmp/play-arenas-facts.env` (kept on the user's
> machine, not in the repo — it has secrets).
>
> **Last updated**: 2026-05-03 04:30 UTC by Claude (mid-deploy)

---

## TL;DR — What's Working

| Component       | Status   | URL / handle                                   |
|-----------------|----------|------------------------------------------------|
| GitHub repo     | ✅ live  | https://github.com/chhendramouli/play-arenas   |
| EC2 backend     | ✅ live  | https://13-235-29-120.nip.io                   |
| Postgres (EC2)  | ✅ live  | (in-cluster only)                              |
| Temporal (EC2)  | ✅ live  | (in-cluster only — UI proxied below)           |
| Temporal UI     | ✅ live  | https://13-235-29-120.nip.io/temporal-ui/      |
| Billing alarm   | ✅ armed | $1 threshold, SNS to user's email              |
| Frontend        | ❌ failing | AWS Amplify build failing with deploy-manifest error |

---

## AWS account context

- **Account ID**: `776805327521`
- **IAM user**: `Google-Antigravity` (has admin)
- **Region**: `ap-south-1` (Mumbai)
- **Free-tier status**: User confirms account < 12 months old.
  After 12 months: ~$10/mo if EC2 + EIP keep running.

## DNS / TLS strategy

We use **nip.io** (free, no domain registration) for TLS-via-Let's-Encrypt:
- EIP `13.235.29.120` → DNS `13-235-29-120.nip.io` → Caddy → backend
- Caddy auto-issues + renews Let's Encrypt cert.

If EIP changes (it shouldn't unless user releases it), the host name and
LE cert change with it.

## EC2 facts

| field        | value                                       |
|--------------|---------------------------------------------|
| Instance ID  | `i-09aa4f66155ad3076`                       |
| Type         | `t3.micro` (1 vCPU, 1 GB RAM)              |
| AMI          | `ami-0b75531b0609d7451` (AL2023)           |
| Disk         | 12 GB gp3                                  |
| EIP          | `13.235.29.120`  (alloc `eipalloc-0e2dca85793d61796`) |
| Security grp | `sg-01311836a572bddb5` (`play-arenas-sg`)  |
| Keypair      | `play-arenas-key` — PEM at `~/.aws-play-arenas/play-arenas-key.pem` |

### How to SSH

```bash
ssh -i ~/.aws-play-arenas/play-arenas-key.pem ec2-user@13.235.29.120
```

### Stack on the box

`/opt/play-arenas/deploy/` runs **docker compose** with these services:

| Service        | Image                       | Memory cap | What it does                      |
|----------------|-----------------------------|------------|-----------------------------------|
| `postgres`     | `postgres:16-alpine`        | 200M       | DB for both backend and Temporal  |
| `temporal`     | `temporalio/auto-setup:1.25.0` | 280M    | Temporal cluster (worker + frontend) |
| `temporal-ui`  | `temporalio/ui:2.31.2`      | 80M        | Web UI                            |
| `backend`      | `play-arenas-backend:local` | 360M       | Spring Boot, port 8090            |
| `caddy`        | `caddy:2.8-alpine`          | 60M        | TLS reverse proxy on 80/443       |

**Total memory**: ~980M cap, sits in 1 GB RAM + 2 GB swap. **Tight but stable.**

**Postgres `max_connections` must be ≥ 100** (Temporal uses ~30, backend uses 5).
Set in `docker-compose.prod.yml` to `120`.

### Compose env file

Lives at `/opt/play-arenas/deploy/.env` on the box (chmod 600). Contains:
- `PUBLIC_HOST` = `13-235-29-120.nip.io`
- `JWT_SECRET` = (96-hex-char random)
- `TEMPORAL_UI_USER` = `admin`
- `TEMPORAL_UI_HASH` = bcrypt hash (with `$` escaped to `$$` for compose interpolation)
- `APP_CORS_ALLOWED_ORIGINS` = `http://localhost:3000,https://13-235-29-120.nip.io,https://main.d39vj530k6o7zp.amplifyapp.com`
- `POSTGRES_USER`/`POSTGRES_PASSWORD` = `decathlon` / `decathlon`
- DB name = `decathlon_play`

The plaintext temporal-UI password is stored locally in `/tmp/play-arenas-facts.env`
under `TEMPORAL_UI_PASS`.

## Frontend / Amplify status (currently FAILING)

- **App ID**: `d39vj530k6o7zp`
- **Default domain**: `d39vj530k6o7zp.amplifyapp.com`
- **Branch**: `main` connected to `chhendramouli/play-arenas`
- **Platform**: `WEB_COMPUTE` (will switch to `WEB` for static)
- **Env vars**: `NEXT_PUBLIC_API_URL=https://13-235-29-120.nip.io`

### Failure

Both jobs 1 and 2 failed at the build's final step:
```
Failed to find the deploy-manifest.json file in the build output.
```
The Next.js compile succeeds, but Amplify's framework adapter for
`WEB_COMPUTE` Next.js doesn't generate the deploy manifest — likely a Next.js
16 + Amplify Compute compatibility gap.

### Recovery plan in progress

1. Convert `/frontend/src/app/book/[id]/page.tsx` → `/frontend/src/app/book/page.tsx`
   (read `id` from `useSearchParams()`).
2. Set `next.config.ts` `output: 'export'`.
3. Update `amplify.yml` `baseDirectory: out`.
4. Switch Amplify app platform to `WEB` (static).
5. Push, retrigger build.
6. Frontend URL will be `https://main.d39vj530k6o7zp.amplifyapp.com`.

## Application admin login

- URL: `https://main.d39vj530k6o7zp.amplifyapp.com/login` (after frontend deploys)
- Email: `superadmin@dkplay.com`
- Password: `admin123`

(Yes, this is a known-weak demo credential. Rotate by editing
`backend/src/main/java/com/decathlon/play_arenas_backend/config/DataInitializer.java`
and re-deploying.)

## Cost guardrails

- CloudWatch alarm `play-arenas-billing-1usd` (us-east-1) fires at $1
  estimated charges.
- SNS topic: `arn:aws:sns:us-east-1:776805327521:play-arenas-billing-alerts`
- Email confirmation pending — user must click the link in the SNS email
  for the alarm to actually notify.

## Tear-down checklist

When you (or an automation) want to fully stop the AWS bill:

```bash
REGION=ap-south-1
# 1. EC2
aws ec2 terminate-instances --region $REGION --instance-ids i-09aa4f66155ad3076
# 2. Wait, then release EIP (free while attached, $0.005/hr if unattached)
aws ec2 release-address --region $REGION --allocation-id eipalloc-0e2dca85793d61796
# 3. Security group + keypair
aws ec2 delete-security-group --region $REGION --group-id sg-01311836a572bddb5
aws ec2 delete-key-pair --region $REGION --key-name play-arenas-key
# 4. Amplify
aws amplify delete-app --region $REGION --app-id d39vj530k6o7zp
# 5. SNS + alarm
aws cloudwatch delete-alarms --region us-east-1 --alarm-names play-arenas-billing-1usd
aws sns delete-topic --region us-east-1 --topic-arn arn:aws:sns:us-east-1:776805327521:play-arenas-billing-alerts
```

(EBS volume is `DeleteOnTermination=true` so terminating EC2 also drops it.)

## Open issues / TODO

- [ ] Frontend deploy on Amplify (in progress — pivoting to static export).
- [ ] Confirm SNS email subscription so billing alarm actually delivers.
- [ ] Rotate the GitHub PAT used for this deploy. It was used for the
      `aws amplify create-app --access-token` step and lives only in Amplify's
      encrypted store + the user's local shell history. The token is NOT
      committed anywhere in this repo. Revoke at:
      https://github.com/settings/tokens
- [ ] After 12 months: tear down per the checklist above, or move to t4g.small.
