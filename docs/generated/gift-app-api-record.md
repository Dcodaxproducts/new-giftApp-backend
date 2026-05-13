# Gift App API Record

_Generated from OpenAPI: 2026-05-13T06:38:39.078Z_

## 02 Admin - Roles & Permissions

### `GET` `/api/v1/admin-roles`

GET /api/v1/admin-roles

## 02 Admin - Roles & Permissions

### `POST` `/api/v1/admin-roles`

POST /api/v1/admin-roles

## 02 Admin - Roles & Permissions

### `GET` `/api/v1/admin-roles/{id}`

GET /api/v1/admin-roles/{id}

## 02 Admin - Roles & Permissions

### `PATCH` `/api/v1/admin-roles/{id}`

PATCH /api/v1/admin-roles/{id}

## 02 Admin - Roles & Permissions

### `DELETE` `/api/v1/admin-roles/{id}`

DELETE /api/v1/admin-roles/{id}

## 02 Admin - Roles & Permissions

### `PATCH` `/api/v1/admin-roles/{id}/permissions`

PATCH /api/v1/admin-roles/{id}/permissions

## 02 Admin - Dispute Manager

### `GET` `/api/v1/admin/disputes`

List dispute queue

## 02 Admin - Dispute Manager

### `GET` `/api/v1/admin/disputes/{id}`

Fetch dispute details and evidence review summary

## 02 Admin - Dispute Manager

### `GET` `/api/v1/admin/disputes/{id}/evidence`

Fetch dispute evidence

## 02 Admin - Dispute Manager

### `GET` `/api/v1/admin/disputes/{id}/internal-data`

Fetch internal transaction data

## 02 Admin - Dispute Manager

### `POST` `/api/v1/admin/disputes/{id}/link-transaction`

Confirm dispute transaction linkage

## 02 Admin - Dispute Manager

### `GET` `/api/v1/admin/disputes/{id}/linkage`

Fetch current dispute transaction linkage state

## 02 Admin - Dispute Manager

### `GET` `/api/v1/admin/disputes/{id}/notes`

Fetch internal dispute notes

## 02 Admin - Dispute Manager

### `POST` `/api/v1/admin/disputes/{id}/notes`

Add internal dispute note

## 02 Admin - Dispute Manager

### `POST` `/api/v1/admin/disputes/{id}/refund-preview`

Preview dispute refund selection

## 02 Admin - Dispute Manager

### `GET` `/api/v1/admin/disputes/{id}/timeline`

Fetch dispute timeline

## 02 Admin - Dispute Manager

### `GET` `/api/v1/admin/disputes/{id}/transaction-search`

Search original transaction for a dispute

## 02 Admin - Dispute Manager

### `GET` `/api/v1/admin/disputes/export`

Export dispute cases

## 02 Admin - Dispute Manager

### `GET` `/api/v1/admin/disputes/stats`

Fetch dispute dashboard stats

## 02 Admin - Review Policies

### `GET` `/api/v1/admin/review-policies`

Fetch review moderation policies

## 02 Admin - Review Policies

### `PATCH` `/api/v1/admin/review-policies`

Update review moderation policies

## 02 Admin - Review Policies

### `POST` `/api/v1/admin/review-policies/test`

Test review policy result

## 02 Admin - Reviews Management

### `GET` `/api/v1/admin/reviews`

GET /api/v1/admin/reviews

## 02 Admin - Reviews Management

### `GET` `/api/v1/admin/reviews/{id}`

GET /api/v1/admin/reviews/{id}

## 02 Admin - Reviews Management

### `POST` `/api/v1/admin/reviews/{id}/moderate`

Moderate a review

## 02 Admin - Reviews Management

### `GET` `/api/v1/admin/reviews/dashboard`

Fetch platform review dashboard

## 02 Admin - Reviews Management

### `GET` `/api/v1/admin/reviews/export`

GET /api/v1/admin/reviews/export

## 02 Admin - Reviews Management

### `GET` `/api/v1/admin/reviews/flagged-summary`

GET /api/v1/admin/reviews/flagged-summary

## 02 Admin - Reviews Management

### `GET` `/api/v1/admin/reviews/moderation-logs`

GET /api/v1/admin/reviews/moderation-logs

## 02 Admin - Reviews Management

### `GET` `/api/v1/admin/reviews/moderation-queue`

GET /api/v1/admin/reviews/moderation-queue

## 02 Admin - Reviews Management

### `GET` `/api/v1/admin/reviews/stats`

GET /api/v1/admin/reviews/stats

## 02 Admin - Staff Management

### `GET` `/api/v1/admins`

List admin staff users

## 02 Admin - Staff Management

### `POST` `/api/v1/admins`

Create admin staff user

## 02 Admin - Staff Management

### `GET` `/api/v1/admins/{id}`

GET /api/v1/admins/{id}

## 02 Admin - Staff Management

### `PATCH` `/api/v1/admins/{id}`

PATCH /api/v1/admins/{id}

## 02 Admin - Staff Management

### `DELETE` `/api/v1/admins/{id}`

Permanently delete admin staff user

## 02 Admin - Staff Management

### `PATCH` `/api/v1/admins/{id}/active-status`

