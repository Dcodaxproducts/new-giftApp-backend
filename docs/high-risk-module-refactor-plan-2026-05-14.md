# High-Risk Module Refactor Plan

Audit date: 2026-05-15  
Requested document date: 2026-05-14  
Scope: planning/documentation only. No services, controllers, DTOs, Prisma schema, route paths, guards, permissions, Swagger tags, or imports were changed.

## Summary

Most high-risk modules still use Prisma directly from services and do not yet have repositories. Controllers are generally thin; the main risk is concentrated in large services that combine query construction, transactions, status rules, notification/audit writes, response shaping, and export/report formatting.

Target modules that do not currently exist as standalone bounded contexts:
- `customer-orders`: no standalone module found. Customer order creation/list/detail logic is inside `customer-marketplace`; provider split/order handling is inside `provider-orders`.
- `notifications`: no standalone `notifications` module found. Notification APIs/services are inside `broadcast-notifications` (`notifications.controller.ts`, `notifications.service.ts`).

Recommended global sequence:
1. Add repositories beside existing services first; do not move folders/controllers yet.
2. Move read-only list/detail queries before writes/transactions.
3. Move write queries only after module-specific tests cover current behavior.
4. Keep business rules, ownership checks, transition logic, masking, payment/refund logic, and response formatting in services.
5. Split large services only after repository extraction is stable.

---

## auth
Risk: CRITICAL

Current state:
- Structure: `auth.module.ts`, `auth.controller.ts`, `auth.service.ts`, `dto/`, strategy/guard/support files, specs.
- Repository layer: none.
- DTO folder: present with multiple DTO files.
- Specs: `auth.service.spec.ts` plus provider-profile/auth source checks.

Where Prisma is used directly:
- `auth.service.ts` has heavy direct Prisma usage across registration, login, admin creation, provider approval/rejection, refresh/logout, password reset, account deletion/cancel deletion, profile/session reads, and audit/log side effects.
- Multiple `$transaction` blocks exist.

Large service methods:
- `cancelDeletion` is extremely large and likely includes multiple delete/restore branches.
- `login`, `approveProvider`, `createAdmin`, `refresh`, `listAdmins`, `permanentlyDeleteAdmin`, `forgotPassword` are large enough to stage carefully.

Controller methods doing too much:
- Controller appears mostly thin: route decorators, DTO binding, service calls.

Constants/helpers placement issues:
- Auth helper logic, OTP/session constants, deletion windows, and role-specific response shaping are concentrated in service. Some can later move to module constants/private helpers after behavior lock-in.

Test coverage risk:
- Existing specs are strong but source-string based in places; repository extraction will require updating expectations carefully.
- High risk around login guards, OTP state, refresh-token rotation, account deletion, and Super Admin bootstrapping.

Recommended staged refactor:
1. Add `auth.repository.ts` with read-only methods for users, refresh tokens, sessions, and login attempts used by auth flows.
2. Move `me`, sessions, and admin/provider lookup reads first.
3. Move registration/login writes only after tests assert exact account status and token behavior.
4. Move deletion/cancel deletion last; add targeted tests before touching.
5. Keep password hashing, token creation, role shaping, approval rules, OTP validation, and account-status rules in service.

Do not touch yet:
- Super Admin bootstrap behavior.
- Token rotation/revocation semantics.
- Provider approval/login gating.
- Account deletion permanence rules.

---

## payments
Risk: CRITICAL

Current state:
- Structure: `payments.module.ts`, `payments.controller.ts`, `payments.service.ts`, `dto/`, spec.
- Repository layer: none.
- DTO folder: present.
- Specs: one service spec.

Where Prisma is used directly:
- `payments.service.ts` uses Prisma for payment methods, payment intents, money gifts, payment confirmation, wallet/top-up linkage, and webhook side effects.
- Stripe SDK usage is in the same service.

