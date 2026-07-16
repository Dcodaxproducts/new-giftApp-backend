# Payments & Subscriptions — Reference

Everything about Stripe payments in this backend: where money moves, what the
frontend must send, webhooks, idempotency, and how to test without a frontend.

> Stripe API version in use: **2025-03-31.basil** (see notes at the bottom — a few
> fields moved in this version).

---

## 1. Where PaymentIntents are created

| # | Purpose | File |
|---|---------|------|
| 1 | Order / checkout payment | `payments/services/payments.service.ts` (`createIntent`) |
| 2 | Money gift | `payments/services/payments.service.ts` (`createMoneyGift`) |
| 3 | Wallet top-up | `customer-wallet/customer-wallet.service.ts` (`addFunds`) |
| 4 | Recurring / off-session charge | `customer-recurring-payments/.../customer-recurring-payments.service.ts` |

Subscriptions do **not** create a raw PaymentIntent directly — they use
`stripe.subscriptions.create({ payment_behavior: 'default_incomplete' })`, which
produces an invoice + confirmation secret that the frontend confirms.

---

## 2. Idempotency (prevents double charges)

An idempotency key is a client-generated unique string (UUID) sent with a payment
request. If the same key hits Stripe/our backend twice (double-click, retry,
timeout), **no second charge happens** — the original result is returned.

**Rule:** one UUID per payment *attempt*; reuse the **same** UUID across retries of
that attempt; a **new** attempt (or page refresh) gets a **new** UUID.

| Endpoint | `idempotencyKey` |
|----------|------------------|
| Wallet `add-funds` | **required** |
| Subscription `checkout` | **required** |
| Order `create-intent` | optional (falls back to `orderId`) |
| Money gift | optional (falls back to `recipientContactId:deliveryDate`) |

Subscription/wallet have no natural unique id, so the key is **required** — the
frontend must always send one.

---

## 3. Saved cards (payment methods)

A saved card is referenced by its Stripe id `pm_xxx`. The real card number never
reaches the frontend — only `brand` + `last4` for display.

A card belongs to a Stripe **Customer** (`cus_xxx`). Saving a card *attaches* it to
that customer (`payment_method.attached` event). One user = one customer; the card,
subscriptions, and future charges must all use the **same** customer.

### Routes (`/api/v1` prefix)

| Method | Route | Purpose |
|--------|-------|---------|
| POST | `/customer/payment-methods/setup-intent` | Create SetupIntent to save a card. Body: **empty** (auth only). Returns `clientSecret`. |
| GET | `/customer/payment-methods/saved` | List saved cards `[{ id: pm_xxx, brand, last4, isDefault }]` |
| PATCH | `/customer/payment-methods/{id}/default` | Set default card |
| DELETE | `/customer/payment-methods/{id}` | Delete a card |

### Save-a-card flow
```
POST /setup-intent      -> clientSecret
frontend Stripe SDK confirmSetup(clientSecret, card)   -> card entered
webhook setup_intent.succeeded  -> card saved to DB (CustomerPaymentMethod)
GET /saved              -> card now appears
```

---

## 4. Subscription flow

### Routes (`/api/v1`)
| Method | Route |
|--------|-------|
| GET | `/customer/subscription/plans` |
| GET | `/customer/subscription/current` |
| POST | `/customer/subscription/checkout` |
| POST | `/customer/subscription/confirm` |
| POST | `/customer/subscription/action` (cancel / reactivate) |
| GET | `/customer/subscription/invoices` , `/invoices/{id}` |

### Checkout body
```json
{
  "planId": "cmr...",
  "billingCycle": "MONTHLY",         // or YEARLY
  "paymentMethod": "STRIPE_CARD",
  "idempotencyKey": "uuid-per-attempt",   // REQUIRED
  "stripePaymentMethodId": "pm_xxx"       // OPTIONAL — only for a saved card
}
```
Returns `{ customerSubscriptionId, stripeSubscriptionId, clientSecret, publishableKey, amount, currency, status }`.

### Two payment cases (frontend decides — mutually exclusive)

| Case | Send `stripePaymentMethodId`? | Show Stripe Element (card form)? |
|------|------------------------------|----------------------------------|
| **Saved card** | ✅ yes (`pm_xxx`) | ❌ no — show `Visa •••• 4242` from `GET /saved`, confirm with the id |
| **New card** | ❌ no | ✅ yes — user types card, confirm with `elements` |

**Order:** always call `/checkout` first to get `clientSecret`, *then* (new-card case)
mount the Stripe Element with that `clientSecret`.

### Full flow
```
1. GET /plans
2. POST /checkout           -> clientSecret (+ ids)
3. frontend: stripe.confirmPayment({ clientSecret, [elements] })
4. webhook (invoice.payment_succeeded / customer.subscription.updated)
        -> subscription auto-activated to ACTIVE
   (POST /confirm is a manual fallback if the webhook is delayed)
5. GET /current             -> ACTIVE / isPremium: true
```