PATCH /api/v1/admins/{id}/active-status

## 02 Admin - Staff Management

### `PATCH` `/api/v1/admins/{id}/password`

PATCH /api/v1/admins/{id}/password

## 02 Admin - Audit Logs

### `GET` `/api/v1/audit-logs`

GET /api/v1/audit-logs

## 02 Admin - Audit Logs

### `GET` `/api/v1/audit-logs/{id}`

GET /api/v1/audit-logs/{id}

## 02 Admin - Audit Logs

### `GET` `/api/v1/audit-logs/export`

GET /api/v1/audit-logs/export

## 01 Auth

### `DELETE` `/api/v1/auth/account`

DELETE /api/v1/auth/account

## 01 Auth

### `POST` `/api/v1/auth/cancel-deletion`

POST /api/v1/auth/cancel-deletion

## 01 Auth

### `PATCH` `/api/v1/auth/change-password`

PATCH /api/v1/auth/change-password

## 01 Auth

### `POST` `/api/v1/auth/forgot-password`

POST /api/v1/auth/forgot-password

## 01 Auth

### `POST` `/api/v1/auth/guest/session`

POST /api/v1/auth/guest/session

## 01 Auth

### `POST` `/api/v1/auth/login`

POST /api/v1/auth/login

## 01 Auth

### `POST` `/api/v1/auth/logout`

POST /api/v1/auth/logout

## 01 Auth

### `GET` `/api/v1/auth/me`

GET /api/v1/auth/me

## 01 Auth

### `PATCH` `/api/v1/auth/me`

PATCH /api/v1/auth/me

## 01 Auth

### `POST` `/api/v1/auth/providers/register`

POST /api/v1/auth/providers/register

## 01 Auth

### `POST` `/api/v1/auth/refresh`

POST /api/v1/auth/refresh

## 01 Auth

### `POST` `/api/v1/auth/resend-otp`

POST /api/v1/auth/resend-otp

## 01 Auth

### `POST` `/api/v1/auth/reset-password`

POST /api/v1/auth/reset-password

## 01 Auth

### `GET` `/api/v1/auth/sessions`

GET /api/v1/auth/sessions

## 01 Auth

### `DELETE` `/api/v1/auth/sessions/{id}`

DELETE /api/v1/auth/sessions/{id}

## 01 Auth

### `POST` `/api/v1/auth/sessions/logout-all`

POST /api/v1/auth/sessions/logout-all

## 01 Auth

### `POST` `/api/v1/auth/users/register`

POST /api/v1/auth/users/register

## 01 Auth

### `POST` `/api/v1/auth/verify-email`

POST /api/v1/auth/verify-email

## 01 Auth

### `POST` `/api/v1/auth/verify-reset-otp`

POST /api/v1/auth/verify-reset-otp

## 06 Broadcast Notifications

### `GET` `/api/v1/broadcasts`

GET /api/v1/broadcasts

## 06 Broadcast Notifications

### `POST` `/api/v1/broadcasts`

POST /api/v1/broadcasts

## 06 Broadcast Notifications

### `GET` `/api/v1/broadcasts/{id}`

GET /api/v1/broadcasts/{id}

## 06 Broadcast Notifications

### `PATCH` `/api/v1/broadcasts/{id}`

PATCH /api/v1/broadcasts/{id}

## 06 Broadcast Notifications

### `POST` `/api/v1/broadcasts/{id}/cancel`

POST /api/v1/broadcasts/{id}/cancel

## 06 Broadcast Notifications

### `GET` `/api/v1/broadcasts/{id}/recipients`

GET /api/v1/broadcasts/{id}/recipients

## 06 Broadcast Notifications

### `GET` `/api/v1/broadcasts/{id}/report`

GET /api/v1/broadcasts/{id}/report

## 06 Broadcast Notifications

### `PATCH` `/api/v1/broadcasts/{id}/schedule`

PATCH /api/v1/broadcasts/{id}/schedule

## 06 Broadcast Notifications

### `PATCH` `/api/v1/broadcasts/{id}/targeting`

PATCH /api/v1/broadcasts/{id}/targeting

## 06 Broadcast Notifications

### `POST` `/api/v1/broadcasts/estimate-reach`

POST /api/v1/broadcasts/estimate-reach

## 07 Plans & Coupons

### `GET` `/api/v1/coupons`

GET /api/v1/coupons

## 07 Plans & Coupons

### `POST` `/api/v1/coupons`

POST /api/v1/coupons

## 07 Plans & Coupons

### `GET` `/api/v1/coupons/{id}`

GET /api/v1/coupons/{id}

## 07 Plans & Coupons

### `PATCH` `/api/v1/coupons/{id}`

PATCH /api/v1/coupons/{id}

## 07 Plans & Coupons

### `DELETE` `/api/v1/coupons/{id}`

DELETE /api/v1/coupons/{id}

## 07 Plans & Coupons

### `PATCH` `/api/v1/coupons/{id}/status`

PATCH /api/v1/coupons/{id}/status

## 05 Customer - Addresses

### `GET` `/api/v1/customer/addresses`

List customer addresses

## 05 Customer - Addresses

### `POST` `/api/v1/customer/addresses`