Large service methods:
- `moneyGiftDetails` is the largest method.
- `createIntent`, `confirm`, `createMoneyGift`, `handleStripeWebhook`, and payment method/default methods mix Stripe calls with DB updates.

Controller methods doing too much:
- Controller is mostly thin but includes webhook/raw request handling risk; avoid altering request body behavior.

Constants/helpers placement issues:
- Stripe metadata keys, payment status mapping, currency/payment method constants are service-local.

Test coverage risk:
- Payment workflows are external-provider sensitive and need stronger tests for idempotency, webhook replay, wallet/order/payment state transitions.

Recommended staged refactor:
1. Add repository with read-only payment method and payment record lookups.
2. Move list/detail/payment method queries first.
3. Move payment intent persistence only after idempotency tests.
4. Keep all Stripe calls, webhook validation, and payment-state rules in service.
5. Add tests around duplicate webhook delivery before moving webhook writes.

Do not touch yet:
- Stripe webhook verification/raw body behavior.
- PaymentStatus transitions.
- Wallet/order side effects.

---

## customer-wallet
Risk: HIGH

Current state:
- Structure: `customer-wallet.module.ts`, controller, service, `dto/`, spec.
- Repository layer: none.
- DTO folder: present.
- Specs: one service spec.

Where Prisma is used directly:
- Wallet overview/history, add funds, bank account link/delete, top-up credit/failure, reward redemption credit.
- Several `$transaction` blocks.

Large service methods:
- `creditRewardRedemption`, `history`, `addFunds`, `overview`, `linkBankAccount`, `creditWalletTopUp`.

Controller methods doing too much:
- Controller appears thin.

Constants/helpers placement issues:
- Wallet transaction types, source labels, and monetary conversion helpers are service-local.

Test coverage risk:
- Needs stronger balance consistency tests around concurrent credits/debits and payment top-up failure.

Recommended staged refactor:
1. Add repository with wallet account read/create and transaction listing methods.
2. Move overview/history reads first.
3. Move top-up and reward credit transaction blocks last.
4. Keep balance arithmetic, source validation, and user ownership in service.

Do not touch yet:
- Balance mutation transactions.
- Stripe/wallet top-up coupling.

---

## customer-transactions
Risk: MEDIUM

Current state:
- Structure: module, controller, service, `dto/`, spec.
- Repository layer: none.
- DTO folder: present.
- Specs: one service spec.

Where Prisma is used directly:
- Low Prisma count; mostly transaction list/detail/receipt queries.

Large service methods:
- `receipt` is largest and does significant response shaping.
- `summary`, `list`, `export`, `details` are smaller.

Controller methods doing too much:
- Controller appears thin.

Constants/helpers placement issues:
- Receipt labels/status formatting are service-local.

Test coverage risk:
- Moderate; mostly read/reporting behavior.

Recommended staged refactor:
1. Add repository with list/detail/summary query methods.
2. Move read queries in one small batch.
3. Keep receipt formatting/export CSV in service until snapshot tests exist.

Do not touch yet:
- Receipt response shape.

---

## customer-orders
Risk: HIGH

Current state:
- No standalone `src/modules/customer-orders` module exists.
- Customer order behavior is currently part of `customer-marketplace`; provider-side order behavior is in `provider-orders`.

Where Prisma is used directly:
- See `customer-marketplace` and `provider-orders` sections.

Large service/controller methods:
- Not applicable as a standalone module.

DTO folder status:
- Customer order DTOs appear mixed into customer marketplace DTOs.

Constants/helpers placement issues:
- Order/cart constants are embedded in marketplace/provider-order services.

Test coverage risk:
- High because order behavior is distributed across modules.

Recommended staged refactor:
1. Do not create a new module during repository extraction.
2. First extract repositories inside existing `customer-marketplace` and `provider-orders` boundaries.
3. Only consider a bounded `customer-orders` module after API and data ownership are revalidated.

Do not touch yet:
- Module boundaries or route paths.

