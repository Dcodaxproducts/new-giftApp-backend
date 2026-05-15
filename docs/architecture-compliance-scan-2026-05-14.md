# Architecture Compliance Scan — GiftApp Backend

Report date: 2026-05-15  
Requested report date: 2026-05-14  
Scope: audit/report only. No code refactor performed in this task.

## Executive Summary

The backend is in a reviewable state for architecture compliance, with a clear distinction between completed repository extractions and remaining high-risk staged work.

Key findings:
- Controllers have no direct Prisma usage.
- Repository layer exists for the completed cleanup modules.
- Direct Prisma usage remains in services for high-risk/not-yet-refactored modules and shared infrastructure services; these are documented below.
- DTO folder compliance is generally good for feature modules; a few small/support modules intentionally do not have local DTO folders.
- Build/test/lint/Prisma/Swagger checks pass.
- Migration deployment readiness is not yet confirmed because DB reachability/baseline still needs validation.

## 1. Direct Prisma Usage Scan

Expected policy:
- Controllers: no Prisma usage.
- Repositories: Prisma usage allowed.
- Services: Prisma usage should remain only in not-yet-refactored/high-risk modules or shared infrastructure services until their staged extraction.
- Specs: Prisma terms/mocks allowed for tests/source checks.

### Prisma usage summary

| Layer | Result | Status | Action Needed |
|---|---:|---|---|
| Controllers | 0 files with direct Prisma usage | PASS | None. |
| Repositories | 11 repository files use Prisma | PASS | Expected. |
| Services | Several not-yet-refactored/high-risk services still use Prisma | DOCUMENTED GAP | Stage future repository extraction by risk. |
| Specs | Some specs include Prisma mocks/source checks | PASS | Expected for test coverage. |
| Common guards/services | Some shared infrastructure services/guards use Prisma | REVIEW LATER | Consider shared repository/data-access cleanup after module work. |

### Direct Prisma usage table