Create customer address

## 05 Customer - Addresses

### `GET` `/api/v1/customer/addresses/{id}`

Fetch customer address

## 05 Customer - Addresses

### `PATCH` `/api/v1/customer/addresses/{id}`

Update customer address

## 05 Customer - Addresses

### `DELETE` `/api/v1/customer/addresses/{id}`

Soft-delete customer address

## 05 Customer - Addresses

### `PATCH` `/api/v1/customer/addresses/{id}/default`

Set default customer address

## 05 Customer - Payment Methods

### `GET` `/api/v1/customer/bank-accounts`

List own bank accounts

## 05 Customer - Payment Methods

### `POST` `/api/v1/customer/bank-accounts`

Link placeholder bank account

## 05 Customer - Payment Methods

### `DELETE` `/api/v1/customer/bank-accounts/{id}`

Delete own bank account

## 05 Customer - Payment Methods

### `PATCH` `/api/v1/customer/bank-accounts/{id}/default`

Set own default bank account

## 05 Customer - Cart

### `GET` `/api/v1/customer/cart`

Fetch active cart

## 05 Customer - Cart

### `DELETE` `/api/v1/customer/cart`

Clear active cart

## 05 Customer - Cart

### `POST` `/api/v1/customer/cart/items`

Add item to cart

## 05 Customer - Cart

### `PATCH` `/api/v1/customer/cart/items/{id}`

Update cart item

## 05 Customer - Cart

### `DELETE` `/api/v1/customer/cart/items/{id}`

Delete cart item

## 05 Customer - Marketplace

### `GET` `/api/v1/customer/categories`

List customer marketplace categories

## 05 Customer - Provider Chat

### `GET` `/api/v1/customer/chats`

List customer provider chats

## 05 Customer - Provider Chat

### `GET` `/api/v1/customer/chats/{threadId}`

Fetch customer chat messages

## 05 Customer - Provider Chat

### `POST` `/api/v1/customer/chats/{threadId}/messages`

Send message to provider

## 05 Customer - Provider Chat

### `PATCH` `/api/v1/customer/chats/{threadId}/read`

Mark provider messages read

## 05 Customer - Provider Chat

### `GET` `/api/v1/customer/chats/quick-replies`

Fetch provider chat quick replies

## 05 Customer - Contacts

### `GET` `/api/v1/customer/contacts`

List customer contacts

## 05 Customer - Contacts

### `POST` `/api/v1/customer/contacts`

Create customer contact

## 05 Customer - Contacts

### `GET` `/api/v1/customer/contacts/{id}`

Fetch customer contact

## 05 Customer - Contacts

### `PATCH` `/api/v1/customer/contacts/{id}`

Update customer contact

## 05 Customer - Contacts

### `DELETE` `/api/v1/customer/contacts/{id}`

Soft-delete customer contact

## 05 Customer - Events

### `GET` `/api/v1/customer/events`

List customer events

## 05 Customer - Events

### `POST` `/api/v1/customer/events`

Create customer event

## 05 Customer - Events

### `GET` `/api/v1/customer/events/{id}`

Fetch customer event details

## 05 Customer - Events

### `PATCH` `/api/v1/customer/events/{id}`

Update customer event

## 05 Customer - Events

### `DELETE` `/api/v1/customer/events/{id}`

Soft-delete customer event

## 05 Customer - Events

### `GET` `/api/v1/customer/events/{id}/reminder-settings`

Fetch event reminder settings

## 05 Customer - Events

### `PATCH` `/api/v1/customer/events/{id}/reminder-settings`

Update event reminder settings

## 05 Customer - Events

### `GET` `/api/v1/customer/events/calendar`

Fetch monthly calendar events

## 05 Customer - Events

### `GET` `/api/v1/customer/events/upcoming`

Fetch upcoming customer events

## 05 Customer - Marketplace

### `GET` `/api/v1/customer/gifts`

List customer marketplace gifts

## 05 Customer - Marketplace

### `GET` `/api/v1/customer/gifts/{id}`

Fetch customer-safe gift details

## 05 Customer - Marketplace

### `GET` `/api/v1/customer/gifts/discounted`

List discounted customer gifts

## 05 Customer - Marketplace

### `GET` `/api/v1/customer/gifts/filter-options`

Fetch marketplace gift filter options

## 05 Customer - Marketplace

### `GET` `/api/v1/customer/home`

Fetch customer app home

## 06 Payments

### `GET` `/api/v1/customer/money-gifts`

List own money gifts

## 06 Payments

### `POST` `/api/v1/customer/money-gifts`

Send payment as gift

## 06 Payments

### `GET` `/api/v1/customer/money-gifts/{id}`

Fetch own money gift details

## 05 Customer - Orders

### `GET` `/api/v1/customer/orders`

List customer orders

## 05 Customer - Orders

### `POST` `/api/v1/customer/orders`

Create order from active cart

## 05 Customer - Orders

### `GET` `/api/v1/customer/orders/{id}`

Fetch customer order

## 05 Customer - Provider Chat

### `GET` `/api/v1/customer/orders/{id}/chat`

Get or optionally create order chat

## 05 Customer - Provider Chat