---

## customer-marketplace
Risk: CRITICAL

Current state:
- Structure: controller, service, `dto/`, specs.
- Repository layer: none.
- DTO folder: present.
- Specs: cart variants and marketplace visibility specs.

Where Prisma is used directly:
- Home/categories/gifts/gift details, wishlist, address CRUD, cart, checkout/order creation, order list/details, provider order item creation.
- Multiple `$transaction` blocks.

Large service methods:
- `orderDetails`, `createOrder`, `updateCartItem`, `gifts`, `orders`, `addCartItem`, `home`, `updateAddress`.

Controller methods doing too much:
- Controller mostly delegates, but route surface is large. `filterOptions` span is large because many endpoint methods live below it in source; inspect manually before changing.

Constants/helpers placement issues:
- Cart rules, provider split logic, gift image helpers, order status/payment defaults, and visibility filters are service-local.

Test coverage risk:
- High. Checkout creates parent orders, order items, provider order splits, provider order items, cart cleanup, and uses ownership/visibility rules.

Recommended staged refactor:
1. Add `customer-marketplace.repository.ts` with read-only gift/category/home queries first.
2. Move wishlist/address reads second.
3. Move cart reads/writes after cart variant tests are expanded.
4. Move `createOrder` transaction last, with tests asserting provider split snapshots and payload shape.
5. Keep cart validation, gift availability, provider split decisions, and response shaping in service.

Do not touch yet:
- Checkout transaction.
- Provider order split creation.
- Cart item variation/modifier behavior.

---

## provider-orders
Risk: CRITICAL

Current state:
- Structure: controller, service, `dto/`, multiple specs.
- Repository layer: none.
- DTO folder: present.
- Specs: order source safety, fulfillment, history/performance, refund views.

Where Prisma is used directly:
- List/history/recent/performance/revenue/export/summary/details, accept/reject/update/fulfill, checklist, messaging, timeline, parent order sync, earning ledger creation.
- Many transaction blocks and status/notification writes.

Large service methods:
- `rejectReasons` is large mostly due static catalog/response data.
- `fulfill`, `updateStatus`, `summary`, `performance`, `reject`, `list`, `accept`.

Controller methods doing too much:
- Controller largely thin; `rejectReasons`/analytics area appears large due many routes and decorators, not Prisma.

Constants/helpers placement issues:
- Status groups, transition matrix, reject reason catalog, status labels/descriptions should eventually move to module constants.

Test coverage risk:
- Better than most modules, but behavior is critical. Parent order sync, status transitions, COD/paid fulfilment logic, refund overlays, notifications, and ledger creation need preserved exact behavior.

Recommended staged refactor:
1. Add repository with read-only `findManyForProviderList`, `findOwnedByProvider`, `findRecent`, `findForAnalytics`.
2. Move list/history/recent/details reads first.
3. Move export/summary reads second.
4. Move accept/reject/update/fulfill transaction calls only after adding tests for every transition.
5. Keep transition matrix, payment checks, parent order sync decisions, ledger rules, and notification message construction in service.

Do not touch yet:
- Fulfillment transition behavior.
- Parent order sync behavior.
- Provider earnings ledger creation.

---

## provider-earnings-payouts
Risk: HIGH

Current state:
- Structure: two controllers, one service, `dto/`, spec.
- Repository layer: none.
- DTO folder: present.
- Specs: one service spec.

Where Prisma is used directly:
- Earnings summary/chart/ledger, payout history, request/cancel payout, record earning, failed payout balance return.
- Several transactions.

Large service methods:
- `returnFailedPayoutBalance`, `earningsSummary`, `requestPayout`, `cancelPayout`, `earningsLedger`, `payoutHistory`, `earningsChart`.

Controller methods doing too much:
- Controllers are thin.

Constants/helpers placement issues:
- Payout status groups, ledger direction/type rules, payout availability rules are service-local.

