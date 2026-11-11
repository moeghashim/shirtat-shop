---
id: 002
title: Deploy the demo to Cloudflare Workers
milestone: v0.1-design-system-shell
category: deploy
priority: high
files: ["vite.config.ts", "wrangler.jsonc", "package.json", "package-lock.json", "README.md"]
---

## Acceptance criteria
- [ ] Use Nitro cloudflare-module and a wrangler.jsonc Worker named tenboards.
- [ ] Add npm run deploy and npm run preview:deploy (wrangler versions upload).
- [ ] Deploy the existing mock-data demo with no database, new secrets, or environment variables.
- [ ] Record the live workers.dev URL and version preview URL in README and PR; verify /dashboard/default and static assets on both.
- [ ] Build, check, typecheck, local smoke, and deployed smoke pass; include desktop light/dark evidence.
- [ ] Document manual redeploy from main after user merges; do not add CI deploys or GitHub secrets.

## Suggested approach
Inspect installed Nitro deployment output and current official Cloudflare docs. Wrangler devDependency and Nitro deployment configuration are approved. Stack on 001 if unmerged; PR still targets main and declares the dependency.

## Execution order
The user needs a live URL before design iteration.
