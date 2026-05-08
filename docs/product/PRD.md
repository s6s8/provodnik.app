# PRD: Provodnik

## 1. One-line definition

Provodnik is a marketplace for tours and excursions across Russia where travelers can find ready-made offers, create requests based on budget and dates, join groups, and book with guides who pay a lower commission than on major aggregators.

## 2. Product vision

`Provodnik` is not just a catalog of excursions. It is a demand-and-supply marketplace for tourism in Russia that brings together a fragmented market currently spread across Telegram chats, phone calls, Instagram, Avito, personal contacts, and a few large but inflexible aggregators.

The product should help:

- travelers find tours faster, cheaper, and with more transparency;
- guides and small tour operators get an additional high-intent sales channel;
- the market move from chaotic manual communication to structured discovery, negotiation, booking, and reputation management.

## 3. Problem statement

The current tours and excursions market in Russia is fragmented and partially digitized.

Current pain points:

- large portals like Tripster and Sputnik are important, but do not cover the entire market;
- commissions are high, which makes final prices less competitive;
- many local guides and mini-operators still rely on Telegram groups, direct calls, Instagram, Avito, and personal referrals;
- tourists often cannot find a suitable format for their budget, dates, region, or group size;
- small groups are formed manually and inconsistently;
- communication is unstructured and trust depends too heavily on scattered reputation signals.

This creates an opportunity for a more flexible platform focused on the underserved part of the market.

## 4. Product thesis

The strongest version of the product is not "another excursion listing site".

The strongest version is:

- a marketplace with lower commission than major aggregators;
- a request-first flow where tourists can describe what they want;
- a group formation mechanism for budget-constrained users;
- a trusted reputation layer for guides;
- a single portal for discovery, negotiation, booking, and reviews.

## 5. Target users

### 5.1 Travelers

Primary segments:

- tourists looking for excursions or local tours across Russia;
- travelers with limited budgets who are ready to join a group;
- people looking for tours by dates, location, topic, or format;
- users who want alternatives to expensive private tours.

Main needs:

- find relevant offers quickly;
- compare options by price, route, dates, and reviews;
- join other travelers to reduce cost;
- trust the guide and the booking process;
- communicate without chaos.

### 5.2 Guides and local operators

Primary segments:

- independent guides;
- small local tour businesses;
- regional organizers with irregular digital sales channels.

Main needs:

- receive more leads;
- reduce dependence on one or two large aggregators;
- pay lower commission;
- protect and grow reputation;
- manage inquiries in a more structured way.

## 6. Market gap

The gap is not only "lower commission".

The real gap is:

- underserved local supply outside major portals;
- weak support for budget-driven group formation;
- poor infrastructure for custom requests;
- fragmented communication between tourists and guides;
- lack of a unified, tourism-focused exchange model.

## 7. Value proposition

### For travelers

- lower prices through lower commission and group formation;
- broader supply, including local and niche guides;
- flexible requests based on budget and dates;
- transparent ratings, reviews, and booking flow.

### For guides

- additional sales channel;
- lower platform commission;
- more control over offers and pricing;
- access to custom demand from travelers;
- reputation and trust tools in a tourism-specific platform.

## 8. Product differentiation

Compared to large aggregators, `Provodnik` should differentiate through:

- lower commission, target range `10% to 15%`;
- request-based demand capture, not only fixed listings;
- group-joining mechanics for tourists;
- optional price negotiation if a guide allows it;
- stronger focus on local, regional, and less digitized supply.

Recommended positioning:

Do not frame the product as a direct "Tripster killer".

Frame it as:

> A platform that digitizes the part of the tourism market that existing aggregators cover weakly: local guides, group demand, budget-sensitive travelers, and custom requests across Russia.

## 9. Product goals

### Business goals

- onboard guides and local operators across multiple regions of Russia;
- generate bookings and GMV through a commission model;
- become a meaningful additional channel for guides;
- create a defensible network effect between demand and supply.

### User goals

- reduce friction in finding and booking tours;
- reduce price barrier through group formation;
- improve trust through ratings and verification;
- simplify communication from discovery to booking.

## 10. Core hypotheses

### Demand-side hypotheses

- tourists are willing to create custom requests if it helps them find cheaper or more suitable tours;
- users with limited budgets are willing to join groups to reduce individual cost;
- tourists will trust a new platform if it offers transparent reviews, clear pricing, and secure booking.