Test coverage risk:
- High due balance/payout ledger integrity and provider payout notifications.

Recommended staged refactor:
1. Add repository for ledger/payout read queries.
2. Move summary/chart/history reads first.
3. Move request/cancel payout writes only after ledger balance tests.
4. Keep balance math and payout eligibility in service.

Do not touch yet:
- Balance mutation transactions.
- Failed payout rollback behavior.

---

## provider-inventory
Risk: HIGH

Current state:
- Structure: controller, service, `dto/`, specs.
- Repository layer: none.
- DTO folder: present.
- Specs: base service and variants specs.

Where Prisma is used directly:
- Inventory list/lookup/create/update/details/availability/delete/stats, gift variants and modifier relations, audit logs.
- Multiple transactions.

Large service methods:
- `delete` is very large and likely includes permanent-delete/soft-delete logic and relation checks.
- `update`, `create`, `stats`, `lookup`, `list`, `updateAvailability`.

Controller methods doing too much:
- Controller appears thin.

Constants/helpers placement issues:
- Availability/status rules and variant/modifier helpers are service-local.

Test coverage risk:
- High because gift inventory affects marketplace visibility and orderability.

Recommended staged refactor:
1. Add repository with read-only inventory list/detail/stats methods.
2. Move lookup/list/details first.
3. Move create/update transactions after variant/modifier regression tests.
4. Move delete last; add tests for active order/reference behavior.
5. Keep provider ownership, approval rules, availability/business validation in service.

Do not touch yet:
- Delete behavior.
- Variant/modifier write transactions.

---

## provider-refund-requests
Risk: HIGH

Current state:
- Structure: controller, service, `dto/`, spec.
- Repository layer: none.
- DTO folder: present.
- Specs: one service/source safety spec.

Where Prisma is used directly:
- List/details/summary, approve/reject transactions, notifications, refund status updates.

Large service methods:
- `approve`, `rejectReasons`, `reject`, `list`, `summary`.

Controller methods doing too much:
- Controller appears thin.

Constants/helpers placement issues:
- Reject reason catalog/status groups should move to constants after behavior lock-in.

Test coverage risk:
- High due refund state transitions and payment/refund policy coupling.

Recommended staged refactor:
1. Add repository with list/detail/summary read methods.
2. Move reads only in first batch.
3. Move approve/reject transactions after tests assert refund status, provider decision fields, notifications, and payment constraints.
4. Keep provider ownership and refund decision rules in service.

Do not touch yet:
- Refund approval/rejection transactions.

---

## admin-disputes
Risk: CRITICAL

Current state:
- Structure: controller, service, `dto/`, spec.
- Repository layer: none.
- DTO folder: present.
- Specs: one service/source safety spec.

Where Prisma is used directly:
- Dispute list/stats/detail/linkage/refund preview/link transaction/decision/timeline/tracking/log/export, notifications, audit logs, payment/refund linkage.
- Multiple transactions.

Large service methods:
- `exportTrackingLog`, `export`, `stats`, `linkTransaction`, `refundPreview`, `list`, `linkage`, `trackingLog`.

Controller methods doing too much:
- Controller has many decorated admin endpoints but no direct Prisma; appears thin.

Constants/helpers placement issues:
- Dispute decision/status labels, priority/risk mappings, export columns, notification types are service-local.

Test coverage risk:
- Critical. Disputes touch customer refunds, transactions, decisions, audit, notifications, and tracking logs.

Recommended staged refactor:
1. Add repository with list/detail/timeline/tracking read methods only.
2. Move export reads after CSV output snapshot tests.
3. Move linkage/refund preview reads separately.
4. Move decisions/link transaction last after stronger tests.
5. Keep decision validation, refund selection, notification/audit orchestration, and response formatting in service.

Do not touch yet:
- Decision flows.
- Refund transaction linkage.
- Tracking log semantics.

---

## admin-provider-disputes
Risk: CRITICAL