| File | Layer | Prisma Usage | Status | Action Needed |
|---|---|---:|---|---|
| `src/modules/*/*.controller.ts` | Controller | none found | PASS | None. |
| `src/modules/audit-logs/audit-logs.repository.ts` | Repository | Prisma queries | DONE | None. |
| `src/modules/customer-events/customer-events.repository.ts` | Repository | Prisma queries | DONE | None. |
| `src/modules/login-attempts/login-attempts.repository.ts` | Repository | Prisma queries | DONE | None. |
| `src/modules/customer-contacts/customer-contacts.repository.ts` | Repository | Prisma queries | DONE | None. |
| `src/modules/media-upload-policy/media-upload-policy.repository.ts` | Repository | Prisma queries | DONE | None. |
| `src/modules/referral-settings/referral-settings.repository.ts` | Repository | Prisma queries | DONE | None. |
| `src/modules/refund-policy-settings/refund-policy-settings.repository.ts` | Repository | Prisma queries | DONE | None. |
| `src/modules/provider-business-info/provider-business-info.repository.ts` | Repository | Prisma queries | DONE | None. |
| `src/modules/provider-management/provider-business-categories.repository.ts` | Repository | Prisma queries | DONE | None. |
| `src/modules/customer-transactions/customer-transactions.repository.ts` | Repository | Prisma queries | DONE | None. |
| `src/modules/provider-payout-methods/provider-payout-methods.repository.ts` | Repository | Prisma queries | DONE | None. |
| `src/modules/auth/auth.service.ts` | Service | heavy direct Prisma | HIGH_RISK_STAGED | Do not refactor without auth/token/session tests. |
| `src/modules/payments/payments.service.ts` | Service | direct Prisma + Stripe | HIGH_RISK_STAGED | Requires payment/webhook/idempotency test batch. |
| `src/modules/customer-wallet/customer-wallet.service.ts` | Service | direct Prisma + wallet balance transactions | HIGH_RISK_STAGED | Requires balance mutation tests. |
| `src/modules/customer-marketplace/customer-marketplace.service.ts` | Service | direct Prisma + checkout/cart/orders | HIGH_RISK_STAGED | Requires checkout/provider-split tests. |
| `src/modules/provider-orders/provider-orders.service.ts` | Service | direct Prisma + status transitions | HIGH_RISK_STAGED | Requires transition/parent-order sync tests. |
| `src/modules/admin-disputes/admin-disputes.service.ts` | Service | direct Prisma + dispute/refund workflows | HIGH_RISK_STAGED | Requires dispute/refund linkage tests. |
| `src/modules/admin-provider-disputes/admin-provider-disputes.service.ts` | Service | direct Prisma + provider dispute rulings | HIGH_RISK_STAGED | Requires ruling/financial adjustment tests. |
| `src/modules/admin-transactions/admin-transactions.service.ts` | Service | direct Prisma + refunds/disputes | HIGH_RISK_STAGED | Move reads first after focused tests. |
| `src/modules/admin-reviews/admin-reviews.service.ts` | Service | direct Prisma + moderation workflows | HIGH_RISK_STAGED | Move reads/policies before moderation writes. |
| `src/modules/social-moderation/social-moderation.service.ts` | Service | direct Prisma + moderation/audit | HIGH_RISK_STAGED | Needs report-action tests. |
| `src/modules/broadcast-notifications/*.service.ts` | Service | direct Prisma + queues/delivery | HIGH_RISK_STAGED | Do not touch delivery processor first. |
| `src/modules/gift-management/gift-management.service.ts` | Service | direct Prisma + variants/moderation | HIGH_RISK_STAGED | Read-only repository extraction first. |
| `src/modules/provider-inventory/provider-inventory.service.ts` | Service | direct Prisma + variants/delete | HIGH_RISK_STAGED | Delete behavior last. |
| `src/modules/provider-refund-requests/provider-refund-requests.service.ts` | Service | direct Prisma + refund decisions | HIGH_RISK_STAGED | Read-only extraction before approve/reject. |
| `src/modules/provider-earnings-payouts/provider-earnings-payouts.service.ts` | Service | direct Prisma + ledger/payout balance | HIGH_RISK_STAGED | Requires ledger balance tests. |
| `src/modules/storage/storage.service.ts` | Service | direct Prisma + S3/ownership/delete | HIGH_RISK_STAGED | Requires storage ownership/delete tests. |
| `src/modules/subscription-plans/subscription-plans.service.ts` | Service | direct Prisma + plan/coupon setup | HIGH_RISK_STAGED | Read-only extraction first. |
| `src/modules/promotional-offers/promotional-offers.service.ts` | Service | direct Prisma + approval/status workflows | HIGH_RISK_STAGED | Reads first, status writes later. |
| `src/modules/provider-management/provider-management.service.ts` | Service | direct Prisma + provider lifecycle | HIGH_RISK_STAGED | Business categories already extracted; management remains high-risk. |
| `src/modules/user-management/user-management.service.ts` | Service | direct Prisma + password/account admin flows | HIGH_RISK_STAGED | Requires account/password tests. |
| `src/modules/customer-provider-interactions/customer-provider-interactions.service.ts` | Service | direct Prisma + chat/review/report writes | HIGH_RISK_STAGED | Review/report workflow tests needed. |
| `src/modules/customer-recurring-payments/customer-recurring-payments.service.ts` | Service | direct Prisma + Stripe recurring workflow | HIGH_RISK_STAGED | Payment schedule tests needed. |
| `src/modules/customer-referrals/customer-referrals.service.ts` | Service | direct Prisma + reward ledger | HIGH_RISK_STAGED | Reward ledger tests needed. |
| `src/modules/customer-subscriptions/customer-subscriptions.service.ts` | Service | direct Prisma + Stripe subscriptions | HIGH_RISK_STAGED | Subscription webhook tests needed. |
| `src/modules/provider-dashboard/provider-dashboard.service.ts` | Service | direct Prisma read aggregation | SAFE_NEXT | Could be repository-extracted after current high-risk priorities. |
| `src/modules/provider-interactions/provider-interactions.service.ts` | Service | direct Prisma chat/review reads/writes | HIGH_RISK_STAGED | Needs interaction ownership tests. |
| `src/common/guards/jwt-auth.guard.ts` | Guard | Prisma account lookup | REVIEW_LATER | Shared auth data access cleanup later. |
| `src/common/services/account-status.service.ts` | Shared service | Prisma account status updates | REVIEW_LATER | Shared data-access cleanup later. |
| `src/common/services/audit-log.service.ts` | Shared service | Prisma audit log write | ACCEPTED_SHARED_SERVICE | Intentionally shared writer. |
| `src/**/*.spec.ts` | Spec | Prisma mocks/source checks | PASS | Expected. |