### Supply-side hypotheses

- guides will join a new platform if commission is meaningfully lower than current alternatives;
- guides value an additional channel enough to tolerate initial platform immaturity;
- reputation-sensitive guides will actively maintain profiles and service quality if the platform drives bookings.

## 11. MVP scope

The first version should focus on the smallest loop that creates real transactions.

### Core MVP features

- guide profile pages;
- tour/excursion listing pages;
- traveler request creation:
  - destination or region;
  - dates;
  - budget;
  - number of participants;
  - preferred format;
- ability to join an existing request or group;
- guide responses to traveler requests;
- booking flow with prepayment or reservation;
- ratings and reviews;
- basic guide verification and moderation;
- admin tools for managing supply, disputes, and trust.

### Optional but useful in MVP if scope allows

- built-in chat between traveler and guide;
- negotiation flag: whether price discussion is allowed;
- seasonal categories such as winter, mountain, nature, city, lecture, pilgrimage, etc.

## 12. Out of scope for MVP

- flights and hotel booking;
- full dynamic pricing engine;
- advanced CRM for agencies;
- large B2B workflows;
- nationwide expansion into every travel vertical at once;
- insurance, visas, and complex package-tour infrastructure.

## 13. Core user flows

### Traveler flow

1. Traveler enters the platform and chooses region, dates, budget, or format.
2. Traveler either:
   - finds an existing tour;
   - joins an existing group request;
   - creates a new request.
3. Traveler receives or reviews guide offers.
4. Traveler chooses the best option.
5. Traveler books and pays deposit or full amount.
6. After the tour, traveler leaves a review.

### Guide flow

1. Guide signs up and completes profile.
2. Guide passes basic verification.
3. Guide publishes tours and/or responds to traveler requests.
4. Guide communicates terms, availability, and price.
5. Guide confirms booking.
6. Guide receives rating and review after completion.

## 14. Trust and reputation

Trust is central because guides are highly reputation-sensitive.

The platform must include:

- verified guide profiles;
- visible ratings and review count;
- transparent cancellation and refund rules;
- moderation for fake listings or abuse;
- clear booking status and payment confirmation;
- anti-circumvention controls where possible.

## 15. Monetization

Primary model:

- commission on completed bookings.

Target positioning:

- `Sputnik8`: official public guide-facing rules state a commission of `24% and more` per ticket, with a minimum of `200 RUB` per ticket;
- `Tripster`: public guide-facing materials confirm the platform takes a commission and instruct guides to present it to travelers as a prepayment, but a fixed public percentage was not verified in public official docs during research on March 12, 2026;
- `Provodnik`: target `10% to 15%`.

Potential later monetization:

- featured placement for guides;
- subscription tools for professionals;
- premium analytics or lead tools.

## 16. Success metrics

### Marketplace metrics

- number of active guides;
- number of active regions;
- number of listed tours;
- number of traveler requests created;
- number of group joins;
- GMV;
- take rate revenue.

### Conversion metrics

- visitor to request conversion;
- visitor to booking conversion;
- request to first guide response time;
- request to booking conversion;
- repeat booking rate.

### Trust metrics

- average rating of active guides;
- review completion rate;
- dispute rate;
- cancellation rate;
- off-platform leakage rate if measurable.

## 17. Key risks

### Marketplace cold start

- without guides there is no demand;
- without demand guides do not stay active.

### Disintermediation

- guides and travelers may try to move communication off-platform after first contact.

### Price erosion

- unrestricted bargaining can create a race to the bottom and damage quality.

### Trust and fraud

- fake guides, fake reviews, poor service quality, and payment disputes can damage adoption.

### Operational complexity

- tourism is seasonal and highly fragmented by region and format.

## 18. Launch strategy recommendation

Do not launch as "all tourism in Russia" from day one in operational terms.

Recommended approach:

- start with selected regions and trusted local supply;
- validate one or two strong categories first;
- build density before expanding geographically;
- prove the request-to-booking loop early.

## 19. Phase 1 recommendation

Best initial wedge:

- 1 to 3 regions with strong local guide networks;
- tours where group formation has obvious value;
- supply that is already active but poorly digitized.

The first milestone is not traffic.

The first milestone is repeatable marketplace liquidity in a narrow segment.

## 20. Summary

`Provodnik` should be built as a tourism marketplace for Russia with a strong focus on fragmented local supply, budget-sensitive demand, group formation, and lower commissions than major incumbents.