Current state:
- Structure: controller, service, `dto/`, spec.
- Repository layer: none.
- DTO folder: present.
- Specs: one service/source safety spec.

Where Prisma is used directly:
- Provider dispute list/stats/evidence/ruling/finalize/financial impact/resolution/logs/export, provider/customer notifications, audit logs, financial adjustments.
- Multiple transactions.

Large service methods:
- `export`, `finalize`, `stats`, `payoutPenaltyLinkage`, `saveRuling`, `resolutionLog`, `notifyAgain`, `list`.

Controller methods doing too much:
- Controller appears thin; many decorators/permission groups.

Constants/helpers placement issues:
- Ruling outcomes, penalty mappings, notification templates, evidence labels, export headers are service-local.

Test coverage risk:
- Critical due dispute rulings, provider financial adjustments, notifications, and provider performance impacts.

Recommended staged refactor:
1. Add read-only repository methods for list/stats/evidence/resolution logs.
2. Move financial impact read queries only after tests assert existing shape.
3. Move ruling/finalize transactions last with tests for adjustment creation and notifications.
4. Keep ruling validation, risk logic, and notification/audit orchestration in service.

Do not touch yet:
- Final ruling behavior.
- Provider financial adjustment creation.

---

## admin-transactions
Risk: HIGH

Current state:
- Structure: controller, service, `dto/`, spec.
- Repository layer: none.
- DTO folder: present.
- Specs: one service/source safety spec.

Where Prisma is used directly:
- Transaction stats/detail/timeline/refund/open dispute/receipt/notify/export, notifications, audit logs.
- Some transaction blocks.

Large service methods:
- `export`, `refund`, `openDispute`, `stats`, `timeline`, `details`, `receipt`, `notifyUser`.

Controller methods doing too much:
- Controller appears thin.

Constants/helpers placement issues:
- Export columns, transaction labels, refund reason labels, timeline event templates are service-local.

Test coverage risk:
- High due refund and dispute creation side effects.

Recommended staged refactor:
1. Add repository for stats/list/detail/timeline/receipt/export reads.
2. Move read-only methods first.
3. Move `refund` and `openDispute` last after tests assert audit/notification/dispute writes.
4. Keep refund validation and dispute initiation rules in service.

Do not touch yet:
- Refund action.
- Dispute creation.

---

## gift-management
Risk: HIGH

Current state:
- Structure: one service, four controllers, `dto/`, specs.
- Repository layer: none.
- DTO folder: present.
- Specs: module/service/variants specs.

Where Prisma is used directly:
- Gift categories, gifts, moderation, variants, stats, audit logs.
- Several transaction blocks.

Large service methods:
- `flagGift`, `updateGift`, `createGift`, `listCategories`, `updateCategory`, `createCategory`, `categoryStats`, `giftStats`.

Controller methods doing too much:
- Controllers are split by concern and mostly thin.

Constants/helpers placement issues:
- Gift status groups, moderation actions, category defaults, variant helpers, audit actions are service-local.

Test coverage risk:
- High because gift visibility and variants affect marketplace/order flows.

Recommended staged refactor:
1. Add repository with category and gift read methods.
2. Move category list/detail/stats reads first.
3. Move gift list/detail/stats reads second.
4. Move create/update gift/category transactions after specs cover variants and moderation output.
5. Keep moderation rules and response shaping in service.

Do not touch yet:
- Variant write behavior.
- Moderation/audit side effects.

---

## admin-reviews
Risk: HIGH

Current state:
- Structure: two controllers, one service, `dto/`, spec.
- Repository layer: none.
- DTO folder: present.
- Specs: one source-safety/service spec.

Where Prisma is used directly:
- Dashboard/stats/list/moderation queue/moderate/logs/policies/test/export, notifications, audit logs.
- Multiple transactions.

Large service methods:
- `export`, `dashboard`, `stats`, `moderate`, `moderationQueue`, `moderationLogs`, `list`, `testPolicy`.