### `POST` `/api/v1/customer/orders/{id}/chat`

Create order chat

## 05 Customer - Reviews

### `POST` `/api/v1/customer/orders/{id}/reviews`

Submit provider review for an order

## 05 Customer - Payment Methods

### `GET` `/api/v1/customer/payment-methods`

List supported customer payment methods

## 05 Customer - Payment Methods

### `DELETE` `/api/v1/customer/payment-methods/{id}`

Delete own saved payment method

## 05 Customer - Payment Methods

### `PATCH` `/api/v1/customer/payment-methods/{id}/default`

Set own default payment method

## 05 Customer - Payment Methods

### `GET` `/api/v1/customer/payment-methods/saved`

List own saved payment methods

## 05 Customer - Payment Methods

### `POST` `/api/v1/customer/payment-methods/setup-intent`

Create Stripe SetupIntent for saving card

## 06 Payments

### `GET` `/api/v1/customer/payments/{id}`

Fetch own payment details

## 06 Payments

### `POST` `/api/v1/customer/payments/confirm`

Confirm Stripe payment

## 06 Payments

### `POST` `/api/v1/customer/payments/create-intent`

Create payment intent from active cart

## 05 Customer - Provider Reports

### `GET` `/api/v1/customer/provider-report-reasons`

Fetch provider report reasons

## 05 Customer - Provider Reports

### `GET` `/api/v1/customer/provider-reports`

GET /api/v1/customer/provider-reports

## 05 Customer - Provider Reports

### `GET` `/api/v1/customer/provider-reports/{id}`

GET /api/v1/customer/provider-reports/{id}

## 05 Customer - Provider Reports

### `POST` `/api/v1/customer/providers/{providerId}/reports`

Report provider

## 05 Customer - Recurring Payments

### `GET` `/api/v1/customer/recurring-payments`

List own recurring payments

## 05 Customer - Recurring Payments

### `POST` `/api/v1/customer/recurring-payments`

Create recurring payment

## 05 Customer - Recurring Payments

### `GET` `/api/v1/customer/recurring-payments/{id}`

Fetch own recurring payment details

## 05 Customer - Recurring Payments

### `PATCH` `/api/v1/customer/recurring-payments/{id}`

Update own recurring payment

## 05 Customer - Recurring Payments

### `POST` `/api/v1/customer/recurring-payments/{id}/cancel`

Cancel own recurring payment

## 05 Customer - Recurring Payments

### `GET` `/api/v1/customer/recurring-payments/{id}/history`

List own recurring payment billing history

## 05 Customer - Recurring Payments

### `POST` `/api/v1/customer/recurring-payments/{id}/pause`

Pause own active recurring payment

## 05 Customer - Recurring Payments

### `POST` `/api/v1/customer/recurring-payments/{id}/resume`

Resume own paused recurring payment

## 05 Customer - Recurring Payments

### `GET` `/api/v1/customer/recurring-payments/summary`

Fetch recurring payment summary counts

## 05 Customer - Referrals & Rewards

### `GET` `/api/v1/customer/referrals/history`

List own referral history

## 05 Customer - Referrals & Rewards

### `GET` `/api/v1/customer/referrals/link`

Fetch own referral link

## 05 Customer - Referrals & Rewards

### `POST` `/api/v1/customer/referrals/redeem`

Redeem own available reward credit

## 05 Customer - Referrals & Rewards

### `GET` `/api/v1/customer/referrals/summary`

Fetch own referral reward summary

## 05 Customer - Referrals & Rewards

### `GET` `/api/v1/customer/referrals/terms`

Fetch referral terms

## 05 Customer - Reviews

### `GET` `/api/v1/customer/reviews`

List own provider reviews

## 05 Customer - Reviews

### `GET` `/api/v1/customer/reviews/{id}`

GET /api/v1/customer/reviews/{id}

## 05 Customer - Reviews

### `PATCH` `/api/v1/customer/reviews/{id}`

Update own review

## 05 Customer - Reviews

### `DELETE` `/api/v1/customer/reviews/{id}`

Soft-delete own review

## 05 Customer - Referrals & Rewards

### `GET` `/api/v1/customer/rewards/balance`

Fetch own reward balance

## 05 Customer - Referrals & Rewards

### `GET` `/api/v1/customer/rewards/ledger`

List own reward ledger

## 05 Customer - Subscriptions

### `POST` `/api/v1/customer/subscription/apply-coupon`

Preview subscription coupon

## 05 Customer - Subscriptions

### `POST` `/api/v1/customer/subscription/cancel`

Cancel own subscription

## 05 Customer - Subscriptions

### `POST` `/api/v1/customer/subscription/checkout`

Create Stripe subscription checkout

## 05 Customer - Subscriptions

### `POST` `/api/v1/customer/subscription/confirm`

Confirm Stripe subscription activation

## 05 Customer - Subscriptions

### `GET` `/api/v1/customer/subscription/current`

Fetch own current subscription

## 05 Customer - Subscriptions

### `GET` `/api/v1/customer/subscription/invoices`

List own subscription invoices

## 05 Customer - Subscriptions

### `GET` `/api/v1/customer/subscription/invoices/{id}`

