# Spec: phase1-run-a
date: 2026-03-31
based-on: proposal.md (Option A)

## ADDED Behaviors

### Email And Password Auth Entry
- Given the auth service is configured
- When a guest opens the account entry page
- Then the page presents Russian-language email/password sign-in and sign-up actions instead of a magic-link-only flow
- And the guest can choose the role they are creating during sign-up

### Seeded Test Accounts
- Given the database is initialized for this phase
- When the seed data is applied
- Then deterministic admin, traveler, and guide accounts exist for email/password login
- And each seeded account has a role profile that matches its intended workspace

### Role Dashboard Destinations
- Given a user successfully authenticates with a known role
- When sign-in or sign-up completes
- Then the user is sent to `/traveler/dashboard`, `/guide/dashboard`, or `/admin/dashboard` according to that role
- And each dashboard destination resolves into the correct protected workspace for that role

### Middleware Protection For Role Workspaces
- Given the auth service is configured
- When a guest requests any traveler, guide, or admin workspace URL
- Then access is evaluated before the workspace renders
- And guests are redirected to the account entry page

### Role-Aware Workspace Enforcement
- Given the auth service is configured
- When an authenticated user requests a workspace that does not match their role
- Then the user is redirected to their own role dashboard
- And the mismatched workspace does not render

### Signup Profile Provisioning
- Given a new user completes sign-up
- When the account is created with a chosen role
- Then a base application profile exists for that user without requiring a separate manual profile-creation step
- And guide sign-ups also receive a minimal guide profile record

### Guide Seed Data Coverage
- Given a guide profile is created for seeded accounts in this phase
- When the guide record is stored
- Then it supports persisted values for specialization, regions, languages, rating, completed tours, verification status, and availability
- And the stored guide data is sufficient to recreate the requested seeded guide fixtures deterministically

### Guide Signup Defaults
- Given a new guide signs up through the account entry flow
- When the minimal guide profile is created automatically
- Then any guide-specific fields beyond identity and role start from safe defaults rather than being required at sign-up time
- And those defaults keep the account valid until the guide completes later onboarding or staff review

## MODIFIED Behaviors

### Account Entry Experience
**Before:** Guests request a magic link by email and choose a role hint before continuing.
**After:** Guests use Russian-language email/password sign-in and sign-up flows, while demo guidance remains visible when the auth service is unavailable.

- Given the auth service is configured
- When a guest interacts with the account entry page
- Then authentication uses direct credentials instead of sending a magic link
- And success and error feedback are shown inline on the page

### Protected Area Access Model
**Before:** Protected areas render under layout-level auth awareness, and role mismatches remain visible in the MVP shell.
**After:** Traveler, guide, and admin workspaces are gated before rendering, with role mismatches redirected to the correct dashboard.

- Given the auth service is configured
- When a user visits a protected workspace URL
- Then authorization is enforced before protected content is served
- And a role mismatch no longer falls through to the wrong workspace

### Demo Mode Contract
**Before:** Demo cookies can be used inside protected areas, and the shell still works when the auth service is not configured.
**After:** That demo fallback remains available and becomes the explicit fallback path whenever the auth service is unavailable.

- Given the auth service is not configured
- When a visitor opens the account page or a protected workspace
- Then the app continues to support the existing demo-mode path instead of failing closed
- And local demo role switching still provides access to the corresponding demo workspace

### Authenticated Visit To The Account Page
**Before:** The account page is the general entry point and does not define a role-dashboard redirect for already authenticated users.
**After:** Authenticated users are immediately sent to their role dashboard.

- Given a user already has an active authenticated session with a known role
- When they request the account entry page
- Then they are redirected to their role dashboard
- And the account entry form does not remain the primary surface for that request

## REMOVED Behaviors

### Magic-Link Primary Sign-In
- The account entry page no longer treats emailed magic links as the primary authentication method for this flow because Phase 1 requires a real email/password foundation.

### Soft Role Mismatch Access In Protected Workspaces
- The MVP behavior that allowed a signed-in user to remain inside another role's workspace is removed for traveler, guide, and admin protected areas.

## Edge Cases

### Invalid Credentials
- Given the auth service is configured
- When a user submits incorrect credentials
- Then authentication is rejected with a clear inline error
- And no protected session is created

### Duplicate Sign-Up Email
- Given the auth service is configured
- When a guest attempts to sign up with an email that already belongs to an existing account
- Then account creation is rejected with a clear inline error
- And no duplicate application profile is created

### Missing Role On An Authenticated Account
- Given a user has an authenticated session but no recognized application role
- When the app determines the post-login destination or authorizes a protected workspace
- Then the user is not allowed into role workspaces
- And they are sent to a safe account-entry state with guidance to recover the account

### Profile Trigger Safety Net
- Given account creation succeeds but the application-side profile write is incomplete or repeated
- When profile provisioning is evaluated
- Then the resulting user state still converges to a single base profile and, for guides, a single minimal guide profile
- And duplicate profile rows are not created

### Guide Defaults For Self-Signup
- Given a self-registered guide has not yet provided full guide details
- When that guide reaches their protected workspace
- Then the account remains usable
- And missing guide-specific values such as rating, completed tours, availability, specialization, languages, regions, and verification state are represented by defaults or empty values rather than causing failure

### Demo Session With Protected Routes
- Given the auth service is unavailable and a demo session exists
- When the visitor requests a protected traveler, guide, or admin route
- Then the route remains reachable through the matching demo role
- And a demo-role mismatch is corrected by redirecting the visitor to the matching demo workspace

### Direct Requests To Legacy Role Roots
- Given a user or link targets the role root path instead of the dashboard path
- When the request is resolved
- Then the app lands on the same role workspace represented by the new dashboard destination
- And the user does not end up on the wrong role surface

## Non-Goals
- This change does not add payments or any post-MVP commerce behavior.
- This change does not redesign the broader public marketing experience beyond the auth entry shell.
- This change does not require broader guide-onboarding completion during sign-up.
- This change does not alter unrelated traveler, guide, or admin feature behavior outside access control and entry routing.
- This change does not remove local demo mode as a supported development and fallback path.
