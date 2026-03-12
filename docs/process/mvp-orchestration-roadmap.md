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
   - status: `Workflow = Review`
   - result: implemented frontend-first traveler request form
2. `#2` traveler request shared contract and submission adapter
   - status: `Workflow = Review`
   - result: shared request schema and local submission adapter now live in `src/data`
3. `#5` protected workspace shell and role navigation
   - status: `Workflow = Ready`
   - why next: unlocks stronger route framing across traveler, guide, and admin
4. `#3` guide onboarding and verification intake
   - status: `Workflow = Backlog`
5. `#4` admin guide review queue scaffold
   - status: `Workflow = Backlog`

### Remaining Release 1 slices
- public guide profile and trust markers
- listing discovery and listing detail surfaces
- guide listing manager
- guide request inbox and structured offer composer
- booking detail and deposit-ready confirmation flow
- role/auth boundary scaffolding that stays shell-safe without real auth

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