Fetch own subscription invoice details

## 05 Customer - Subscriptions

### `GET` `/api/v1/customer/subscription/plans`

List public active subscription plans

## 05 Customer - Subscriptions

### `POST` `/api/v1/customer/subscription/reactivate`

Reactivate scheduled cancellation

## 05 Customer - Transactions

### `GET` `/api/v1/customer/transactions`

List own customer transactions

## 05 Customer - Transactions

### `GET` `/api/v1/customer/transactions/{id}`

Fetch own transaction details

## 05 Customer - Transactions

### `GET` `/api/v1/customer/transactions/{id}/receipt`

Download own transaction receipt

## 05 Customer - Transactions

### `GET` `/api/v1/customer/transactions/export`

Export own transactions

## 05 Customer - Transactions

### `GET` `/api/v1/customer/transactions/summary`

Fetch own transaction summary

## 05 Customer - Wallet

### `GET` `/api/v1/customer/wallet`

Fetch own wallet

## 05 Customer - Wallet

### `POST` `/api/v1/customer/wallet/add-funds`

Create wallet top-up payment

## 05 Customer - Wallet

### `GET` `/api/v1/customer/wallet/history`

List own wallet history

## 05 Customer - Wishlist

### `GET` `/api/v1/customer/wishlist`

List wishlist gifts

## 05 Customer - Wishlist

### `POST` `/api/v1/customer/wishlist/{giftId}`

Add gift to wishlist

## 05 Customer - Wishlist

### `DELETE` `/api/v1/customer/wishlist/{giftId}`

Remove gift from wishlist

## 04 Gifts - Categories

### `GET` `/api/v1/gift-categories`

List gift categories

## 04 Gifts - Categories

### `POST` `/api/v1/gift-categories`

Create gift category

## 04 Gifts - Categories

### `GET` `/api/v1/gift-categories/{id}`

Fetch gift category details

## 04 Gifts - Categories

### `PATCH` `/api/v1/gift-categories/{id}`

Update gift category

## 04 Gifts - Categories

### `DELETE` `/api/v1/gift-categories/{id}`

Soft-delete gift category

## 04 Gifts - Categories

### `GET` `/api/v1/gift-categories/lookup`

Lookup active gift categories

## 04 Gifts - Categories

### `GET` `/api/v1/gift-categories/stats`

Fetch gift category stats

## 04 Gifts - Moderation

### `GET` `/api/v1/gift-moderation`

List optional gift moderation queue

## 04 Gifts - Moderation

### `PATCH` `/api/v1/gift-moderation/{id}/approve`

Approve gift in optional moderation workflow

## 04 Gifts - Moderation

### `PATCH` `/api/v1/gift-moderation/{id}/flag`

PATCH /api/v1/gift-moderation/{id}/flag

## 04 Gifts - Moderation

### `PATCH` `/api/v1/gift-moderation/{id}/reject`

PATCH /api/v1/gift-moderation/{id}/reject

## 04 Gifts - Management

### `GET` `/api/v1/gifts`

List admin gifts

## 04 Gifts - Management

### `POST` `/api/v1/gifts`

Create admin gift with optional nested variants

## 04 Gifts - Management

### `GET` `/api/v1/gifts/{id}`

Fetch admin gift details with variants

## 04 Gifts - Management

### `PATCH` `/api/v1/gifts/{id}`

Update admin gift and upsert nested variants

## 04 Gifts - Management

### `DELETE` `/api/v1/gifts/{id}`

Soft-delete gift

## 04 Gifts - Management

### `PATCH` `/api/v1/gifts/{id}/status`

Update gift status

## 04 Gifts - Management

### `GET` `/api/v1/gifts/export`

Export gift inventory

## 04 Gifts - Management

### `GET` `/api/v1/gifts/stats`

Fetch gift inventory stats

## 01 Auth - Login Attempts

### `GET` `/api/v1/login-attempts`

GET /api/v1/login-attempts

## 01 Auth - Login Attempts

### `GET` `/api/v1/login-attempts/export`

GET /api/v1/login-attempts/export

## 01 Auth - Login Attempts

### `GET` `/api/v1/login-attempts/stats`

GET /api/v1/login-attempts/stats

## 02 Admin - Media Upload Policy

### `GET` `/api/v1/media-upload-policy`

Fetch global media upload policy

## 02 Admin - Media Upload Policy

### `PATCH` `/api/v1/media-upload-policy`

Update global media upload policy

## 02 Admin - Media Upload Policy

### `GET` `/api/v1/media-upload-policy/audit-logs`

List media upload policy audit logs

## 06 Notifications

### `GET` `/api/v1/notifications`

List notifications

## 06 Notifications

### `POST` `/api/v1/notifications/{id}/action`

Process notification action

## 06 Notifications

### `PATCH` `/api/v1/notifications/{id}/read`

Mark notification as read

## 06 Notifications

### `POST` `/api/v1/notifications/device-tokens`

Save device token

## 06 Notifications

### `DELETE` `/api/v1/notifications/device-tokens/{id}`

Disable device token

## 06 Notifications

### `GET` `/api/v1/notifications/preferences`

Fetch notification preferences

## 06 Notifications

