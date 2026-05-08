# MVP: Provodnik

## 1. Product definition

`Provodnik` MVP is a mobile-first marketplace for tours and excursions in Russia that combines:

- ready-made tour listings;
- traveler-created requests;
- group formation for budget-sensitive travelers;
- guide responses and offers;
- trusted booking, reservation, and review workflows.

The MVP is not a generic excursion catalog. It is a transaction system for the fragmented part of the market that still runs through Telegram chats, phone calls, and manual coordination.

## 2. MVP goal

Launch the smallest version of `Provodnik` that can:

- attract travelers with real intent;
- onboard credible local guides;
- convert requests and listings into paid bookings;
- keep trust, refunds, and moderation under control;
- prove repeatable liquidity in a narrow regional wedge.

## 3. Users

### 3.1 Travelers

- solo travelers;
- couples and small groups;
- budget-sensitive users willing to join a group;
- travelers who know destination and dates but cannot find a suitable offer;
- travelers who need a guide to propose a custom format.

### 3.2 Guides and local operators

- independent guides;
- local mini-operators;
- regional organizers with weak digital distribution;
- guides who want lower commission and direct demand.

### 3.3 Admin and operations

- moderators;
- support managers;
- dispute and refund operators;
- supply onboarding staff.

## 4. Pain points to solve

### 4.1 Traveler pain points

- fixed listings do not cover many real needs;
- private tours are often too expensive for small budgets;
- group assembly is manual and unreliable;
- trust is fragmented across chats, social media, and word of mouth;
- communication with guides is chaotic and slow;
- unclear refund and cancellation expectations increase booking anxiety.

### 4.2 Guide pain points

- high commission on incumbent marketplaces reduces margin;
- fragmented lead flow across multiple channels wastes time;
- poor lead qualification causes low-conversion conversations;
- manual coordination of dates, group size, and price is inefficient;
- reputation is scattered across unrelated platforms;
- unreliable travelers create operational risk.

### 4.3 Platform and category pain points

- disintermediation risk after first contact;
- fake listings and fake reviews;
- guide attestation and compliance requirements in Russia;
- high response speed expectations in a competitive category;
- refunds, cancellations, and disputes must be standardized;
- high-risk experiences create outsized trust and liability issues.

## 5. MVP principles

- `request-first`, but not request-only;
- `mobile-first` because demand is mobile-heavy;
- `trust before growth`;
- `fast response` as a product requirement, not support detail;
- `structured negotiation`, not unbounded bargaining;
- `regional wedge first`, not nationwide breadth.

## 6. Core MVP scope

### 6.1 Traveler-facing functionality

#### Discovery

- browse tours by region, city, category, date, price, duration, and format;
- view SEO-ready listing pages for tours and guides;
- search by destination, activity type, and keyword;
- filter by private/group, child-friendly, language, availability, price, and rating;
- save favorites.

#### Request creation

Travelers can create a request with:

- destination or region;
- preferred dates or date range;
- budget per person or total budget;
- number of participants;
- category or experience type;
- private or group preference;
- optional notes, pickup constraints, and child requirements;
- whether they are open to joining others;
- whether they accept guide suggestions outside exact constraints.

#### Group formation

- browse open traveler requests that allow joining;
- join an existing request if dates, region, and budget fit;
- see current participant count and estimated per-person price impact;
- leave a group before booking lock;
- auto-close group join once capacity is reached or booking is confirmed.

#### Offers and communication

- receive offers from guides on created requests;
- compare offers by price, inclusions, capacity, timing, language, and rating;
- ask clarifying questions in platform chat;
- accept, decline, or let an offer expire;
- see response-time indicators and booking deadlines.

#### Booking and reservation

- book ready-made listings or accepted custom offers;
- confirm a reservation inside the platform without requiring integrated payment in MVP;
- see payment expectations, timing, and accepted methods even if settlement happens outside the platform during MVP;
- receive booking confirmation with guide details, itinerary summary, meeting point, and cancellation terms;
- view booking timeline and status changes;
- request cancellation or support from the booking page.

#### Post-booking trust

- receive reminders before the tour;
- confirm completion after experience;
- leave rating and review;
- report safety or fraud issues.

### 6.2 Guide-facing functionality

#### Onboarding

- register with phone/email authentication;
- create public profile with photo, bio, languages, regions, specialties, and years of experience;
- submit identity and attestation data;
- submit bank or payout details;
- accept marketplace rules and cancellation standards.

#### Verification

