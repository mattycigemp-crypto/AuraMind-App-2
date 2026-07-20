# Security Policy

Thanks for helping keep AuraMind users safe. We take vulnerability
reports seriously and respond within the SLAs below.

## Supported versions

| Version | Supported           |
| ------- | ------------------- |
| latest  | ✅ Active support   |
| previous minor | ✅ Security-only patches |
| anything older than two minor versions | ❌ End-of-life |

## Reporting a vulnerability

**Please do NOT file a public GitHub issue for security bugs.**

Open a **GitHub Security Advisory** privately:

[https://github.com/mattycigemp-crypto/AuraMind-App-2/security/advisories/new](https://github.com/mattycigemp-crypto/AuraMind-App-2/security/advisories/new)

Include:
- a clear description of the vulnerability and the impact you observed
- reproduction steps (or a screencast / curl transcript)
- the SHA or release tag you reproduced against
- whether you are OK with being credited in the fix announcement

If you cannot use GitHub Security Advisories (e.g. you are reporting
from an account GitHub does not recognize), email **security@auramind.app**
with the same payload. The on-call maintainer reads this inbox daily.

> **For the maintainer**: please confirm `security@auramind.app` is set
> up and forwarding to the on-call rotation before publishing this file.
> Until then, ALL reports flow through GitHub Security Advisories —
> the email address above is intended as a fallback, not a primary path,
> so it must be active to keep maintainers reachable after-hours.

## Our response SLA

| Stage                       | Target          |
| --------------------------- | --------------- |
| Acknowledge report          | within 48 hours |
| Initial triage & severity   | within 7 days   |
| Patch for Critical / High   | within 30 days  |
| Patch for Medium            | within 90 days  |
| Patch for Low / informational | best-effort   |

We will keep you informed of progress and credit you in the release
notes unless you ask to remain anonymous.

## Hardening commitments the project already follows

These are the rules every PR must respect — if you find drift, please
flag it:

- Every `UPDATE` RLS policy carries a `WITH CHECK` clause.
- No `FOR INSERT|UPDATE|DELETE` policy may be named ending in `(dev)`.
- The schema intentionally has only one policy per `(cmd, table)` pair —
  see `docs/M6-store-submission-playbook.md`.
- `.env*` and any `*keystore*/*credentials*` files are `.gitignore`d;
  their absence from the repo is by design.
- Supabase migration files are append-only and idempotent (`ADD COLUMN
  IF NOT EXISTS`, `DROP POLICY IF EXISTS`, etc.).

## Recognition

We follow a coordinated disclosure model. Public disclosure of an
issue should wait until either a patch ships or 90 days have elapsed
from the report — whichever comes first.