### `PATCH` `/api/v1/notifications/preferences`

Update notification preferences

## 06 Notifications

### `PATCH` `/api/v1/notifications/read-all`

Mark all own notifications as read

## 06 Notifications

### `GET` `/api/v1/notifications/summary`

Fetch notification summary

## 06 Payments

### `POST` `/api/v1/payments/stripe/webhook`

Stripe webhook endpoint

## 02 Admin - Roles & Permissions

### `GET` `/api/v1/permissions/catalog`

GET /api/v1/permissions/catalog

## 07 Plans & Coupons

### `GET` `/api/v1/plan-features`

GET /api/v1/plan-features

## 07 Plans & Coupons

### `POST` `/api/v1/plan-features`

POST /api/v1/plan-features

## 07 Plans & Coupons

### `GET` `/api/v1/plan-features/{id}`

GET /api/v1/plan-features/{id}

## 07 Plans & Coupons

### `PATCH` `/api/v1/plan-features/{id}`

PATCH /api/v1/plan-features/{id}

## 07 Plans & Coupons

### `DELETE` `/api/v1/plan-features/{id}`

DELETE /api/v1/plan-features/{id}

## 07 Plans & Coupons

### `GET` `/api/v1/plan-features/catalog`

GET /api/v1/plan-features/catalog

## 03 Provider - Promotional Offers

### `GET` `/api/v1/promotional-offers`

GET /api/v1/promotional-offers

## 03 Provider - Promotional Offers

### `POST` `/api/v1/promotional-offers`

POST /api/v1/promotional-offers

## 03 Provider - Promotional Offers

### `GET` `/api/v1/promotional-offers/{id}`

GET /api/v1/promotional-offers/{id}

## 03 Provider - Promotional Offers

### `PATCH` `/api/v1/promotional-offers/{id}`

PATCH /api/v1/promotional-offers/{id}

## 03 Provider - Promotional Offers

### `DELETE` `/api/v1/promotional-offers/{id}`

DELETE /api/v1/promotional-offers/{id}

## 03 Provider - Promotional Offers

### `PATCH` `/api/v1/promotional-offers/{id}/approve`

PATCH /api/v1/promotional-offers/{id}/approve

## 03 Provider - Promotional Offers

### `PATCH` `/api/v1/promotional-offers/{id}/reject`

PATCH /api/v1/promotional-offers/{id}/reject

## 03 Provider - Promotional Offers

### `PATCH` `/api/v1/promotional-offers/{id}/status`

PATCH /api/v1/promotional-offers/{id}/status

## 03 Provider - Promotional Offers

### `GET` `/api/v1/promotional-offers/export`

GET /api/v1/promotional-offers/export

## 03 Provider - Promotional Offers

### `GET` `/api/v1/promotional-offers/stats`

GET /api/v1/promotional-offers/stats

## 02 Admin - Provider Business Categories

### `GET` `/api/v1/provider-business-categories`

List provider business categories

## 02 Admin - Provider Business Categories

### `POST` `/api/v1/provider-business-categories`

Create provider business category

## 02 Admin - Provider Business Categories

### `GET` `/api/v1/provider-business-categories/{id}`

Fetch provider business category details

## 02 Admin - Provider Business Categories

### `PATCH` `/api/v1/provider-business-categories/{id}`

Update provider business category

## 02 Admin - Provider Business Categories

### `DELETE` `/api/v1/provider-business-categories/{id}`

Soft-delete provider business category

## 03 Provider - Business Info

### `GET` `/api/v1/provider/business-info`

Fetch own provider business information

## 03 Provider - Business Info

### `PATCH` `/api/v1/provider/business-info`

Update own provider business information

## 03 Provider - Buyer Chat

### `GET` `/api/v1/provider/chats`

List provider buyer chats

## 03 Provider - Buyer Chat

### `GET` `/api/v1/provider/chats/{threadId}`

Fetch provider buyer chat messages

## 03 Provider - Buyer Chat

### `POST` `/api/v1/provider/chats/{threadId}/messages`

Send chat message to buyer

## 03 Provider - Buyer Chat

### `PATCH` `/api/v1/provider/chats/{threadId}/read`

Mark buyer messages read

## 03 Provider - Buyer Chat

### `GET` `/api/v1/provider/chats/quick-replies`

Fetch provider buyer chat quick replies

## 03 Provider - Inventory

### `GET` `/api/v1/provider/inventory`

List provider inventory items

## 03 Provider - Inventory

### `POST` `/api/v1/provider/inventory`

Create provider inventory item with optional nested variants

## 03 Provider - Inventory

### `GET` `/api/v1/provider/inventory/{id}`

Fetch own provider inventory item details

## 03 Provider - Inventory

### `PATCH` `/api/v1/provider/inventory/{id}`

Update own provider inventory item and upsert variants

## 03 Provider - Inventory

### `DELETE` `/api/v1/provider/inventory/{id}`

Soft-delete own inventory item

## 03 Provider - Inventory

### `PATCH` `/api/v1/provider/inventory/{id}/availability`

Update own inventory availability

## 03 Provider - Inventory

### `GET` `/api/v1/provider/inventory/lookup`