## 2. Repository Layer Coverage

| Module | Repository Exists | Risk | Recommendation |
|---|---:|---|---|
| `audit-logs` | Yes | DONE | Complete for current scope. |
| `customer-events` | Yes | DONE | Complete for current scope. |
| `login-attempts` | Yes | DONE | Complete for current scope. |
| `customer-contacts` | Yes | DONE | Complete for current scope. |
| `media-upload-policy` | Yes | DONE | Complete for current scope. |
| `referral-settings` | Yes | DONE | Complete for current scope. |
| `refund-policy-settings` | Yes | DONE | Complete for current scope. |
| `provider-business-info` | Yes | DONE | Complete for current scope. |
| `provider-business-categories` | Yes | DONE | Repository exists under `provider-management`. |
| `customer-transactions` | Yes | DONE | Complete for current scope. |
| `provider-payout-methods` | Yes | DONE | Security-safe extraction complete with focused tests. |
| `provider-dashboard` | No | SAFE_NEXT | Read aggregation module; candidate after review. |
| `customer-referrals` | No | SAFE_NEXT | Audit first; reward ledger writes increase risk. |
| `customer-provider-interactions` | No | HIGH_RISK_STAGED | Chat/review/report ownership flows. |
| `customer-recurring-payments` | No | HIGH_RISK_STAGED | Stripe recurring setup/schedule flows. |
| `customer-subscriptions` | No | HIGH_RISK_STAGED | Stripe subscription/webhook flows. |
| `customer-wallet` | No | HIGH_RISK_STAGED | Wallet balance mutation. |
| `auth` | No | HIGH_RISK_STAGED | Token/session/password/account deletion logic. |
| `payments` | No | HIGH_RISK_STAGED | Stripe payment/webhook logic. |
| `customer-marketplace` | No | HIGH_RISK_STAGED | Cart/checkout/order split logic. |
| `provider-orders` | No | HIGH_RISK_STAGED | Status transitions/fulfillment/ledger. |
| `provider-earnings-payouts` | No | HIGH_RISK_STAGED | Ledger and payout balance changes. |
| `provider-inventory` | No | HIGH_RISK_STAGED | Variants/delete/orderability. |
| `provider-refund-requests` | No | HIGH_RISK_STAGED | Refund approval/rejection. |
| `admin-disputes` | No | HIGH_RISK_STAGED | Dispute/refund decision flows. |
| `admin-provider-disputes` | No | HIGH_RISK_STAGED | Rulings/financial adjustments. |
| `admin-transactions` | No | HIGH_RISK_STAGED | Refund/dispute side effects. |
| `gift-management` | No | HIGH_RISK_STAGED | Gifts/categories/variants/moderation. |
| `admin-reviews` | No | HIGH_RISK_STAGED | Review moderation/policies. |
| `social-moderation` | No | HIGH_RISK_STAGED | Report actions/rules. |
| `broadcast-notifications` | No | HIGH_RISK_STAGED | Queues/delivery/targeting. |
| `subscription-plans` | No | HIGH_RISK_STAGED | Plans/coupons/default seeding. |
| `promotional-offers` | No | HIGH_RISK_STAGED | Offer approval/status flows. |
| `storage` | No | HIGH_RISK_STAGED | S3/ownership/delete flows. |
| `notifications` | N/A | HIGH_RISK_STAGED | No standalone module; lives under `broadcast-notifications`. |
| `mailer` | No | NOT_NEEDED_SMALL_MODULE | No Prisma; external email service. |
| `admin-management` | No | NOT_NEEDED_SMALL_MODULE | Delegates to auth/admin flows; no service Prisma. |
| `admin-roles` | No | NOT_NEEDED_SMALL_MODULE | Static/permission catalog style. |

