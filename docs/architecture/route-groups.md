# App Router route groups (repo reality)

This doc reflects the **current** route groups in `src/app` and is used to keep architecture docs aligned with the real tree.

## Groups

- **`(home)`**: homepage-only routes (currently `/`)
- **`(site)`**: marketing/public pages (trust, listings, guides, auth, policies)
- **`(protected)`**: authenticated areas (traveler, guide, admin, notifications)
- **`(reference)`**: internal reference/demo pages

## Why this exists

Some docs and instructions previously referenced a `(public)` group. The repo currently uses `(site)` instead, plus a dedicated `(home)` group for the homepage layout boundary.