Lookup active provider inventory items

## 03 Provider - Inventory

### `GET` `/api/v1/provider/inventory/stats`

Fetch provider inventory stats

## 03 Provider - Promotional Offers

### `GET` `/api/v1/provider/offers`

GET /api/v1/provider/offers

## 03 Provider - Promotional Offers

### `POST` `/api/v1/provider/offers`

POST /api/v1/provider/offers

## 03 Provider - Promotional Offers

### `GET` `/api/v1/provider/offers/{id}`

GET /api/v1/provider/offers/{id}

## 03 Provider - Promotional Offers

### `PATCH` `/api/v1/provider/offers/{id}`

PATCH /api/v1/provider/offers/{id}

## 03 Provider - Promotional Offers

### `DELETE` `/api/v1/provider/offers/{id}`

DELETE /api/v1/provider/offers/{id}

## 03 Provider - Promotional Offers

### `PATCH` `/api/v1/provider/offers/{id}/status`

PATCH /api/v1/provider/offers/{id}/status

## 03 Provider - Orders

### `GET` `/api/v1/provider/orders`

List own assigned provider orders

## 03 Provider - Orders

### `GET` `/api/v1/provider/orders/{id}`

Fetch own provider order details

## 03 Provider - Orders

### `POST` `/api/v1/provider/orders/{id}/accept`

Accept own pending provider order

## 03 Provider - Buyer Chat

### `GET` `/api/v1/provider/orders/{id}/chat`

Get or optionally create provider order chat

## 03 Provider - Buyer Chat

### `POST` `/api/v1/provider/orders/{id}/chat`

Create provider order chat

## 03 Provider - Orders

### `GET` `/api/v1/provider/orders/{id}/checklist`

Fetch own provider order checklist

## 03 Provider - Orders

### `PATCH` `/api/v1/provider/orders/{id}/checklist`

Update own provider order checklist

## 03 Provider - Orders

### `POST` `/api/v1/provider/orders/{id}/fulfill`

Fulfill own provider order with dispatch details

## 03 Provider - Orders

### `POST` `/api/v1/provider/orders/{id}/message-buyer`

Message buyer for own provider order

## 03 Provider - Orders

### `POST` `/api/v1/provider/orders/{id}/reject`

Reject own pending provider order

## 03 Provider - Orders

### `PATCH` `/api/v1/provider/orders/{id}/status`

Update own provider order fulfillment status

## 03 Provider - Orders

### `GET` `/api/v1/provider/orders/{id}/timeline`

Fetch own provider order timeline

## 03 Provider - Orders

### `GET` `/api/v1/provider/orders/analytics/ratings`

Fetch own provider ratings analytics

## 03 Provider - Orders

### `GET` `/api/v1/provider/orders/analytics/revenue`

Fetch own provider revenue analytics

## 03 Provider - Orders

### `GET` `/api/v1/provider/orders/export`

Export own provider orders as CSV

## 03 Provider - Orders

### `GET` `/api/v1/provider/orders/history`

List own provider order history

## 03 Provider - Orders

### `GET` `/api/v1/provider/orders/performance`

Fetch own provider order performance

## 03 Provider - Orders

### `GET` `/api/v1/provider/orders/recent`

List recent own provider orders

## 03 Provider - Orders

### `GET` `/api/v1/provider/orders/reject-reasons`

List provider order reject reasons

## 03 Provider - Orders

### `GET` `/api/v1/provider/orders/summary`

Fetch own provider order summary

## 03 Provider - Refund Requests

### `GET` `/api/v1/provider/refund-requests`

List own provider refund requests

## 03 Provider - Refund Requests

### `GET` `/api/v1/provider/refund-requests/{id}`

Fetch own refund request details

## 03 Provider - Refund Requests

### `POST` `/api/v1/provider/refund-requests/{id}/approve`

Approve own requested refund

## 03 Provider - Refund Requests

### `POST` `/api/v1/provider/refund-requests/{id}/reject`

Reject own requested refund

## 03 Provider - Refund Requests

### `GET` `/api/v1/provider/refund-requests/reject-reasons`

List refund rejection reasons

## 03 Provider - Refund Requests

### `GET` `/api/v1/provider/refund-requests/summary`

Fetch own refund request summary

## 03 Provider - Reviews

### `GET` `/api/v1/provider/reviews`

List provider reviews

## 03 Provider - Reviews

### `GET` `/api/v1/provider/reviews/{id}`

GET /api/v1/provider/reviews/{id}

## 03 Provider - Reviews

### `POST` `/api/v1/provider/reviews/{id}/response`

Post public review response

## 03 Provider - Reviews

### `PATCH` `/api/v1/provider/reviews/{id}/response`

Update public review response

## 03 Provider - Reviews

### `DELETE` `/api/v1/provider/reviews/{id}/response`

Soft-delete public review response

## 03 Provider - Reviews

### `GET` `/api/v1/provider/reviews/filter-options`

Fetch provider review filter options

## 03 Provider - Reviews

### `GET` `/api/v1/provider/reviews/summary`

Fetch provider rating summary

## 02 Admin - Provider Management

### `GET` `/api/v1/providers`

List providers

## 02 Admin - Provider Management

