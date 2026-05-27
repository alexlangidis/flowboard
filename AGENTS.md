# AGENTS.md

## Project Overview

This is a Trello-style productivity app built with:

- Vite
- React
- TypeScript
- Tailwind CSS
- shadcn/ui
- TanStack Router
- TanStack Query
- TanStack Form
- TanStack Table
- Zod
- Zustand
- dnd-kit
- Cloudflare Workers
- Hono
- Neon Postgres
- Drizzle ORM
- Cloudflare R2

The goal is to build a clean, scalable, modern task management app with boards, lists, cards, drag-and-drop, comments, labels, attachments, and workspace collaboration.

---

## Main Rules

- Use TypeScript everywhere.
- Prefer simple, readable code over clever code.
- Keep files small and focused.
- Build features in a modular way.
- Use functional React components only.
- Use named exports unless there is a clear reason to use default exports.
- Avoid unnecessary dependencies.
- Do not add libraries without explaining why they are needed.
- Do not over-engineer the MVP.
- Prioritize working, maintainable code.

---

## Frontend Rules

Use React with Vite.

Use:

- TanStack Router for routing
- TanStack Query for server state
- Zustand for lightweight client/global state
- TanStack Form for forms
- Zod for validation
- TanStack Table for complex tables
- Tailwind CSS for styling
- shadcn/ui for reusable UI components
- dnd-kit for drag-and-drop

Do not use:

- Redux
- React Router
- Formik
- Yup
- Material UI
- Bootstrap
- CSS modules unless specifically needed

---

## Folder Structure

Use this structure:

```txt
src/
  app/
    router.tsx
    providers.tsx

  routes/
    __root.tsx
    index.tsx
    login.tsx
    register.tsx
    dashboard.tsx
    workspaces/
    boards/

  components/
    ui/
    shared/
    layout/

  features/
    auth/
      components/
      hooks/
      api/
      schemas/
      types.ts

    workspaces/
      components/
      hooks/
      api/
      schemas/
      types.ts

    boards/
      components/
      hooks/
      api/
      schemas/
      types.ts

    lists/
      components/
      hooks/
      api/
      schemas/
      types.ts

    cards/
      components/
      hooks/
      api/
      schemas/
      types.ts

  lib/
    api-client.ts
    utils.ts
    constants.ts

  stores/
    ui-store.ts

  styles/
    globals.css
```