Controller methods doing too much:
- Controllers mostly thin; dashboard method span includes decorators and route methods.

Constants/helpers placement issues:
- Moderation actions, policy thresholds, export headers, notification messages are service-local.

Test coverage risk:
- High because moderation can affect review visibility and provider/customer notifications.

Recommended staged refactor:
1. Add repository with dashboard/stats/list/read methods.
2. Move policies/log reads separately.
3. Move moderation writes after tests assert review status, log entries, and notifications.
4. Keep moderation decision logic in service.

Do not touch yet:
- Moderation writes.
- Policy evaluation behavior.

---

## social-moderation
Risk: HIGH

Current state:
- Structure: controller, service, `dto/`, spec.
- Repository layer: none.
- DTO folder: present.
- Specs: one service/source safety spec.

Where Prisma is used directly:
- Reports/stats/action/export/rule stats/rule status/export rules, audit logs, notifications.
- Several transactions.

Large service methods:
- `exportRules`, `action`, `stats`, `ruleStats`, `reports`, `exportReports`, `reportDetails`.

Controller methods doing too much:
- Controller appears thin.

Constants/helpers placement issues:
- Report action mappings, rule labels, export columns, notification messages are service-local.

Test coverage risk:
- High due moderation actions and reporting rules affecting visibility/safety outcomes.

Recommended staged refactor:
1. Add repository with report/rule read methods.
2. Move report list/details/stats reads first.
3. Move exports after output tests.
4. Move action/rule status writes after tests assert audit and notification side effects.
5. Keep moderation rules in service.

Do not touch yet:
- Report action behavior.
- Rule activation/deactivation semantics.

---

## broadcast-notifications
Risk: CRITICAL

Current state:
- Structure: two controllers, four services (`broadcasts`, `notifications`, `broadcast-delivery`, `broadcast-queue`), adapters, `dto/`, specs.
- Repository layer: none.
- DTO folder: present.
- Specs: broadcasts, notifications, preferences, Swagger specs.

Where Prisma is used directly:
- Broadcast CRUD/scheduling/targeting/report/recipients, notification list/action/preferences/device tokens, delivery processing, queue scheduling.
- Multiple transaction blocks.

Large service methods:
- `broadcast-delivery.process` is very large and combines queue/delivery state transitions.
- `broadcasts.recipients`, `broadcasts.schedule`, `broadcasts.list`, `broadcasts.updateTargeting`.
- `notifications.deleteDeviceToken`, `notifications.list`, `notifications.summary`.

Controller methods doing too much:
- Controllers appear thin.

Constants/helpers placement issues:
- Delivery channel adapters, targeting rules, audience filters, delivery statuses, notification action constants are spread across services/adapters.

Test coverage risk:
- Critical because async delivery, scheduled jobs, recipient targeting, device tokens, and notification preferences can regress silently.

Recommended staged refactor:
1. Do not start with delivery processing.
2. Add repository for notification preference/device token/list reads first.
3. Add repository for broadcast list/report/recipient reads separately.
4. Move scheduling/queue writes after tests around queue job IDs and status transitions.
5. Move delivery processor Prisma writes last, with integration-style tests for success/failure/retry.
6. Keep targeting/business decisions and delivery orchestration in services.

Do not touch yet:
- `broadcast-delivery.process`.
- Queue scheduling/cancel behavior.
- Recipient targeting semantics.

---

## subscription-plans
Risk: HIGH

Current state:
- Structure: three controllers, one service, `dto/`, spec.
- Repository layer: none.
- DTO folder: present.
- Specs: one source-safety/service spec.

Where Prisma is used directly:
- Plan features, subscription plans, coupons, stats, audit logs, initialization.
- Several transaction blocks.

Large service methods:
- `deleteCoupon`, `listPlans`, `updatePlan`, `createPlan`, `stats`, `onModuleInit`.