### `POST` `/api/v1/providers`

Create provider from admin dashboard

## 02 Admin - Provider Management

### `GET` `/api/v1/providers/{id}`

GET /api/v1/providers/{id}

## 02 Admin - Provider Management

### `PATCH` `/api/v1/providers/{id}`

PATCH /api/v1/providers/{id}

## 02 Admin - Provider Management

### `DELETE` `/api/v1/providers/{id}`

Permanently delete provider

## 02 Admin - Provider Management

### `GET` `/api/v1/providers/{id}/activity`

GET /api/v1/providers/{id}/activity

## 02 Admin - Provider Management

### `GET` `/api/v1/providers/{id}/items`

GET /api/v1/providers/{id}/items

## 02 Admin - Provider Management

### `POST` `/api/v1/providers/{id}/message`

POST /api/v1/providers/{id}/message

## 02 Admin - Provider Management

### `PATCH` `/api/v1/providers/{id}/status`

Update provider lifecycle status

## 02 Admin - Provider Management

### `GET` `/api/v1/providers/export`

GET /api/v1/providers/export

## 02 Admin - Provider Management

### `GET` `/api/v1/providers/lookup`

GET /api/v1/providers/lookup

## 02 Admin - Provider Management

### `GET` `/api/v1/providers/stats`

GET /api/v1/providers/stats

## 02 Admin - Referral Settings

### `GET` `/api/v1/referral-settings`

Fetch referral settings

## 02 Admin - Referral Settings

### `PATCH` `/api/v1/referral-settings`

Update referral settings

## 02 Admin - Referral Settings

### `POST` `/api/v1/referral-settings/activate`

Activate referral program

## 02 Admin - Referral Settings

### `GET` `/api/v1/referral-settings/audit-logs`

List referral settings audit logs

## 02 Admin - Referral Settings

### `POST` `/api/v1/referral-settings/deactivate`

Deactivate referral program

## 02 Admin - Referral Settings

### `GET` `/api/v1/referral-settings/stats`

Fetch referral stats

## 07 Plans & Coupons

### `GET` `/api/v1/subscription-plans`

GET /api/v1/subscription-plans

## 07 Plans & Coupons

### `POST` `/api/v1/subscription-plans`

POST /api/v1/subscription-plans

## 07 Plans & Coupons

### `GET` `/api/v1/subscription-plans/{id}`

GET /api/v1/subscription-plans/{id}

## 07 Plans & Coupons

### `PATCH` `/api/v1/subscription-plans/{id}`

PATCH /api/v1/subscription-plans/{id}

## 07 Plans & Coupons

### `DELETE` `/api/v1/subscription-plans/{id}`

DELETE /api/v1/subscription-plans/{id}

## 07 Plans & Coupons

### `GET` `/api/v1/subscription-plans/{id}/analytics`

GET /api/v1/subscription-plans/{id}/analytics

## 07 Plans & Coupons

### `PATCH` `/api/v1/subscription-plans/{id}/status`

PATCH /api/v1/subscription-plans/{id}/status

## 07 Plans & Coupons

### `PATCH` `/api/v1/subscription-plans/{id}/visibility`

PATCH /api/v1/subscription-plans/{id}/visibility

## 07 Plans & Coupons

### `GET` `/api/v1/subscription-plans/stats`

GET /api/v1/subscription-plans/stats

## 07 Storage

### `GET` `/api/v1/uploads`

GET /api/v1/uploads

## 07 Storage

### `GET` `/api/v1/uploads/{id}`

GET /api/v1/uploads/{id}

## 07 Storage

### `DELETE` `/api/v1/uploads/{id}`

DELETE /api/v1/uploads/{id}

## 07 Storage

### `POST` `/api/v1/uploads/complete`

POST /api/v1/uploads/complete

## 07 Storage

### `POST` `/api/v1/uploads/presigned-url`

Create presigned upload URL

## 02 Admin - User Management

### `GET` `/api/v1/users`

List registered users

## 02 Admin - User Management

### `GET` `/api/v1/users/{id}`

GET /api/v1/users/{id}

## 02 Admin - User Management

### `PATCH` `/api/v1/users/{id}`

PATCH /api/v1/users/{id}

## 02 Admin - User Management

### `DELETE` `/api/v1/users/{id}`

Permanently delete registered user

## 02 Admin - User Management

### `GET` `/api/v1/users/{id}/activity`

GET /api/v1/users/{id}/activity

## 02 Admin - User Management

### `POST` `/api/v1/users/{id}/reset-password`

Change registered user password

## 02 Admin - User Management

### `GET` `/api/v1/users/{id}/stats`

GET /api/v1/users/{id}/stats

## 02 Admin - User Management

### `PATCH` `/api/v1/users/{id}/status`

PATCH /api/v1/users/{id}/status

## 02 Admin - User Management

### `POST` `/api/v1/users/{id}/suspend`

POST /api/v1/users/{id}/suspend

## 02 Admin - User Management

### `POST` `/api/v1/users/{id}/unsuspend`

POST /api/v1/users/{id}/unsuspend

## 02 Admin - User Management

### `GET` `/api/v1/users/export`

GET /api/v1/users/export