## 3. DTO Folder Compliance

| Module | dto/ folder exists | DTOs colocated correctly | Issues |
|---|---:|---:|---|
| `admin-disputes` | Yes | Yes | None for current scope. |
| `admin-provider-disputes` | Yes | Yes | None for current scope. |
| `admin-reviews` | Yes | Yes | None for current scope. |
| `admin-transactions` | Yes | Yes | None for current scope. |
| `auth` | Yes | Yes | Large DTO surface; review validation separately. |
| `broadcast-notifications` | Yes | Yes | None for current scope. |
| `customer-contacts` | Yes | Yes | None. |
| `customer-events` | Yes | Yes | None. |
| `customer-marketplace` | Yes | Yes | Marketplace DTO surface mixes cart/order/address flows; acceptable until module split decision. |
| `customer-transactions` | Yes | Yes | None. |
| `customer-wallet` | Yes | Yes | Sensitive bank-like DTO fields exist; behavior tested not to store raw schema fields. |
| `gift-management` | Yes | Yes | Large combined gift/category/moderation DTO file; can split later. |
| `login-attempts` | Yes | Yes | None. |
| `media-upload-policy` | Yes | Yes | None. |
| `payments` | Yes | Yes | Payment DTOs require dedicated security validation review later. |
| `promotional-offers` | Yes | Yes | None for current scope. |
| `provider-business-info` | Yes | Yes | None. |
| `provider-earnings-payouts` | Yes | Yes | None for current scope. |
| `provider-inventory` | Yes | Yes | Variant DTOs need focused validation coverage. |
| `provider-management` | Yes | Yes | Contains provider management and business category DTOs. |
| `provider-orders` | Yes | Yes | Large status/reason DTO file; acceptable until staged split. |
| `provider-payout-methods` | Yes | Yes | Sensitive account fields accepted only for masking/tokenization; no raw persistence. |
| `provider-refund-requests` | Yes | Yes | None for current scope. |
| `referral-settings` | Yes | Yes | None. |
| `refund-policy-settings` | Yes | Yes | None. |
| `social-moderation` | Yes | Yes | None. |
| `storage` | Yes | Yes | Sensitive `targetAccountId` is guarded in service. |
| `subscription-plans` | Yes | Yes | Plans/coupons/features share DTO file; can split later. |
| `user-management` | Yes | Yes | Large DTO surface; review separately. |
| `audit-logs` | No | Existing DTO imported from auth DTO location | Documented gap; do not move unless team approves DTO import churn. |
| `admin-management` | No | Uses auth/admin DTOs | Small delegating module; acceptable short-term. |
| `admin-roles` | No | Static permission catalog module | Acceptable short-term. |
| `provider-dashboard` | No | No DTO files currently | Read-only dashboard module; add DTO folder if query/input surface expands. |
| `mailer` | No | No controllers/DTOs | Not needed. |
| `notifications` | N/A | N/A | Not standalone; under `broadcast-notifications`. |

## 4. Controller Thinness

Scan result:
- No controller imports or injects `PrismaService`.
- No controller contains `this.prisma` usage.
- No controller has complex `if`/`else` business logic by simple scan.
- Larger controllers are mostly large due decorators and endpoint count, not query/business logic.

Controllers to keep an eye on:

| Controller | Lines | Signal | Status | Recommendation |
|---|---:|---|---|---|
| `provider-management.controller.ts` | 213 | Large file/endpoints | OK_FOR_NOW | Split only if team wants folder structure cleanup. |
| `customer-marketplace.controller.ts` | 178 | Many customer marketplace endpoints | OK_FOR_NOW | Keep until marketplace/order module decision. |
| `admin-provider-disputes.controller.ts` | 151 | Many dispute endpoints/decorators | OK_FOR_NOW | Do not alter routes yet. |
| `auth.controller.ts` | 148 | Many auth endpoints | OK_FOR_NOW | Do not alter during auth refactor. |
| `admin-disputes.controller.ts` | 143 | Many dispute endpoints/decorators | OK_FOR_NOW | Do not alter routes yet. |
| `admin-management.controller.ts` | 106 | Admin endpoints | OK_FOR_NOW | No direct Prisma. |
| `payments.controller.ts` | 102 | Payment/webhook route surface | OK_FOR_NOW | Preserve raw/webhook behavior. |

## 5. Big Service Risk

| Service | Concern | Risk | Suggested split |
|---|---|---|---|
| `auth.service.ts` | 1591 lines; registration/login/admin/provider/session/password/account deletion | CRITICAL | `auth.repository`, `auth-token.service`, `auth-account-deletion.service`, `admin-auth.service`, `provider-auth.service`. |
| `provider-management.service.ts` | 1053 lines; provider lifecycle/admin operations | HIGH | `provider-management.repository`, lifecycle/action service, review/audit helpers. |
| `gift-management.service.ts` | gifts/categories/variants/moderation/audit | HIGH | `gifts.repository`, `gift-categories.repository`, `gift-moderation.service`, `gift-variants.service`. |
| `customer-marketplace.service.ts` | home/gifts/wishlist/address/cart/checkout/orders | CRITICAL | `customer-marketplace.repository`, cart service, address service, checkout/order service. |
| `provider-orders.service.ts` | provider order statuses/fulfillment/refunds/ledger/notifications | CRITICAL | repository first, then actions/analytics/fulfillment services. |
| `admin-provider-disputes.service.ts` | rulings/evidence/financial impact/resolution/export | CRITICAL | repository, evidence service, ruling service, financial adjustment service. |
| `admin-disputes.service.ts` | dispute linkage/refund preview/decision/tracking/export | CRITICAL | repository, decision service, linkage/refund service, tracking/export service. |
| `payments.service.ts` | Stripe intents/webhooks/money gifts/payment methods | CRITICAL | repository, Stripe adapter, webhook handler, money gift payment service. |
| `provider-inventory.service.ts` | inventory variants/delete/status/audit | HIGH | repository, variants service, delete/safety service. |
| `promotional-offers.service.ts` | provider/admin offer create/approve/export | HIGH | repository, provider offer service, admin moderation service. |
| `customer-recurring-payments.service.ts` | recurring schedule/payment setup/Stripe occurrences | HIGH | repository, scheduler/occurrence service, Stripe setup service. |
| `admin-reviews.service.ts` | dashboard/moderation/policies/export | HIGH | repository, moderation service, policy service, export service. |
| `admin-transactions.service.ts` | stats/refunds/disputes/export | HIGH | repository, refund action service, export service. |
| `storage.service.ts` | presigned upload/ownership/S3/delete/audit | HIGH | repository, ownership service, S3 storage adapter, delete service. |
| `broadcast-delivery.service.ts` | async delivery processing | CRITICAL | delivery repository, channel delivery services, retry/status service. |
| `broadcasts.service.ts` | broadcast CRUD/targeting/schedule/report | HIGH | repository, targeting service, scheduling service. |
| `social-moderation.service.ts` | report actions/rules/audit/notifications | HIGH | repository, action service, rule service. |
| `provider-earnings-payouts.service.ts` | earnings ledger/payout balance/cancel/failure | HIGH | repository, ledger service, payout action service. |
| `notifications.service.ts` under `broadcast-notifications` | notification list/preferences/action/device tokens | HIGH | repository and preference/device-token services; do not split route yet. |