- identity review;
- attestation-status field for regulated experiences;
- manual approval before public publishing;
- visible trust markers on approved profiles.

#### Supply creation

- create and edit ready-made listings;
- define title, region, route, duration, max group size, inclusions, exclusions, meeting point, photos, seasonality, and categories;
- set base price rules for private or shared formats;
- mark instant-book or manual confirmation;
- set cancellation terms within platform policy bounds;
- pause listings by date or season.

#### Request response flow

- view traveler requests matched by region/category/date;
- respond with a structured offer instead of free-form chat only;
- specify price, inclusions, timing, capacity, and message;
- set offer expiry;
- convert joined-group demand into one confirmed booking.

#### Booking operations

- confirm or reject manual bookings within SLA;
- see reservation and payment-status expectations;
- message travelers in a booking thread;
- mark booking completed;
- manage cancellation reasons and no-show outcomes.

#### Reputation and performance

- see profile rating, review count, response time, cancellation rate, and completion rate;
- understand when poor performance affects ranking or visibility;
- receive notifications for new requests, new messages, and expiring offers.

### 6.3 Admin and operations functionality

#### Moderation

- review guide applications;
- approve, reject, or request more documents;
- review listings before or after publication;
- hide non-compliant or risky offers;
- review flagged chats, reviews, and disputes.

#### Marketplace control

- manage categories, regions, and featured supply;
- configure commission and booking policy settings;
- monitor response times, dispute rate, and refund volume;
- detect suspected off-platform leakage signals.

#### Support and disputes

- open a case on cancellations, no-shows, fraud, or service-quality complaints;
- issue refunds according to policy;
- freeze payouts when necessary;
- store internal case notes and resolution history.

## 7. Pain point to solution mapping

| Pain point | MVP solution |
| --- | --- |
| Travelers cannot find a suitable listing | Request creation plus guide offer workflow |
| Private tours are too expensive | Group join flow and shared-price offers |
| Group assembly is chaotic | Structured open requests with join state and capacity |
| Trust is fragmented | Verified guide profile, ratings, reviews, booking records |
| Communication is unstructured | In-platform chat tied to request, offer, and booking |
| Slow guide response hurts conversion | Notifications, response SLA, response-time indicators |
| High commission hurts guide economics | Lower-take marketplace positioning |
| Leads are poorly qualified | Structured request fields with budget, dates, and group size |
| Refund expectations are unclear | Standardized cancellation and refund policy surfaced pre-booking |
| Compliance risk | Identity review, attestation fields, moderation workflow |
| Disintermediation risk | Contact gating until reservation confirmation |
| Fake supply or abuse | Manual approval, flagging, moderation, dispute tooling |

## 8. Primary user flows

### 8.1 Traveler booking from listing

1. Traveler lands on a city or category page.
2. Traveler filters listings.
3. Traveler opens a listing and reviews guide trust markers.
4. Traveler selects date and party size.
5. Traveler confirms the reservation.
6. Guide confirms if required.
7. Traveler receives confirmation and reminders.
8. Tour completes and review request is sent.

### 8.2 Traveler request to booking

1. Traveler creates a request with dates, budget, and region.
2. Matching guides receive alerts.
3. Guides send structured offers.
4. Traveler compares offers and asks follow-up questions.
5. Traveler accepts one offer.
6. Booking object is created.
7. Reservation is confirmed with explicit payment instructions.
8. Guide fulfills tour and both sides can review.

### 8.3 Group formation flow

1. Traveler creates a request and marks it open for joining.
2. Other travelers discover the request and join.
3. Participant count updates the economics of the group.
4. Guide proposes an offer for the assembled group.
5. Group lock occurs when offer is accepted.
6. Deposits are collected and final roster is confirmed.

### 8.4 Guide onboarding to first booking

1. Guide signs up.
2. Guide submits profile and verification details.
3. Admin approves guide.
4. Guide publishes listing and/or responds to requests.
5. Guide receives first booking.
6. Guide completes trip and earns first review.

## 9. Screens and pages required in MVP

### 9.1 Public pages

- homepage;
- regional landing pages;
- city pages;
- category pages;
- guide profile pages;
- tour listing pages;
- request discovery pages for open groups;
- help, trust, cancellation, and refund policy pages.

### 9.2 Traveler account

- sign up and login;
- profile;
- favorites;
- my requests;
- request detail with offers and chat;
- my bookings;
- booking detail;
- reviews.

### 9.3 Guide dashboard

- onboarding and verification;
- profile editor;
- listing manager;
- incoming requests;
- offers;
- bookings;
- messages;
- performance summary.

