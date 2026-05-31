# FlowBoard Practical Audit - 2026-05-31

## Critical

- No critical findings found in this pass.

## High

- No high-risk findings found in this pass.

## Medium

- No dependency advisories were reported by `npm audit --json`.
- R2 attachments remain private and are served through authenticated Worker routes with workspace/card access checks.
- Upload limits are enforced server-side: 10 MB per file, 10 attachments per card, and 100 attachments per account.

## Low

- `.env.example` and `.dev.vars.example` had stale R2 setup notes. They now reflect that R2 uses the `ATTACHMENTS_BUCKET` Worker binding, not env API keys.
- Attachment API helpers duplicated auth-header construction from the shared API client. A shared `getApiAuthHeaders` helper now centralizes that behavior.
- New local user creation trusted a client-supplied display-name header as a fallback. The server now uses the verified Neon Auth payload name or a neutral `User` fallback.

## Refactor

- `card-detail-dialog.tsx` was the largest frontend file and mixed title editing, description, checklist, attachments, and activity UI. It has been split into focused card-detail components while preserving behavior.
- Further useful refactors remain available in later passes: `auth-forms.tsx`, `board-list-section.tsx`, `board-card-shell.tsx`, `use-boards.ts`, and larger Worker route files.

## Verification

- `npm audit --json`
- `npm run typecheck`
- Additional checks are expected after the refactor: `npm run lint`, `npm run worker:check`, `npm run build`, and `npm run test:run`.