## 6. Prisma / Migration Status

Current verified status:

```txt
npm run prisma:validate: PASS
npm run prisma:generate: PASS
```

Known migration status:

```txt
prisma migrate deploy: previously blocked due to DB unreachable
production DB baseline/migration strategy still needs confirmation
```

Do not mark migration deployment production-ready until the intended DB is reachable and `migrate status`/`migrate deploy` is verified.

## 7. Production Risk Checklist

| Check | Status | Evidence / Notes |
|---|---|---|
| No `console.log` leaking secrets | PASS | `rg "console\." src` found no source console usage; specs spy on console for non-logging tests. |
| No direct token/password logging | PASS_WITH_REVIEW | No console logging; audit log redaction covers password/token keys. Password/token fields still exist in auth/user flows as expected. |
| No raw card/bank data returned | PASS_WITH_KNOWN_PAYMENT_OUTPUTS | Card/bank raw data not found as returned fields; provider payout methods now tested for no raw account/IBAN/routing return. Stripe `clientSecret` is intentionally returned for payment setup/checkout APIs. |
| No frontend amount trusted for payment/refund | NEEDS_FOCUSED_REVIEW | Payment/refund modules are high-risk and still need dedicated accuracy/security pass. |
| No providerId/userId/ownerId trusted from body where JWT should be source | PASS_WITH_EXCEPTIONS_DOCUMENTED | Provider payout methods and provider earnings are source-tested. Some admin/customer flows intentionally accept target IDs (`gift-management`, `promotional-offers`, storage `targetAccountId`) with service validation. |
| Pagination on list endpoints | MOSTLY_PASS | Widespread `page`, `limit`, `skip`, `take`, `totalPages`; some static/lookup endpoints intentionally unpaginated. |
| Sensitive storage `targetAccountId` restricted | PASS_WITH_TESTS | Storage ownership specs exist; service resolves/restricts target account. |
| Swagger duplicate paths check | PASS | `duplicates=0`. |
| Build/test status | PASS | Full verification passed. |
| Direct Prisma in controllers | PASS | None found. |
| Direct Prisma in repositories | PASS | Expected. |
| Direct Prisma in services | DOCUMENTED_GAP | Remains in high-risk/not-yet-refactored modules only. |

## 8. Swagger / API Reference Check

Latest generated OpenAPI check:

```txt
openapi_paths=322
operations=402
duplicates=0
```

Status: PASS

## 9. Verification Results

Commands run:

```txt
npm run lint: PASS
npm run test -- --runInBand: PASS
npm run build: PASS
npm run prisma:validate: PASS
npm run prisma:generate: PASS
Swagger generation: PASS
Duplicate route check: PASS
```

Latest test counts:

```txt
65 test suites passed
484 tests passed
```

## 10. Critical Issues Found

No new critical issue was found in this scan.

Critical remaining architecture risks are known and staged:
- `auth`
- `payments`
- `customer-marketplace`
- `provider-orders`
- `admin-disputes`
- `admin-provider-disputes`
- `broadcast-notifications` / embedded notifications

## 11. Safe Next Refactor Candidate

Recommended safe next candidate: `provider-dashboard` repository extraction.

Why:
- Read aggregation service.
- Smaller module than payment/order/dispute/auth flows.
- Lower risk than wallet, payments, orders, disputes, and broadcast delivery.

Alternative: audit-only pass for `customer-referrals` before code changes because reward ledger writes increase business risk.

## 12. Recommendation for Team Lead Review

Proceed with team lead review.

The codebase is not yet fully repository-layer complete, but the current state is review-ready because:
- completed repository extractions are verified;
- high-risk direct Prisma service usage is explicitly documented;
- controllers remain thin and Prisma-free;
- DTO gaps are identified without risky file movement;
- migration deployment caveat is documented honestly;
- full verification gates pass.