### 9.4 Admin panel

- guide queue;
- listing moderation;
- disputes and refunds;
- platform analytics;
- policy controls.

## 10. Booking, payment, and trust rules

### 10.1 Booking model

- booking confirmation rules must be explicit;
- remaining payment rules must be shown before reservation is confirmed;
- booking status must be explicit: `pending`, `awaiting guide confirmation`, `confirmed`, `cancelled`, `completed`, `disputed`.

### 10.2 Contact exchange policy

- direct personal contact details remain hidden until booking confirmation;
- pre-booking chat is allowed inside the platform only.

### 10.3 Cancellation and refund policy

- traveler cancellation windows must be standardized;
- guide cancellations incur ranking or moderation consequences;
- refund logic must be visible before reservation is confirmed;
- admin can override in dispute cases with audit notes.

### 10.4 Review policy

- only completed bookings can generate reviews;
- one review per traveler per completed booking;
- flagged reviews enter moderation.

## 11. Notifications required in MVP

- new guide offer on traveler request;
- new traveler message;
- new request match for guide;
- booking created;
- reservation confirmed;
- booking confirmed or rejected;
- upcoming trip reminder;
- cancellation and refund status update.

Channels:

- email;
- push or Telegram later, but email plus in-app is enough for MVP;
- in-app notification center.

## 12. Search, ranking, and marketplace logic

### 12.1 Listing ranking

Prioritize:

- relevance to region and filters;
- rating and review count;
- response time;
- completion rate;
- recency of activity;
- manual featuring for launch regions.

### 12.2 Request matching

Notify guides based on:

- region;
- category;
- dates;
- budget fit;
- group-size capability;
- attestation or compliance compatibility.

### 12.3 Supply quality controls

- inactive guides are deprioritized;
- high cancellation rate lowers visibility;
- missing documents block publishing;
- repeated policy violations trigger suspension.

## 13. Non-functional MVP requirements

- mobile-first responsive UX;
- page speed suitable for low-end mobile devices;
- Russian-language first;
- clear legal and policy copy;
- audit trail for refunds, moderation, and disputes;
- basic analytics for funnel tracking;
- role-based access control for traveler, guide, and admin;
- secure document handling.

## 14. Launch slice

### 14.1 Recommended initial geography

- start with `1 to 3` regions;
- prioritize destinations with year-round demand and active local guides;
- avoid operationally risky categories at launch.

### 14.2 Recommended initial categories

- city tours;
- nature day trips;
- small-group regional excursions;
- family-friendly formats;
- low-complexity, low-liability experiences.

### 14.3 Categories to avoid at launch

- high-risk adventure tours;
- multi-day complex expeditions;
- categories with unclear regulatory burden;
- heavy B2B or agency workflows.

## 15. What is intentionally out of scope

- flights and hotels;
- full CRM for operators;
- dynamic marketplace pricing engine;
- multilingual expansion beyond Russian-first;
- native mobile apps;
- large-scale loyalty program;
- full insurance and visa products.

## 16. MVP success metrics

### 16.1 Liquidity

- active approved guides per launch region;
- traveler requests per week;
- guide response rate to requests;
- median time to first offer;
- request-to-booking conversion.

### 16.2 Commerce

- confirmed bookings;
- GMV;
- reservation conversion rate;
- cancellation rate;
- refund rate.

### 16.3 Trust

- average guide rating;
- review completion rate;
- dispute rate;
- moderation rejection rate;
- off-platform leakage indicators.

## 17. Release order

### Release 1: transaction foundation

- auth;
- traveler and guide profiles;
- guide verification;
- listing creation;
- listing discovery;
- request creation;
- offer flow;
- booking confirmation without integrated payment;
- basic admin moderation.

### Release 2: marketplace quality

- open group joining;
- favorites;
- review system;
- notification center;
- ranking signals;
- dispute handling.

### Release 3: optimization

- stronger analytics;
- featured supply controls;
- operational dashboards;
- anti-circumvention heuristics;
- expanded category templates.

## 18. Bottom line

The full MVP for `Provodnik` is a trust-aware marketplace, not a brochure site. It must launch with the complete non-payment transaction loop:

- discovery;
- request capture;
- group formation;
- guide response;
- booking confirmation;
- reviews;
- moderation;
- refunds and support.

If any of those parts are missing, the product will fall back into the same pain points it is supposed to fix: fragmented discovery, slow coordination, weak trust, and manual group assembly.