---

## 5. Webhooks

**One endpoint handles everything:**
`POST https://<host>/api/v1/payments/stripe/webhook`
(`payments/controllers/payments.controller.ts` → `handleStripeWebhook`)

- Signature verified with `STRIPE_WEBHOOK_SECRET`.
- Events are deduplicated (`stripe-webhook-events` repo).

### Events to subscribe (Stripe Dashboard → Webhooks)
```
setup_intent.succeeded
payment_intent.succeeded
payment_intent.payment_failed
payment_intent.canceled
customer.subscription.created
customer.subscription.updated
customer.subscription.deleted
invoice.payment_succeeded
invoice.payment_failed
```

### What relies on webhooks
| Flow | Webhook needed? | Fallback |
|------|-----------------|----------|
| Save card | ✅ yes | none — card won't save without it |
| Initial subscription activation | no | `POST /confirm` pulls from Stripe |
| Cancel / reactivate | no | `action` calls Stripe directly |
| **Renewals (monthly/yearly)** | ✅ **yes** | **none** — must be configured |

### Local development
`localhost` can't receive dashboard webhooks. Use the Stripe CLI:
```
stripe listen --forward-to localhost:PORT/api/v1/payments/stripe/webhook
```
It prints a `whsec_...` secret — put it in `.env` as `STRIPE_WEBHOOK_SECRET`. The
command must stay running. Production uses a dashboard webhook instead (no CLI).

---

## 6. Env variables (keep test/live consistent)
```
STRIPE_SECRET_KEY        # sk_test_... or sk_live_...
STRIPE_PUBLISHABLE_KEY   # pk_test_... or pk_live_...
STRIPE_WEBHOOK_SECRET    # whsec_... — must match THIS webhook endpoint's secret
```
Test and live have different keys AND different webhook secrets. Mismatch → webhook
signature verification fails (400).

---

## 7. Testing without a frontend (Stripe test mode)

Use test card token `pm_card_visa` (always succeeds, non-3DS). Run in Git Bash or
use `curl.exe` in PowerShell. Stripe calls use Basic Auth (secret key as username,
empty password, note the trailing `:`).

### Save a card
```
# 1. create setup intent (your API, JWT auth)
curl.exe https://<host>/api/v1/customer/payment-methods/setup-intent -X POST -H "Authorization: Bearer <JWT>"
# 2. confirm it (Stripe API) -> attaches pm_card_visa
curl.exe https://api.stripe.com/v1/setup_intents/<seti_id>/confirm -u sk_test_...: -d payment_method=pm_card_visa
# 3. verify
curl.exe https://<host>/api/v1/customer/payment-methods/saved -H "Authorization: Bearer <JWT>"
```

### Subscribe with a saved card
```
# 1. checkout
curl.exe https://<host>/api/v1/customer/subscription/checkout -X POST -H "Authorization: Bearer <JWT>" -H "Content-Type: application/json" -d "{\"planId\":\"...\",\"billingCycle\":\"MONTHLY\",\"paymentMethod\":\"STRIPE_CARD\",\"stripePaymentMethodId\":\"pm_xxx\",\"idempotencyKey\":\"sub-001\"}"
# 2. pay the payment intent (id is the part before _secret_ in clientSecret)
curl.exe https://api.stripe.com/v1/payment_intents/<pi_id>/confirm -u sk_test_...: -d payment_method=pm_xxx
# 3. webhook auto-activates; verify
curl.exe https://<host>/api/v1/customer/subscription/current -H "Authorization: Bearer <JWT>"
```

**Notes:**
- Just *creating* an intent does not fire a success webhook — you must *confirm* it.
- The saved card and the subscription must be on the same Stripe customer, else
  Stripe returns "payment method not attached to the customer".

---

## 8. Basil API (2025-03-31) gotchas — already handled

- `invoice.payment_intent` removed → use `invoice.confirmation_secret.client_secret`.
  Checkout re-fetches the invoice with `confirmation_secret` expanded if the nested
  expand returns null, so `clientSecret` is never null.
- `subscription.current_period_start/end` moved onto **items**
  (`subscription.items.data[].current_period_*`). Read via `periodStart()/periodEnd()`
  helpers.

---

## 9. Stripe product/price caching

`SubscriptionPlan` caches `stripeProductId`, `stripeMonthlyPriceId`,
`stripeYearlyPriceId`. `ensureStripePrice` reuses them instead of creating a new
Stripe product/price on every checkout. When an admin edits a plan's price or
currency, the affected cache column is set to `null` so the next checkout mints a
fresh Stripe price at the new amount (Stripe prices are immutable).
