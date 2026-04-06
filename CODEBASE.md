# Provodnik Codebase Knowledge Base

**Version:** 0.1.0 | **Last Updated:** 2026-04-04 | **Phase:** 7 (Launch Prep)

This is the authoritative codebase reference for the Provodnik marketplace application. Use this document to understand the architecture, API endpoints, data models, and key patterns at a glance.

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Top-Level Directory Structure](#top-level-directory-structure)
3. [Application Stack](#application-stack)
4. [Source Code Organization](#source-code-organization)
5. [API Routes & Endpoints](#api-routes--endpoints)
6. [React Components](#react-components)
7. [Data Models & Schemas](#data-models--schemas)
8. [Configuration Files](#configuration-files)
9. [Scripts & Utilities](#scripts--utilities)
10. [Key Architectural Patterns](#key-architectural-patterns)
11. [Testing](#testing)
12. [Dependencies](#dependencies)
13. [Claude Code Integration (.claude/)](#claude-code-integration-.claude)

---

## Project Overview

**Provodnik** is a mobile-first marketplace for tour guides and excursions in Russia. It connects travelers seeking custom tours with verified local guides, facilitating bookings, messaging, dispute resolution, and reviews.

**Key roles:**
- **Travelers:** Browse listings, create requests, book tours, leave reviews
- **Guides:** Create/manage listings, respond to requests with offers, manage bookings
- **Admins:** Moderate content, manage guides, resolve disputes

**Tech Stack:**
- Next.js 16 (React 19, TypeScript)
- Tailwind CSS v4
- shadcn/ui components
- Supabase (PostgreSQL, Auth, Storage, Realtime)
- TanStack React Query v5
- React Hook Form + Zod validation

---

## Top-Level Directory Structure

```
/mnt/rhhd/projects/provodnik/
├── provodnik.app/              # Main application (Next.js)
├── provodnik.app-Tasks/        # Issue/task repository (GitHub)
├── design/                     # Design system assets
├── docs/                       # Documentation (architecture, runbooks, process)
├── deliverables/              # Release artifacts
├── worktrees/                 # Git worktree checkouts for parallel work
├── .claude/                   # Claude Code configuration & skills
├── .cursor/                   # Cursor IDE config
├── .paperclip-reconfig/       # Paperclip orchestration configs
├── .git/                      # Git repository
├── PRODUCT.md                 # Product definition & vision
├── DESIGN.md                  # Design tokens & visual system
├── PLAN.md                    # Phase/milestone roadmap
├── PHASE2.md                  # Phase 2 specific milestones
├── BACKLOG.md                 # Feature/bug backlog
├── AGENTS.md                  # Agent team context & roles
└── [image files & logs]       # Screenshots, log files from development
```

---

## Application Stack

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| **Framework** | Next.js | 16.1.6 | Server/client framework with App Router |
| **Language** | TypeScript | 5.x | Type-safe code |
| **UI Library** | React | 19.2.3 | Component library |
| **UI Components** | shadcn/ui | 4.0.5 | Pre-built accessible components |
| **Styling** | Tailwind CSS | 4.x | Utility-first CSS |
| **State Management** | TanStack Query | 5.90.21 | Server state (caching, sync, mutations) |
| **Forms** | React Hook Form | 7.71.2 | Form state + validation |
| **Validation** | Zod | 4.3.6 | Runtime schema validation |
| **Backend DB** | Supabase | 2.99.1 | PostgreSQL + Auth + Storage |
| **Rate Limiting** | Upstash Redis | 1.37.0 | API rate limiting |
| **Package Manager** | Bun | latest | JavaScript runtime & package manager |
| **Testing** | Vitest | 4.1.2 | Unit/integration tests |
| **Animation** | Framer Motion | 12.36.0 | Declarative animations |
| **Icons** | Lucide React | 0.577.0 | SVG icon library |

---

## Source Code Organization

### `/src/app` – Next.js App Router Pages & Layouts

Pages are organized by route groups and role-based access:

```
/src/app/
├── layout.tsx                          # Root layout (fonts, providers)
├── robots.ts                           # SEO robots.txt
├── sitemap.ts                          # Sitemap for SEO
├── not-found.tsx                       # 404 page
├── (auth)/                             # Public auth pages
│   ├── layout.tsx
│   └── auth/page.tsx                   # Sign in/sign up — dark brand gradient background, renders AuthEntryScreen
├── (home)/                             # Public homepage
│   ├── layout.tsx
│   └── page.tsx                        # Home hero — uses createSupabaseServerClient() + getDestinations() + getOpenRequests()
├── (site)/                             # Public browsing pages
│   ├── layout.tsx
│   ├── destinations/
│   │   ├── page.tsx                    # Destinations list — uses createSupabaseServerClient() + getDestinations()
│   │   └── [slug]/page.tsx             # Destination detail
│   ├── guides/
│   │   ├── page.tsx                    # Browse guides — uses createSupabaseServerClient() + getGuides()
│   │   └── [slug]/page.tsx             # Guide profile
│   ├── guide/[id]/page.tsx             # Guide detail (by ID)
│   ├── listings/
│   │   ├── page.tsx                    # Browse listings — uses createSupabaseServerClient() + getActiveListings()
│   │   └── [slug]/page.tsx             # Listing detail
│   ├── requests/
│   │   ├── page.tsx                    # Browse open requests
│   │   ├── new/page.tsx                # Create request (public)
│   │   └── [requestId]/page.tsx        # Request detail
│   ├── policies/
│   │   ├── cancellation/page.tsx
│   │   ├── privacy/page.tsx
│   │   ├── refunds/page.tsx
│   │   └── terms/page.tsx
│   ├── trust/page.tsx                  # Trust & safety info
│   └── error.tsx
├── (protected)/                        # Authenticated pages (all roles)
│   ├── layout.tsx                      # Auth guard, role router
│   ├── loading.tsx
│   ├── error.tsx
│   ├── not-found.tsx
│   ├── page.tsx                        # Role-based redirect
│   ├── messages/
│   │   ├── page.tsx                    # Conversation list
│   │   ├── [threadId]/page.tsx         # Message thread detail
│   │   ├── [threadId]/actions.ts       # Send message action
│   │   └── [threadId]/loading.tsx
│   ├── notifications/page.tsx          # Notification center
│   ├── admin/                          # Admin dashboard
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── admin-sidebar-nav.tsx
│   │   ├── dashboard/page.tsx          # Admin overview
│   │   ├── guides/
│   │   │   ├── page.tsx                # Guide review queue
│   │   │   └── [id]/page.tsx
│   │   ├── listings/page.tsx           # Listing moderation queue
│   │   └── disputes/
│   │       ├── page.tsx                # Dispute case list
│   │       └── [caseId]/page.tsx       # Dispute case detail
│   ├── guide/                          # Guide workspace
│   │   ├── layout.tsx
│   │   ├── page.tsx                    # Redirect to dashboard
│   │   ├── dashboard/page.tsx          # Guide home
│   │   ├── listings/
│   │   │   ├── page.tsx                # My listings
│   │   │   ├── new/page.tsx            # Create listing
│   │   │   ├── [id]/page.tsx           # Listing detail
│   │   │   └── [id]/edit/page.tsx      # Edit listing
│   │   ├── bookings/
│   │   │   ├── page.tsx                # Bookings list
│   │   │   └── [bookingId]/page.tsx    # Booking detail
│   │   ├── requests/
│   │   │   ├── page.tsx                # Incoming requests
│   │   │   ├── [requestId]/page.tsx    # Request detail
│   │   │   └── [requestId]/offer/page.tsx  # Create offer
│   │   └── verification/page.tsx       # KYC/verification
│   └── traveler/                       # Traveler workspace
│       ├── layout.tsx
│       ├── page.tsx                    # Redirect to dashboard
│       ├── dashboard/page.tsx          # Traveler home
│       ├── requests/
│       │   ├── page.tsx                # My requests list
│       │   ├── new/page.tsx            # Create request
│       │   └── [requestId]/page.tsx    # Request detail
│       ├── open-requests/
│       │   ├── page.tsx                # Browse open requests
│       │   └── [openRequestId]/page.tsx
│       ├── bookings/
│       │   ├── page.tsx                # Bookings list
│       │   ├── [bookingId]/page.tsx    # Booking detail
│       │   ├── [bookingId]/review/page.tsx
│       │   └── [bookingId]/dispute/page.tsx
│       └── favorites/page.tsx          # Saved guides & listings
├── api/                                # API routes (server functions)
│   └── messages/
│       ├── threads/route.ts            # GET: list user threads
│       ├── threads/[threadId]/route.ts # GET/POST thread detail
│       └── unread-count/route.ts       # GET: unread message count
```

### `/src/components` – Reusable React Components

```
/src/components/
├── providers/
│   └── app-providers.tsx               # Global context providers (Query, etc.)
├── ui/                                 # shadcn/ui & custom UI elements
│   ├── badge.tsx
│   ├── button.tsx
│   ├── card.tsx
│   ├── input.tsx
│   ├── textarea.tsx
│   ├── tabs.tsx
│   ├── separator.tsx
│   ├── skeleton.tsx
│   ├── layout-grid.tsx
│   ├── image-testimonial-grid.tsx
│   └── [other primitives]
└── shared/                             # Cross-role components
    ├── site-header.tsx                 # Main navigation
    ├── site-footer.tsx
    ├── route-feedback-shell.tsx        # Error/loading wrapper
    ├── page-hero.tsx                   # Hero section template
    ├── page-section-header.tsx
    ├── section-header.tsx
    ├── guide-card.tsx                  # Card component (guide profile)
    ├── listing-card.tsx                # Card component (listing)
    ├── tour-card.tsx
    ├── request-card.tsx
    ├── req-card.tsx
    ├── glass-card.tsx
    ├── status-badge.tsx
    ├── booking-status-badge.tsx
    ├── destination-badge.tsx
    ├── rating-display.tsx
    ├── transport-option-pill.tsx
    ├── favorite-toggle.tsx
    ├── workspace-role-nav.tsx          # Workspace sub-nav (current role tab + notifications)
    └── [other shared components]
```

### `/src/features` – Feature-Specific Modules

Each feature contains related components, types, utils, and hooks:

```
/src/features/
├── admin/                              # Admin moderation & management
│   ├── components/
│   │   ├── disputes/
│   │   │   ├── dispute-case-detail.tsx
│   │   │   └── disputes-queue.tsx
│   │   ├── guide-review-queue.tsx
│   │   └── listing-moderation-queue.tsx
│   └── types/
│       ├── disputes.ts
│       ├── guide-review.ts
│       └── listing-moderation.ts
├── auth/                               # Authentication flows
│   └── components/
│       └── auth-entry-screen.tsx
├── dashboard/                          # Dashboard views
│   └── components/
│       └── dashboard-overview.tsx
├── destinations/                       # Destination browsing
│   └── components/
│       └── destination-detail-screen.tsx
├── guide/                              # Guide workspace
│   ├── components/
│   │   ├── bookings/
│   │   │   ├── guide-booking-detail-screen.tsx
│   │   │   ├── guide-bookings-screen.tsx
│   │   │   └── guide-booking-status.tsx
│   │   ├── listings/
│   │   │   ├── guide-listing-create-screen.tsx
│   │   │   ├── guide-listing-detail-screen.tsx
│   │   │   ├── guide-listing-edit-screen.tsx
│   │   │   ├── guide-listings-manager-screen.tsx
│   │   │   ├── guide-listings-list-screen.tsx
│   │   │   ├── listing-form.tsx
│   │   │   └── listing-photo-upload-section.tsx
│   │   ├── requests/
│   │   │   ├── guide-request-detail-screen.tsx
│   │   │   ├── guide-requests-inbox-screen.tsx
│   │   │   └── offer-form-client.tsx
│   │   ├── onboarding/
│   │   │   ├── guide-onboarding-form.tsx
│   │   │   └── guide-onboarding-screen.tsx
│   │   ├── public/
│   │   │   ├── guide-profile-screen.tsx
│   │   │   ├── public-guide-card.tsx
│   │   │   ├── public-guide-reviews-summary.tsx
│   │   │   └── public-guide-trust-markers.tsx
│   │   └── verification/
│   │       ├── document-upload-card.tsx
│   │       ├── verification-upload-form.tsx
│   │       └── verification-types.ts
│   ├── types/
│   │   └── guide-onboarding.ts
│   └── utils/
│       └── guide-onboarding-schema.ts
├── homepage/                           # Marketing homepage
│   └── components/
│       ├── homepage-shell.tsx
│       ├── homepage-hero.tsx
│       ├── homepage-destinations.tsx   # Destination cards grid; aspect-[3/2] cards with bg-ink fallback + 3-stop gradient; featured card md:row-span-2
│       ├── homepage-gateway.tsx
│       ├── homepage-process.tsx
│       └── homepage-trust.tsx
├── listings/                           # Listing browsing
│   └── components/
│       └── public/
│           ├── listing-cover-art.tsx
│           ├── listing-detail-screen.tsx
│           ├── public-listing-card.tsx
│           ├── public-listing-discovery-screen.tsx
│           ├── public-listing-filters.tsx
│           └── itinerary-travel-segment.tsx
├── messaging/                          # Real-time chat
│   ├── components/
│   │   ├── chat-input.tsx
│   │   ├── chat-window.tsx
│   │   ├── conversation-list.tsx
│   │   └── message-bubble.tsx
│   └── hooks/
│       ├── use-realtime-messages.ts
│       └── use-unread-count.ts
├── notifications/                      # Notification center
│   └── components/
│       └── notification-center-screen.tsx
├── quality/                            # Quality metrics display
│   └── components/
│       └── marketplace-quality-card.tsx
├── requests/                           # Request creation & browsing
│   └── components/
│       ├── create-request-screen.tsx
│       └── public/
│           ├── public-request-detail-screen.tsx
│           └── public-requests-marketplace-screen.tsx
├── reviews/                            # Review system
│   └── components/
│       └── public/
│           └── public-reviews-section.tsx
└── traveler/                           # Traveler workspace
    └── components/
        ├── bookings/
        │   ├── traveler-booking-detail-screen.tsx
        │   ├── traveler-bookings-screen.tsx
        │   └── traveler-booking-status.tsx
        ├── favorites/
        │   └── traveler-favorites-screen.tsx
        ├── open-requests/
        │   ├── traveler-open-request-detail-screen.tsx
        │   └── traveler-open-requests-screen.tsx
        ├── request-create/
        │   ├── traveler-request-create-form.tsx
        │   └── traveler-request-create-screen.tsx
        ├── requests/
        │   ├── accept-offer-button.tsx
        │   ├── traveler-request-detail-screen.tsx
        │   └── traveler-request-status.tsx
        ├── reviews/
        │   └── traveler-booking-review-screen.tsx
        ├── traveler-dashboard-screen.tsx
        └── traveler-dashboard-screen-stats.tsx  # Stats + "getting started" 3-card onboarding when all counts = 0
```

### `/src/data` – Service Layer (Data Fetching & Mutations)

Each module exports typed functions that handle database operations. Components call these functions via server actions or client-side queries.

```
/src/data/
├── admin/supabase.ts
│   ├── listGuideApplicationsForAdminFromSupabase()
│   ├── saveGuideReviewDecisionInSupabase()
│   ├── listModerationListingsForAdminFromSupabase()
│   ├── saveListingModerationActionInSupabase()
│   ├── listDisputeCasesForAdminFromSupabase()
│   └── saveDisputeAdminUpdateInSupabase()
├── bookings/supabase.ts
│   ├── getBookingById()
│   ├── listBookingsForTraveler()
│   └── listBookingsForGuide()
├── conversations/supabase.ts
│   ├── getUserThreads()
│   ├── getThreadDetail()
│   └── [message operations]
├── destinations/
│   ├── index.ts – Destination data operations
│   └── types.ts
├── disputes/types.ts
├── favorites/
│   ├── active-user.ts
│   ├── supabase-client.ts
│   └── types.ts
├── guide-assets/supabase-client.ts
├── guide-booking/types.ts
├── guide-listing/
│   ├── schema.ts – Zod schemas for form validation
│   └── types.ts
├── guide-offer/
│   ├── schema.ts
│   ├── supabase.ts
│   └── types.ts
├── marketplace-events/client.ts
├── negotiations/
│   ├── index.ts
│   └── types.ts
├── notifications/
│   ├── demo.ts
│   ├── supabase.ts
│   └── types.ts
├── open-requests/
│   ├── supabase-client.ts
│   └── types.ts
├── public-guides/types.ts
├── public-listings/types.ts
├── quality/seed.ts
├── reviews/
│   ├── schema.ts
│   ├── supabase-client.ts
│   ├── supabase.ts
│   └── types.ts
├── supabase/queries.ts              # General read queries
├── traveler-booking/types.ts
├── traveler-request/
│   ├── schema.ts
│   ├── submit.ts
│   ├── supabase-client.ts
│   └── types.ts
```

### `/src/lib` – Core Library Functions

```
/src/lib/
├── app-version.ts
├── demo-session.ts
├── env.ts                              # Environment variable schema & parsing
├── utils.ts                            # Utility functions (cn, classname merging, etc.)
├── rate-limit.ts                       # Upstash Redis rate limiting
├── auth/
│   ├── server-auth.ts
│   ├── role-routing.ts
│   └── types.ts                        # AppRole, AuthContext, etc.
├── bookings/
│   ├── state-machine.ts                # Booking status transitions; _userId param kept for API compat (eslint-disable)
│   └── __tests__/state-machine.test.ts
├── notifications/
│   ├── create-notification.ts
│   └── triggers.ts                     # Notification workflow functions
├── storage/
│   ├── buckets.ts                      # Storage bucket config & validation
│   ├── client-upload.ts                # Browser-side file upload
│   ├── upload.ts                       # Server-side upload handler
│   └── __tests__/buckets.test.ts
├── supabase/
│   ├── admin.ts                        # Admin client (service role)
│   ├── client.ts                       # Browser client
│   ├── server.ts                       # Server client (SSR)
│   ├── middleware.ts                   # Auth middleware
│   ├── database.types.ts               # Generated from Supabase schema
│   ├── types.ts                        # Custom domain types
│   ├── bookings.ts
│   ├── conversations.ts                # _profile destructured-out in participants map (eslint-disable)
│   ├── disputes.ts                     # disputeStatusSchema kept but used as type only (eslint-disable)
│   ├── listings.ts
│   ├── offers.ts
│   ├── requests.ts
│   ├── reviews.ts
│   ├── moderation.ts
│   ├── request-members.ts
│   ├── listing-schema.ts
│   ├── __tests__/
│   │   ├── conversations.test.ts
│   │   └── requests.test.ts
│   └── queries.ts                      # Read queries (server/client)
├── upstash/redis.ts
└── __tests__/rate-limit.test.ts
```

### `/src/types` – Application Type Definitions

```
/src/types/
├── bun-test.d.ts
```

---

## API Routes & Endpoints

### Message/Messaging API

| Method | Path | Handler | Purpose |
|--------|------|---------|---------|
| `GET` | `/api/messages/threads` | `route.ts` | List all conversation threads for current user (rate limited, requires auth) |
| `GET` | `/api/messages/threads/[threadId]` | `[threadId]/route.ts` | Get specific conversation thread detail |
| `POST` | `/api/messages/threads/[threadId]` | `[threadId]/route.ts` | Send message to thread |
| `GET` | `/api/messages/unread-count` | `unread-count/route.ts` | Get count of unread messages |

**Rate Limit:** 30 requests per 60 seconds per IP

**Response Headers:**
- `X-RateLimit-Remaining` (number)

---

## React Components

### Layout Components

| Component | Path | Purpose |
|-----------|------|---------|
| `AppProviders` | `src/components/providers/app-providers.tsx` | Root context providers (Query Client, etc.) |
| `SiteHeader` | `src/components/shared/site-header.tsx` | Navigation header (public & auth) |
| `SiteFooter` | `src/components/shared/site-footer.tsx` | Footer with links & info |
| `RouteFeedbackShell` | `src/components/shared/route-feedback-shell.tsx` | Error & loading state wrapper |
| `WorkspaceRoleNav` | `src/components/shared/workspace-role-nav.tsx` | Workspace sub-nav: shows only current user's role tab + notifications link. Debug demo-switcher visible in dev only. |

### Card Components

| Component | Path | Purpose |
|-----------|------|---------|
| `GuideCard` | `src/components/shared/guide-card.tsx` | Display guide profile (compact) |
| `PublicGuideCard` | `src/features/guide/components/public/public-guide-card.tsx` | Guide card for public pages (destinations, guides listing); uses design tokens — no hardcoded white colors |
| `ListingCard` | `src/components/shared/listing-card.tsx` | Display tour listing (compact) |
| `TourCard` | `src/components/shared/tour-card.tsx` | Display tour with preview |
| `RequestCard` | `src/components/shared/request-card.tsx` | Display traveler request |
| `GlassCard` | `src/components/shared/glass-card.tsx` | Frosted glass UI card |
| `StatusBadge` | `src/components/shared/status-badge.tsx` | Status indicator (draft, published, etc.) |
| `BookingStatusBadge` | `src/components/shared/booking-status-badge.tsx` | Booking state indicator |
| `DestinationBadge` | `src/components/shared/destination-badge.tsx` | Destination label |
| `RatingDisplay` | `src/components/shared/rating-display.tsx` | Star rating display |
| `TransportOptionPill` | `src/components/shared/transport-option-pill.tsx` | Transport method badge |
| `FavoriteToggle` | `src/components/shared/favorite-toggle.tsx` | Heart button for favorites |

### Feature Components (Examples)

| Component | Path | Feature | Purpose |
|-----------|------|---------|---------|
| `ChatWindow` | `src/features/messaging/components/chat-window.tsx` | Messaging | Conversation display with messages |
| `ChatInput` | `src/features/messaging/components/chat-input.tsx` | Messaging | Message input & send |
| `ConversationList` | `src/features/messaging/components/conversation-list.tsx` | Messaging | Thread list sidebar |
| `MessageBubble` | `src/features/messaging/components/message-bubble.tsx` | Messaging | Individual message display |
| `GuideDashboardScreen` | `src/features/guide/components/dashboard/guide-dashboard-screen.tsx` | Guide Dashboard | Stats + verification step-indicator (Заявка подана → На проверке → Одобрено) when !isVerified |
| `GuideListingForm` | `src/features/guide/components/listings/listing-form.tsx` | Guide Listings | Create/edit listing form |
| `GuideProfileScreen` | `src/features/guide/components/public/guide-profile-screen.tsx` | Guide Public | Public guide profile page; name genitive uses endsWith("й") → replace with "я" rule |
| `OfferFormClient` | `src/features/guide/components/requests/offer-form-client.tsx` | Guide Requests | Create offer form |
| `PublicRequestDetailScreen` | `src/features/requests/components/public/public-request-detail-screen.tsx` | Requests | Public request detail; unauthenticated join CTA links to /auth?next=... (not /auth/login) |
| `TravelerRequestCreateForm` | `src/features/traveler/components/request-create/traveler-request-create-form.tsx` | Traveler Requests | Create request form |
| `NotificationCenterScreen` | `src/features/notifications/components/notification-center-screen.tsx` | Notifications | Notification list & management |
| `PublicListingDiscoveryScreen` | `src/features/listings/components/public/public-listing-discovery-screen.tsx` | Listings | Public listing grid with filter pills; page wraps in max-w-page container (listings/page.tsx) |
| `PublicRequestsMarketplaceScreen` | `src/features/requests/components/public/public-requests-marketplace-screen.tsx` | Requests | Public request marketplace with category pills and search |
| `AdminDashboardPage` | `src/app/(protected)/admin/dashboard/page.tsx` | Admin | Moderation overview; stat cards link to /admin/* sections; uses Badge header pattern |

---

## Data Models & Schemas

### Database Schema

Provodnik uses PostgreSQL (via Supabase) with the following core tables:

#### Core User Tables

| Table | Purpose | Key Fields |
|-------|---------|-----------|
| `profiles` | User accounts (all roles) | `id` (FK: auth.users), `role` (enum), `email`, `full_name`, `phone`, `avatar_url` |
| `guide_profiles` | Extended guide data | `user_id` (PK), `slug`, `display_name`, `bio`, `years_experience`, `regions[]`, `languages[]`, `specialties[]`, `verification_status` (enum), `rating`, `completed_tours`, `is_available` |

#### Marketplace Tables

| Table | Purpose | Key Fields |
|-------|---------|-----------|
| `listings` | Tour offerings | `id`, `guide_id`, `slug`, `title`, `region`, `city`, `category`, `description`, `duration_minutes`, `max_group_size`, `price_from_minor`, `currency`, `status` (enum: draft\|published\|paused\|rejected), `featured_rank` |
| `traveler_requests` | Tour requests by travelers | `id`, `traveler_id`, `destination`, `region`, `category`, `starts_on`, `ends_on`, `budget_minor`, `participants_count`, `open_to_join`, `status` (enum: open\|booked\|cancelled\|expired) |
| `guide_offers` | Guide responses to requests | `id`, `request_id`, `guide_id`, `listing_id`, `title`, `message`, `price_minor`, `capacity`, `starts_at`, `ends_at`, `inclusions[]`, `expires_at`, `status` (enum: pending\|accepted\|declined\|expired\|withdrawn) |

#### Booking & Transaction Tables

| Table | Purpose | Key Fields |
|-------|---------|-----------|
| `bookings` | Confirmed tours | `id`, `traveler_id`, `guide_id`, `request_id`, `offer_id`, `listing_id`, `status` (enum: pending\|awaiting_guide_confirmation\|confirmed\|cancelled\|completed\|disputed\|no_show), `party_size`, `starts_at`, `ends_at`, `subtotal_minor`, `deposit_minor`, `remainder_minor`, `currency` |
| `reviews` | Post-tour reviews | `id`, `booking_id`, `traveler_id`, `guide_id`, `listing_id`, `rating` (1-5), `title`, `body`, `status` (enum: published\|flagged\|hidden) |
| `favorites` | Saved guides/listings | `id`, `user_id`, `subject` (enum: listing\|guide), `listing_id`, `guide_id` |

#### Messaging & Support Tables

| Table | Purpose | Key Fields |
|-------|---------|-----------|
| `conversation_threads` | Conversation grouping | `id`, `subject_type` (enum: request\|offer\|booking\|dispute), `request_id`, `offer_id`, `booking_id`, `dispute_id`, `created_by` |
| `thread_participants` | Thread membership | `thread_id`, `user_id`, `joined_at`, `last_read_at` |
| `messages` | Chat messages | `id`, `thread_id`, `sender_id`, `sender_role` (enum: traveler\|guide\|admin\|system), `body`, `metadata`, `created_at` |

#### Disputes & Resolution

| Table | Purpose | Key Fields |
|-------|---------|-----------|
| `disputes` | Booking disputes | `id`, `booking_id`, `opened_by`, `assigned_admin_id`, `status` (enum: open\|under_review\|resolved\|closed), `reason`, `summary`, `requested_outcome`, `payout_frozen`, `resolution_summary` |
| `dispute_notes` | Admin notes | `id`, `dispute_id`, `author_id`, `note`, `internal_only` |
| `dispute_evidence` | Supporting files | `id`, `dispute_id`, `asset_id`, `uploaded_by`, `label` |

#### Notifications & Events

| Table | Purpose | Key Fields |
|-------|---------|-----------|
| `notifications` | User alerts | `id`, `user_id`, `kind` (enum: new_offer\|offer_expiring\|booking_created\|etc), `title`, `body`, `href`, `is_read` |
| `notification_deliveries` | Delivery tracking | `id`, `notification_id`, `channel`, `status`, `provider_message_id`, `delivered_at` |
| `marketplace_events` | Event audit log | `id`, `scope` (enum: request\|booking\|dispute\|moderation), `event_type`, `summary`, `detail`, `payload`, `created_at` |

#### Moderation & Admin

| Table | Purpose | Key Fields |
|-------|---------|-----------|
| `moderation_cases` | Content review queues | `id`, `subject_type` (enum: guide_profile\|listing\|review), `guide_id`, `listing_id`, `review_id`, `assigned_admin_id`, `status`, `queue_reason`, `risk_flags[]` |
| `moderation_actions` | Moderation decisions | `id`, `case_id`, `admin_id`, `decision` (enum: approve\|reject\|request_changes\|hide\|restore), `note` |
| `quality_snapshots` | Quality metrics | `subject_type`, `subject_slug`, `tier`, `response_time_hours`, `completion_rate`, `rating_avg`, `review_count` |

#### Media & Storage

| Table | Purpose | Key Fields |
|-------|---------|-----------|
| `storage_assets` | File metadata | `id`, `owner_id`, `bucket_id`, `object_path`, `asset_kind` (enum: guide-avatar\|guide-document\|listing-cover\|listing-gallery\|dispute-evidence), `mime_type`, `byte_size` |
| `guide_documents` | KYC/verification docs | `id`, `guide_id`, `asset_id`, `document_type`, `status`, `reviewed_by`, `reviewed_at` |
| `listing_media` | Tour photos | `id`, `listing_id`, `asset_id`, `is_cover`, `sort_order`, `alt_text` |

#### Special Tables

| Table | Purpose | Key Fields |
|-------|---------|-----------|
| `destinations` | Curated destination pages | `id`, `slug`, `name`, `region`, `category`, `description`, `hero_image_url`, `listing_count`, `guides_count`, `rating` |
| `open_request_members` | Group request participants | `request_id`, `traveler_id`, `status` (enum: joined\|left), `joined_at`, `left_at` |

### Enum Types (PostgreSQL)

```sql
app_role                    = 'traveler' | 'guide' | 'admin'
guide_verification_status   = 'draft' | 'submitted' | 'approved' | 'rejected'
listing_status              = 'draft' | 'published' | 'paused' | 'rejected'
request_status              = 'open' | 'booked' | 'cancelled' | 'expired'
offer_status                = 'pending' | 'accepted' | 'declined' | 'expired' | 'withdrawn'
booking_status              = 'pending' | 'awaiting_guide_confirmation' | 'confirmed' | 'cancelled' | 'completed' | 'disputed' | 'no_show'
review_status               = 'published' | 'flagged' | 'hidden'
dispute_status              = 'open' | 'under_review' | 'resolved' | 'closed'
notification_kind           = 'new_offer' | 'offer_expiring' | 'booking_created' | 'booking_confirmed' | 'booking_cancelled' | 'booking_completed' | 'dispute_opened' | 'review_requested' | 'admin_alert'
thread_subject              = 'request' | 'offer' | 'booking' | 'dispute'
message_sender_role         = 'traveler' | 'guide' | 'admin' | 'system'
event_scope                 = 'request' | 'booking' | 'dispute' | 'moderation'
moderation_decision         = 'approve' | 'reject' | 'request_changes' | 'hide' | 'restore'
```

### Validation Schemas (Zod)

Key schemas defined in data modules:

- `guide-listing/schema.ts` – Listing creation/edit
- `guide-offer/schema.ts` – Offer creation
- `traveler-request/schema.ts` – Request creation
- `reviews/schema.ts` – Review submission
- `guide/utils/guide-onboarding-schema.ts` – Guide profile onboarding

---

## Configuration Files

### `tsconfig.json`

TypeScript configuration:
- **Target:** ES2017
- **Module:** ESNext
- **Strict mode:** Enabled
- **Path aliases:** `@/*` → `./src/*`

### `next.config.ts`

Next.js configuration:
- **React Compiler:** Enabled
- **Turbopack:** Enabled with system TLS certs
- **Remote images:** Allowed from `images.unsplash.com`
- **Security headers:**
  - X-Frame-Options: DENY
  - X-Content-Type-Options: nosniff
  - Referrer-Policy: strict-origin-when-cross-origin
  - Permissions-Policy: camera=(), microphone=(), geolocation=()
  - HSTS: max-age=63072000 (2 years)

### `tailwind.config.ts`

Tailwind CSS with CSS custom properties (CSS variables):
- **Color tokens:** `--brand`, `--surface`, `--ink`, `--glass-*`, `--border`, `--input`, `--ring`, etc.
- **Font families:** `--font-serif`, `--font-sans`, `--font-display`
- **Shadows:** `--glass-shadow`, `editorial`

See `DESIGN.md` for complete token reference.

### `supabase/config.toml`

Local Supabase configuration for development.

### `package.json`

| Script | Command | Purpose |
|--------|---------|---------|
| `dev` | `next dev` | Local dev server (port 3000) |
| `build` | `next build` | Production build |
| `start` | `next start` | Start production server |
| `test` | `vitest` | Run tests in watch mode |
| `test:run` | `vitest run` | Run tests once |
| `lint` | `eslint` | Lint code |
| `typecheck` | `tsc --noEmit` | Type check only |
| `check` | `tsc --noEmit && eslint` | Type check + lint |
| `db:reset` | `supabase db reset` | Reset local DB + seed |
| `db:diff` | `supabase db diff --schema public` | Generate migration |
| `db:push` | `supabase db push` | Push migrations to hosted |
| `db:migrate` | `supabase migration new` | Create blank migration |
| `types` | `supabase gen types typescript --local` | Generate types from local DB |
| `types:remote` | `supabase gen types typescript --linked` | Generate types from hosted DB |

---

## Scripts & Utilities

### Database Migrations

Migrations are in `/supabase/migrations/`:

| Migration | Date | Purpose |
|-----------|------|---------|
| `20260331120000_phase1_auth_foundation.sql` | 2026-03-31 | Initial auth & user tables |
| `20260331121000_phase1_auth_seed_accounts.sql` | 2026-03-31 | Demo accounts |
| `20260331130000_phase1_rls_audit.sql` | 2026-03-31 | RLS policy audit |
| `20260401000000_drop_all.sql` | 2026-04-01 | Full schema reset |
| `20260401000001_schema.sql` | 2026-04-01 | Complete schema (all tables) |
| `20260401000002_seed.sql` | 2026-04-01 | Demo data seed |
| `20260401000003_auth_hook_role_claim.sql` | 2026-04-01 | Auth role JWT hook |
| `20260401100000_messaging_rls_realtime.sql` | 2026-04-01 | Messaging RLS & Realtime |
| `20260401100001_notifications_rls.sql` | 2026-04-01 | Notification RLS |
| `20260401200000_storage_buckets.sql` | 2026-04-01 | Storage bucket setup |

### Build & Dev Scripts

- `/scripts/build_investor_ru_pdf.py` – PDF generation (investor docs)
- `/scripts/generate_investor_one_pager.py` – One-pager generation
- `/scripts/create_implementation_issues.md` – Issue template generator

---

## Key Architectural Patterns

### 1. Authentication & Authorization

**Flow:**
1. Supabase Auth handles sign up/sign in
2. `auth.users` table stores credentials
3. `profiles` table extended with `role` (traveler | guide | admin)
4. Auth hook inserts `role` into JWT claims
5. RLS policies enforce role-based access

**Key Files:**
- `src/lib/auth/server-auth.ts` – Get current user
- `src/lib/auth/role-routing.ts` – Route guards by role
- `src/lib/supabase/middleware.ts` – Request-level auth setup

### 2. Role-Based Access Control (RBAC)

**Three roles:**
- **Traveler:** Browse, request tours, book, leave reviews
- **Guide:** Create listings, respond to requests, manage bookings, KYC
- **Admin:** Moderate content, manage disputes, review guides

**Implementation:**
- Database RLS policies enforce row-level security
- Client-side route groups: `(site)/`, `(protected)/admin/`, `(protected)/guide/`, `(protected)/traveler/`
- `current_profile_role()` SQL function for policy checks
- `is_admin()`, `is_guide()` helper functions

### 3. Data Fetching Strategy

**Server-Side Rendering (SSR):**
- Pages fetch directly in async server components
- Uses `createServerClient()` for Supabase access
- No useEffect, no waterfall requests

**Client-Side Queries:**
- TanStack React Query for dynamic/filtered data
- Cache helpers for optimal sync with backend
- Hooks: `useQuery`, `useMutation`, `useInfiniteQuery`

**Service Layer Pattern:**
- All data operations in `/src/data/` modules
- Functions accept `SupabaseClient` as parameter
- Work from both server and client contexts

### 4. State Management

**No Redux/Context for async state:**
- TanStack Query handles server state (caching, sync, mutations)
- React Hook Form for local form state
- CSS/Tailwind for UI state (mobile nav, modals, etc.)

**Pattern:**
```typescript
// Server component (fetch at route time)
const data = await getListings(supabase);

// Client component (fetch on demand)
const { data } = useQuery({
  queryKey: ['listings'],
  queryFn: () => getListings(client),
});

// Form state
const form = useForm({ ... });
```

### 5. Form Handling

**React Hook Form + Zod:**
- Declarative validation schemas (Zod)
- Minimal re-renders
- Integrated error handling
- Server action integration

**Example:**
```typescript
const schema = z.object({
  title: z.string().min(3),
  price_minor: z.number().min(0),
});

const form = useForm({ resolver: zodResolver(schema) });
const onSubmit = async (data) => await submitListing(data);
```

### 6. Real-Time Messaging

**Supabase Realtime:**
- Subscribe to `messages` table changes
- Custom hook: `useRealtimeMessages(threadId)`
- Automatic UI updates on new messages

**Flow:**
1. User sends message → Server action inserts row
2. Supabase broadcasts change
3. `useRealtimeMessages()` hook updates state
4. UI re-renders with new message

### 7. File Storage

**Storage Buckets:**
- `guide-avatars` – Public, 2MB max, images only
- `guide-documents` – Private, 10MB max, images + PDF
- `listing-media` – Public, 5MB max, images only
- `dispute-evidence` – Private, 10MB max, images + PDF

**Upload Flow:**
1. Client generates presigned URL (server action)
2. Browser uploads directly to Supabase Storage
3. Server records metadata in `storage_assets` table
4. RLS prevents unauthorized access

### 8. Notifications

**Trigger Functions (`src/lib/notifications/triggers.ts`):**
```typescript
notifyNewOffer(requestId, offerId)
notifyBookingCreated(bookingId)
notifyBookingConfirmed(bookingId)
notifyBookingCancelled(bookingId, cancelledByRole)
notifyReviewRequested(bookingId)
notifyDisputeOpened(disputeId)
```

**Called from:** Server actions, database triggers, scheduled jobs

### 9. Booking State Machine

**States:** `pending` → `confirmed` | `cancelled` | `disputed` → `completed`

**Transitions:**
```typescript
BOOKING_TRANSITIONS = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['completed', 'cancelled', 'disputed'],
  completed: [],
  cancelled: [],
  disputed: ['cancelled'],
};
```

**Validation:** `canTransition(from, to)` checks allowed transitions

### 10. Rate Limiting

**Upstash Redis:**
- API endpoints rate limited by IP
- 30 requests per 60 seconds (default)
- Returns 429 with `X-RateLimit-Remaining` header

**Usage:**
```typescript
const result = await rateLimit(clientId, limit, window);
if (!result.success) return 429 response;
```

### 11. Error Handling

**Patterns:**
- Server actions throw typed errors
- Client-side error boundaries via `error.tsx`
- Zod validation errors bubble to UI
- Toast/snackbar for user feedback (via components)

### 12. Row-Level Security (RLS)

**Core Principle:** Database enforces access control

**Examples:**
```sql
-- Profiles: users can read own, admins see all
CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Admins can read all"
  ON profiles FOR SELECT USING (is_admin());

-- Messages: thread participants can read
CREATE POLICY "Thread participants can read"
  ON messages FOR SELECT USING (
    auth.uid() IN (SELECT user_id FROM thread_participants WHERE thread_id = messages.thread_id)
  );
```

---

## Testing

### Test Files

| File | Coverage |
|------|----------|
| `src/lib/bookings/__tests__/state-machine.test.ts` | Booking state transitions |
| `src/lib/storage/__tests__/buckets.test.ts` | Storage bucket config |
| `src/lib/supabase/__tests__/conversations.test.ts` | Message thread operations |
| `src/lib/supabase/__tests__/requests.test.ts` | Request queries |
| `src/lib/__tests__/rate-limit.test.ts` | Rate limiting |

### Running Tests

```bash
bun run test            # Watch mode
bun run test:run        # Run once
```

### Test Framework

- **Vitest** – Fast unit testing
- **@testing-library/react** – Component testing
- **JSDOM** – DOM simulation

---

## Dependencies

### Core Framework

| Package | Version | Purpose |
|---------|---------|---------|
| next | 16.1.6 | React framework with SSR |
| react | 19.2.3 | UI library |
| react-dom | 19.2.3 | DOM rendering |
| typescript | 5.x | Type checking |

### UI & Styling

| Package | Version | Purpose |
|---------|---------|---------|
| tailwindcss | 4.x | Utility CSS |
| radix-ui | 1.4.3 | Headless UI components |
| lucide-react | 0.577.0 | SVG icons |
| framer-motion | 12.36.0 | Animations |
| class-variance-authority | 0.7.1 | Component variants |
| clsx | 2.1.1 | Classname utilities |
| tailwind-merge | 3.5.0 | Class merging |
| tw-animate-css | 1.4.0 | Tailwind animations |

### Data & State

| Package | Version | Purpose |
|---------|---------|---------|
| @tanstack/react-query | 5.90.21 | Server state management |
| @supabase/supabase-js | 2.99.1 | Supabase client SDK |
| @supabase/ssr | 0.9.0 | SSR auth integration |
| zod | 4.3.6 | Schema validation |

### Forms

| Package | Version | Purpose |
|---------|---------|---------|
| react-hook-form | 7.71.2 | Form state management |
| @hookform/resolvers | 5.2.2 | Zod integration with RHF |

### Infrastructure

| Package | Version | Purpose |
|---------|---------|---------|
| @upstash/redis | 1.37.0 | Rate limiting |
| supabase | 2.78.1 | CLI & local dev |

### Dev Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| vitest | 4.1.2 | Test runner |
| @testing-library/react | 16.3.2 | Component testing |
| @testing-library/dom | 10.4.1 | DOM testing utilities |
| @testing-library/jest-dom | 6.9.1 | Matchers |
| jsdom | 29.0.1 | DOM implementation |
| eslint | 9.x | Linting |
| babel-plugin-react-compiler | 1.0.0 | React 19 compiler |

---

## Claude Code Integration (.claude/)

### `.claude/settings.local.json`

Local Claude Code configuration:

```json
{
  // Custom settings for this workspace
}
```

### `.claude/skills/`

Reusable skills for code generation:

- **ui-ux-pro-max/** – Design system skills
  - Data files for: icons, colors, typography, palettes, font pairings, charts, UI stacks (React, Next.js, Vue, Svelte, SwiftUI, React Native, Flutter, Tailwind, shadcn/ui)
  - 67 styles, 96 palettes, 57 font pairings, 25 charts, 13 stacks

### Workflow

**When starting a session:**

1. This CODEBASE.md is loaded to provide context
2. For feature work, invoke Codex via `codex exec --dangerously-bypass-approvals-and-sandbox`
3. For small fixes, Claude handles directly
4. Always use `bun` as package manager

**Superpowers (Agent-Agnostic Skills):**
- `systematic-debugging` – Before any bug fix
- `writing-plans` – Before planning features
- `dispatching-parallel-agents` – Multiple parallel tasks
- `verification-before-completion` – Before committing

---

## Environment Variables

Required variables in `.env.local`:

```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=https://[project].supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=[anon key]
SUPABASE_SECRET_KEY=[service role key]
```

For rate limiting (production):
```env
UPSTASH_REDIS_REST_URL=[redis url]
UPSTASH_REDIS_REST_TOKEN=[redis token]
```

---

## Quick Reference

### Common Commands

```bash
# Development
bun dev                    # Start dev server
bun run typecheck          # Type check
bun run lint              # Lint code
bun run test              # Run tests

# Database
bun run db:reset          # Reset local DB + seed
bun run db:diff           # Generate migration
bun run types             # Regenerate types

# Deployment
bun run build             # Production build
bun start                 # Start production server
```

### Key Paths

- **App:** `/mnt/rhhd/projects/provodnik/provodnik.app`
- **Tasks:** `/mnt/rhhd/projects/provodnik/provodnik.app-Tasks`
- **Source:** `/mnt/rhhd/projects/provodnik/provodnik.app/src`
- **Database schema:** `/mnt/rhhd/projects/provodnik/provodnik.app/supabase/migrations`
- **Design tokens:** `/mnt/rhhd/projects/provodnik/DESIGN.md`

### Important Documentation

- `PRODUCT.md` – Product vision & requirements
- `DESIGN.md` – Design tokens, colors, typography
- `PLAN.md` – Roadmap & milestones
- `AGENTS.md` – Team context
- `provodnik.app/CLAUDE.md` – Development instructions

---

**End of CODEBASE.md**