Controller methods doing too much:
- Controllers appear thin.

Constants/helpers placement issues:
- Default plans/features, coupon constraints, audit actions are service-local.

Test coverage risk:
- High due plan/coupon behavior affecting subscription checkout.

Recommended staged refactor:
1. Add repository for plan/feature/coupon reads.
2. Move list/detail/stats methods first.
3. Move initialization/upserts only after tests assert default catalog behavior.
4. Move coupon deletes last.
5. Keep coupon business validation and default catalog decisions in service.

Do not touch yet:
- Default seeding behavior.
- Coupon deletion rules.

---

## promotional-offers
Risk: HIGH

Current state:
- Structure: provider/admin controllers, one service, `dto/`, spec.
- Repository layer: none.
- DTO folder: present.
- Specs: one source-safety/service spec.

Where Prisma is used directly:
- Provider create/update/status, admin create/approve/reject/stats/export, audit logs.
- Some transactions.

Large service methods:
- `export`, `createAdmin`, `createProvider`, `stats`, `reject`, `approve`, `updateProviderStatus`, `updateProvider`.

Controller methods doing too much:
- Controllers are thin.

Constants/helpers placement issues:
- Offer status groups, approval actions, export headers, audit actions are service-local.

Test coverage risk:
- High due provider/admin permissions and offer publication status transitions.

Recommended staged refactor:
1. Add repository with read-only list/stats/export query methods.
2. Move provider/admin read paths first.
3. Move create/update/approve/reject transaction writes after status transition tests.
4. Keep offer validation and approval rules in service.

Do not touch yet:
- Admin approval/rejection behavior.
- Provider status transitions.

---

## storage
Risk: HIGH

Current state:
- Structure: controller, service, `dto/`, several specs.
- Repository layer: none.
- DTO folder: present.
- Specs: ownership rules, service, Swagger, contact avatar tests.

Where Prisma is used directly:
- Upload records, complete/details/delete/list, audit logs, ownership checks.
- One transaction block.

Large service methods:
- `delete` is very large and includes ownership/deletion behavior.
- `createPresignedUpload`, `list`, `complete`, `details`.

Controller methods doing too much:
- Controller appears thin.

Constants/helpers placement issues:
- Upload folder ownership rules, content restrictions, storage key helpers, and audit actions are service-local or DTO-local.

Test coverage risk:
- High but better covered than many modules. Risk centers on ownership enforcement and deletion/permanent delete behavior.

Recommended staged refactor:
1. Add repository with upload list/detail/findOwned/create/update methods.
2. Move read/list/detail/create upload record queries first.
3. Move complete update second.
4. Move delete transaction last after ownership tests are expanded.
5. Keep ownership resolution, S3 signing/deletion, media policy calls, and audit orchestration in service.

Do not touch yet:
- Delete behavior.
- S3/storage key side effects.
- Ownership resolution rules.

---

## notifications
Risk: CRITICAL

Current state:
- No standalone `src/modules/notifications` module exists.
- Notification APIs are inside `broadcast-notifications`:
  - `notifications.controller.ts`
  - `notifications.service.ts`
  - `broadcast-delivery.service.ts`
  - `broadcast-queue.service.ts`

Where Prisma is used directly:
- See `broadcast-notifications` section.

Large service/controller methods:
- `broadcast-delivery.process` and notification preference/device-token methods.

DTO folder status:
- DTOs are under `broadcast-notifications/dto/`.

Constants/helpers placement issues:
- Notification channel/action/preference constants are spread across notification and broadcast services.

Test coverage risk:
- Critical due async delivery and user notification state.

Recommended staged refactor:
1. Do not create/rename a `notifications` module yet.
2. Extract repositories inside existing `broadcast-notifications` module first.
3. Only consider splitting `notifications` after route/API compatibility plan is approved.

Do not touch yet:
- Module split or route path movement.
- Delivery processor behavior.