If executed well, the product can become a meaningful sales channel for guides and a more flexible discovery and booking system for travelers than the current mix of aggregators, chats, and manual communication.

## 21. Market research snapshot

Research date: `March 12, 2026`.

Research method:

- source discovery through `Brave Search API` and `Perplexity API`;
- verification through official competitor pages and primary materials where available;
- non-official sources are used only as directional context and marked as such.

### 21.1 Tripster

What official sources confirm:

- Tripster publicly defines itself as an aggregator of organizers' services, not a tour operator or agency.
- Tripster's public site emphasizes breadth and current scale:
  - `955 cities in 120 countries` on the homepage snapshot indexed in March 2026;
  - strong depth in Russian destinations, for example Moscow, Saint Petersburg, Kaliningrad, Kazan, Murmansk, and others.
- Tripster enforces a `best price` rule:
  - guide prices on Tripster must not be higher than on the guide's own site or elsewhere;
  - this creates price-parity pressure on supply.
- Tripster heavily optimizes for conversion discipline:
  - guides are instructed to answer travelers within `1 to 2 hours`;
  - Tripster states that `60%` of orders go to guides who respond within two hours;
  - median response time is visible to travelers.
- Tripster clearly manages disintermediation risk:
  - guides are told not to share contacts before payment;
  - guides are asked to call the platform fee a `prepayment` so travelers do not feel that direct booking is cheaper.
- Tripster is aligned with tighter regulation:
  - guide-facing help states that mandatory guide attestation applies in Russia for qualifying services.

Implication:

- Tripster is a strong incumbent with trust, moderation, reputation mechanics, and disciplined conversion tooling.
- Its public materials suggest a high-control marketplace optimized around supply quality and booking conversion.

### 21.2 Sputnik8

What official sources confirm:

- Sputnik8 explicitly describes itself as a platform or showcase where guides place their own offers and communicate directly with travelers.
- Sputnik8's public guide-facing rules state:
  - commission is `24% and more` from each ticket price;
  - minimum commission is `200 RUB` per ticket.
- Sputnik8's public help materials show meaningful marketplace scale:
  - `1006 cities`;
  - `110 countries`;
  - `24060 guides` on the guide conditions page snapshot from March 2026;
  - `11573 excursions` across `350 cities` in Russia on the countries page snapshot indexed in March 2026.
- Sputnik8 requires the guide to confirm orders manually in many cases.
- Sputnik8 makes operational discipline explicit:
  - conducted orders are presented as a key guide metric that affects income and rating;
  - tourists prefer guides who answer within `1 to 3 hours`;
  - commission is payable `twice a month`;
  - frequent late payment can lead to cooperation being stopped and listings being hidden.
- Sputnik8 also embeds trust and liability mechanics:
  - cancellation by a guide can trigger penalties;
  - refund policy is standardized around a `48-hour` threshold for many excursions.

Implication:

- Sputnik8 is a large, relatively open marketplace with strong guide autonomy but visible operational controls.
- Its official public commission is materially high enough to make a lower-take alternative commercially attractive.

### 21.3 Market structure and competitive context

Directional but non-audited context:

- In an August 25, 2023 interview published by `Paperpaper`, industry participants described `Sputnik` and `Tripster` together as `more than half of the excursions market in the country`.
- This should be treated as a directional market signal, not audited market-share data.

What the market structure suggests:

- the online excursions market in Russian-language tourism appears concentrated around a small number of strong aggregators;
- both major platforms are fundamentally listing-first marketplaces;
- both rely on reviews, response speed, confirmation discipline, and off-platform leakage control;
- neither public positioning strongly centers on traveler-led group formation around budget and dates.

## 22. Strategic implications for Provodnik

### 22.1 The niche is real, but price alone is not enough

Lower commission is necessary but not sufficient.

What incumbents already do well:

- trust and reviews;
- search and listing coverage;
- booking mechanics;
- conversion discipline;
- cancellation and refund handling.

Therefore `Provodnik` should not compete only as a cheaper copy.

### 22.2 Stronger wedge

The strongest wedge remains:

- demand-first requests from travelers;
- user-led group formation for budget-sensitive demand;
- optional negotiation where the guide explicitly allows it;
- regional and long-tail supply that is weakly digitized or underrepresented on major portals.

### 22.3 Operational requirements are non-optional

Research confirms that the category has hard operating requirements from day one:

- guide verification;
- attestation handling for Russia;
- safety rules and high-risk experience moderation;
- refunds and cancellation policy;
- anti-circumvention controls;
- response-time tooling and notifications;
- review moderation and dispute handling.

## 23. Risks confirmed by research

### Regulatory risk

- Guide attestation in Russia is already part of the official workflow on incumbent platforms.
- Any marketplace in this category needs a clear policy for who may publish which types of experiences.

### Safety and liability risk

- The category has already seen heightened scrutiny after the Moscow collector tragedy, including discussion of possible aggregator liability.
- High-risk experiences can create outsized legal and reputational exposure for a platform.

### Disintermediation risk

- Incumbents explicitly prohibit contact exchange before payment.
- This confirms that off-platform leakage is a structural problem in the category.

### Reputation fragility

- Both platforms lean heavily on ratings, reviews, response speed, and completion metrics.
- Guides are highly sensitive to ranking and review visibility.

### Operational speed risk

- Fast response time materially affects conversion.
- Without notifications, queue management, and SLA-style handling, supply-side conversion will suffer.

## 24. MVP justified by research

The MVP should focus on features that incumbents have already validated as necessary, plus the wedge they do not serve well enough.

### Must-have in MVP

- guide profile with identity and attestation fields;
- listing pages for ready-made tours and excursions;
- traveler request creation with region, dates, budget, and group size;
- join-a-group mechanics for travelers;
- chat or offer-response workflow between guide and traveler;
- fast notifications for new requests and replies;
- deposit or prepayment flow with clear remainder payment logic;
- reviews and ratings;
- cancellation, refund, and dispute rules;
- moderation tools for risky or non-compliant offers.

### Why this MVP is defensible

- listings are table stakes because both incumbents are listing-led;
- requests and group formation create the clearest product differentiation;
- deposit mechanics match traveler expectations formed by incumbents;
- review and moderation systems are essential for trust, not optional polish;
- attestation and safety controls are necessary for compliance and platform risk management.

## 25. Research-based positioning update

Recommended positioning statement:

> Provodnik is not another generic excursion catalog. It is a lower-commission tourism marketplace for Russia focused on custom requests, budget-based group formation, and under-digitized regional supply, with the trust and operating discipline required in a regulated category.

## 26. Sources

Primary and near-primary sources used in this research:

- Tripster homepage: https://experience.tripster.ru/
- Tripster destinations in Russia: https://experience.tripster.ru/destinations/russia/
- Tripster tours in Russia: https://experience.tripster.ru/tours/russia/
- Tripster user agreement: https://experience.tripster.ru/about/terms/
- Tripster guide help center: https://experience.tripster.ru/help_center/guides/
- Tripster best price rule: https://experience.tripster.ru/help_center/guides/experience_edit/cost/
- Tripster response speed guidance: https://experience.tripster.ru/help_center/guides/orders/how_to_work/23/
- Tripster order workflow and anti-circumvention guidance: https://experience.tripster.ru/help_center/guides/orders/how_to_work/
- Tripster commission framing guidance: https://experience.tripster.ru/help_center/guides/orders/how_to_work/28/
- Tripster attestation guidance: https://experience.tripster.ru/help_center/guides/guide_profile/personal_info/246/
- Sputnik8 guide conditions: https://www.sputnik8.com/ru/pages/guides-conditions
- Sputnik8 Russia page: https://www.sputnik8.com/ru/countries/russia
- Sputnik8 all countries page: https://www.sputnik8.com/ru/countries
- Sputnik8 booking mechanics: https://www.sputnik8.com/ru/pages/kak-proishodit-bronirovanie
- Sputnik8 commission payment rules: https://www.sputnik8.com/ru/pages/oplata-ekskursiy
- Sputnik8 order completion guidance: https://www.sputnik8.com/ru/pages/kak-uvelichit-dolyu-provedennyh-zakazov
- Sputnik8 refund policy: https://www.sputnik8.com/ru/pages/vozvrat-kz
- Sputnik8 guide cancellation policy: https://www.sputnik8.com/ru/pages/otmena-gidom
- Paperpaper market-context interview, used as directional context only: https://paperpaper.io/sputnik-i-tripster-eto-bolshe-poloviny/
- RBC on legal and business consequences after the Neglinka collector tragedy: https://www.rbc.ru/business/03/05/2025/6810c9b39a794736ede07174
