# MVP Orchestration Roadmap

## Goal
- Turn the MVP into an execution queue that can be driven issue by issue without re-deriving priorities every session.

## Active tracking
- GitHub Project:
  - `Provodnik Delivery`
  - `https://github.com/users/s6s8/projects/1`
- Milestones:
  - `Release 1 Transaction Foundation`
  - `Release 2 Marketplace Quality`
  - `Release 3 Optimization`

## Release 1 Transaction Foundation
- Focus:
  - request creation
  - data contracts
  - protected shell
  - guide onboarding
  - guide response flow
  - booking foundation
  - basic moderation

### Current issue order
1. `#1` traveler request creation
   - status: `Workflow = Done`
   - result: implemented frontend-first traveler request form
2. `#2` traveler request shared contract and submission adapter
   - status: `Workflow = Done`
   - result: shared request schema and local submission adapter now live in `src/data`
3. `#3` guide onboarding and verification intake
   - status: `Workflow = Done`
   - result: guide onboarding and verification form now lives in the guide workspace
4. `#4` admin guide review queue scaffold
   - status: `Workflow = Done`
   - result: guide moderation queue now exists in the admin workspace
5. `#5` protected workspace shell and role navigation
   - status: `Workflow = Done`
   - result: shared protected shell and role navigation now wrap all protected routes
6. `#6` traveler requests workspace and request detail flow
   - status: `Workflow = Done`
   - result: traveler workspace, local request storage, request detail, offer comparison, and timeline are live
7. `#8` guide request inbox and structured offer composer
   - status: `Workflow = Done`
   - result: guide inbox, request detail route, and local offer composer are live
8. `#9` shell-safe auth and role boundary scaffolding
   - status: `Workflow = Done`
   - result: local demo session role context is visible in the protected shell without Supabase auth

### Current ready queue
1. `#7` public guide profile and trust markers
   - status: `Workflow = Done`
   - result: public guide profiles, trust markers, and reviews summary placeholders are live
2. `#10` guide listing manager and supply editor scaffold
   - status: `Workflow = Done`
   - result: guide listing manager and local listing editor are live
3. `#11` admin listing moderation scaffold
   - status: `Workflow = Done`
   - result: admin listing moderation queue is live and reachable from the admin workspace
4. `#12` listing discovery and tour detail baseline
   - status: `Workflow = Done`
   - result: public listing discovery and listing detail are live
5. `#13` booking detail and deposit-ready confirmation scaffold
   - status: `Workflow = Done`
   - result: traveler bookings list and deposit-ready booking detail are live

### Remaining Release 1 slices
- current tracked Release 1 queue is complete on `main`
- next expansion work should move into Release 2 slices:
  - open group joining
  - favorites
  - reviews
  - notifications
  - disputes and refunds

### Validation baseline
- Repo-level validation currently passes on `main`:
  - `bun run lint`
  - `bun run typecheck`
  - `bun run build`
- Worktree branches use shared installs for speed, so final `build` validation is run after merge on `main`.

## Release 2 Marketplace Quality
- Focus:
  - group joining
  - favorites
  - reviews
  - notifications
  - dispute handling
  - ranking signals

### Planned slices
- open request discovery and group join experience
- favorites and saved supply
- post-booking reviews and trust loop
- notification center and core marketplace notifications
- dispute intake and refund operations
- ranking and supply quality indicators

## Release 3 Optimization
- Focus:
  - analytics
  - controls
  - anti-circumvention
  - launch-region scaling

### Planned slices
- marketplace analytics dashboard
- featured supply and policy controls
- anti-circumvention and audit event surfaces
- category templates and launch-region tooling

## Dependency rules
- Data contracts should land before backend or persistence work depends on them.
- Foundation shell changes should land before deep protected-area polish.
- Guide onboarding should exist before admin approval and moderation become meaningful.
- Booking detail should follow request and offer structure, not precede it.

## Execution rule
- Always pull the next task from:
  1. highest-priority issue in `Ready`
  2. current milestone before future milestones
  3. blocking dependencies before UI polish
