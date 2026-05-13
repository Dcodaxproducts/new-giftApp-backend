# Gift App API Record

_Generated from OpenAPI: 2026-05-13T12:25:55.240Z_

## 02 Admin - Roles & Permissions

### `GET` `/api/v1/admin-roles`

List Admin Roles

## 02 Admin - Roles & Permissions

### `POST` `/api/v1/admin-roles`

Create Admin Roles

## 02 Admin - Roles & Permissions

### `GET` `/api/v1/admin-roles/{id}`

Fetch Admin Roles details

## 02 Admin - Roles & Permissions

### `PATCH` `/api/v1/admin-roles/{id}`

Update Admin Roles

## 02 Admin - Roles & Permissions

### `DELETE` `/api/v1/admin-roles/{id}`

Delete Admin Roles

## 02 Admin - Roles & Permissions

### `PATCH` `/api/v1/admin-roles/{id}/permissions`

Update Admin Roles Permissions

## 02 Admin - Dispute Manager

### `GET` `/api/v1/admin/disputes`

List dispute queue

## 02 Admin - Dispute Manager

### `GET` `/api/v1/admin/disputes/{id}`

Fetch dispute details and evidence review summary

## 02 Admin - Dispute Decisions

### `GET` `/api/v1/admin/disputes/{id}/confirmation`

Fetch decision confirmation

## 02 Admin - Dispute Decisions

### `POST` `/api/v1/admin/disputes/{id}/decision`

Submit final dispute decision

## 02 Admin - Dispute Decisions

### `GET` `/api/v1/admin/disputes/{id}/decision-summary`

Fetch dispute decision summary

## 02 Admin - Dispute Evidence

### `GET` `/api/v1/admin/disputes/{id}/evidence`

Fetch dispute evidence

## 02 Admin - Dispute Tracking

### `POST` `/api/v1/admin/disputes/{id}/follow-up-notes`

Add dispute follow-up note

## 02 Admin - Dispute Manager

### `GET` `/api/v1/admin/disputes/{id}/internal-data`

Fetch internal transaction data

## 02 Admin - Dispute Linkage

### `POST` `/api/v1/admin/disputes/{id}/link-transaction`

Confirm dispute transaction linkage

## 02 Admin - Dispute Linkage

### `GET` `/api/v1/admin/disputes/{id}/linkage`

Fetch current dispute transaction linkage state

## 02 Admin - Dispute Manager

### `GET` `/api/v1/admin/disputes/{id}/notes`

Fetch internal dispute notes

## 02 Admin - Dispute Manager

### `POST` `/api/v1/admin/disputes/{id}/notes`

Add internal dispute note

## 02 Admin - Dispute Linkage

### `POST` `/api/v1/admin/disputes/{id}/refund-preview`

Preview dispute refund selection

## 02 Admin - Dispute Manager

### `GET` `/api/v1/admin/disputes/{id}/timeline`

Fetch dispute timeline

## 02 Admin - Dispute Tracking

### `GET` `/api/v1/admin/disputes/{id}/tracking-log`

Fetch full dispute tracking log

## 02 Admin - Dispute Tracking

### `GET` `/api/v1/admin/disputes/{id}/tracking-log/export`

Export full dispute tracking log

## 02 Admin - Dispute Linkage

### `GET` `/api/v1/admin/disputes/{id}/transaction-search`

Search original transaction for a dispute

## 02 Admin - Dispute Manager

### `GET` `/api/v1/admin/disputes/export`

Export dispute cases

## 02 Admin - Dispute Manager

### `GET` `/api/v1/admin/disputes/stats`

Fetch dispute dashboard stats

## 02 Admin - Provider Dispute Manager

### `GET` `/api/v1/admin/provider-disputes`

List provider dispute queue

## 02 Admin - Provider Dispute Manager

### `GET` `/api/v1/admin/provider-disputes/{id}`

Fetch provider dispute details

## 02 Admin - Provider Dispute Evidence

### `GET` `/api/v1/admin/provider-disputes/{id}/evidence`

Fetch provider dispute evidence exchange

## 02 Admin - Provider Dispute Evidence

### `POST` `/api/v1/admin/provider-disputes/{id}/evidence/mark-reviewed`

Mark provider dispute evidence review complete

## 02 Admin - Provider Dispute Evidence

### `POST` `/api/v1/admin/provider-disputes/{id}/evidence/request`

Request additional provider dispute evidence

## 02 Admin - Provider Financial Adjustments

### `POST` `/api/v1/admin/provider-disputes/{id}/final-attestation`

Complete final financial attestation

## 02 Admin - Provider Dispute Resolution

### `POST` `/api/v1/admin/provider-disputes/{id}/finalize`

Finalize provider dispute

## 02 Admin - Provider Financial Adjustments

### `GET` `/api/v1/admin/provider-disputes/{id}/financial-impact`

Fetch provider dispute financial impact

## 02 Admin - Provider Dispute Manager

### `GET` `/api/v1/admin/provider-disputes/{id}/notes`

Fetch provider dispute internal notes

## 02 Admin - Provider Dispute Manager

### `POST` `/api/v1/admin/provider-disputes/{id}/notes`

Add provider dispute internal note

## 02 Admin - Provider Dispute Resolution

### `POST` `/api/v1/admin/provider-disputes/{id}/notify-again`

Resend provider dispute notifications

## 02 Admin - Provider Financial Adjustments

### `POST` `/api/v1/admin/provider-disputes/{id}/payout-penalty-linkage`

Link payout and penalty adjustments

## 02 Admin - Provider Dispute Resolution

### `GET` `/api/v1/admin/provider-disputes/{id}/resolution`

Fetch provider dispute resolution summary

## 02 Admin - Provider Dispute Logs

### `GET` `/api/v1/admin/provider-disputes/{id}/resolution-log`

Fetch provider dispute resolution log

## 02 Admin - Provider Dispute Logs

### `GET` `/api/v1/admin/provider-disputes/{id}/resolution-log/export`

Export provider dispute resolution log

## 02 Admin - Provider Dispute Rulings

### `POST` `/api/v1/admin/provider-disputes/{id}/ruling`

Save provider dispute ruling

## 02 Admin - Provider Dispute Rulings

### `GET` `/api/v1/admin/provider-disputes/{id}/ruling-summary`

Fetch provider dispute ruling summary

## 02 Admin - Provider Dispute Manager

### `GET` `/api/v1/admin/provider-disputes/{id}/timeline`

Fetch provider dispute timeline

## 02 Admin - Provider Dispute Manager

### `GET` `/api/v1/admin/provider-disputes/export`

Export provider dispute queue

## 02 Admin - Provider Dispute Manager

### `GET` `/api/v1/admin/provider-disputes/stats`

Fetch provider dispute dashboard stats

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

List Admin Reviews

## 02 Admin - Reviews Management

### `GET` `/api/v1/admin/reviews/{id}`

Fetch Admin Reviews details

## 02 Admin - Review Moderation

### `POST` `/api/v1/admin/reviews/{id}/moderate`

Moderate a review

## 02 Admin - Reviews Management

### `GET` `/api/v1/admin/reviews/dashboard`

Fetch platform review dashboard

## 02 Admin - Reviews Management

### `GET` `/api/v1/admin/reviews/export`

List Admin Reviews Export

## 02 Admin - Review Moderation

### `GET` `/api/v1/admin/reviews/flagged-summary`

List Admin Reviews Flagged Summary

## 02 Admin - Review Moderation

### `GET` `/api/v1/admin/reviews/moderation-logs`

List Admin Reviews Moderation Logs

## 02 Admin - Review Moderation

### `GET` `/api/v1/admin/reviews/moderation-queue`

List Admin Reviews Moderation Queue

## 02 Admin - Reviews Management

### `GET` `/api/v1/admin/reviews/stats`

List Admin Reviews Stats

## 02 Admin - Staff Management

### `GET` `/api/v1/admins`

List admin staff users

## 02 Admin - Staff Management

### `POST` `/api/v1/admins`

Create admin staff user

## 02 Admin - Staff Management

### `GET` `/api/v1/admins/{id}`

Fetch Admins details

## 02 Admin - Staff Management

### `PATCH` `/api/v1/admins/{id}`

Update Admins

## 02 Admin - Staff Management

### `DELETE` `/api/v1/admins/{id}`

Permanently delete admin staff user

## 02 Admin - Staff Management

### `PATCH` `/api/v1/admins/{id}/active-status`

Update Admins Active Status

## 02 Admin - Staff Management

### `PATCH` `/api/v1/admins/{id}/password`

Update Admins Password

## 02 Admin - System Logs & Audit Trail

### `GET` `/api/v1/audit-logs`

List audit logs

## 02 Admin - System Logs & Audit Trail

### `GET` `/api/v1/audit-logs/{id}`

Fetch audit log detail

## 02 Admin - System Logs & Audit Trail

### `GET` `/api/v1/audit-logs/action-types`

Fetch audit log action types

## 02 Admin - System Logs & Audit Trail

### `GET` `/api/v1/audit-logs/export`

Export audit logs CSV

## 02 Admin - System Logs & Audit Trail

### `GET` `/api/v1/audit-logs/stats`

Fetch audit log stats

## 02 Admin - System Logs & Audit Trail

### `GET` `/api/v1/audit-logs/users`

Fetch audit log user selector options

## 01 Auth

### `DELETE` `/api/v1/auth/account`

Delete Auth Account

## 01 Auth

### `POST` `/api/v1/auth/cancel-deletion`

Create Auth Cancel Deletion

## 01 Auth

### `PATCH` `/api/v1/auth/change-password`

Update Auth Change Password

## 01 Auth

### `POST` `/api/v1/auth/forgot-password`

Create Auth Forgot Password

## 01 Auth

### `POST` `/api/v1/auth/guest/session`

Create Auth Guest Session

## 01 Auth

### `POST` `/api/v1/auth/login`

Create Auth Login

## 01 Auth

### `POST` `/api/v1/auth/logout`

Create Auth Logout

## 01 Auth

### `GET` `/api/v1/auth/me`

List Auth Me

## 01 Auth

### `PATCH` `/api/v1/auth/me`

Update Auth Me

## 01 Auth

### `POST` `/api/v1/auth/providers/register`

Create Auth Providers Register

## 01 Auth

### `POST` `/api/v1/auth/refresh`

Create Auth Refresh

## 01 Auth

### `POST` `/api/v1/auth/resend-otp`

Create Auth Resend Otp

## 01 Auth

### `POST` `/api/v1/auth/reset-password`

Create Auth Reset Password

## 01 Auth

### `GET` `/api/v1/auth/sessions`

List Auth Sessions

## 01 Auth

### `DELETE` `/api/v1/auth/sessions/{id}`

Delete Auth Sessions

## 01 Auth

### `POST` `/api/v1/auth/sessions/logout-all`

Create Auth Sessions Logout All

## 01 Auth

### `POST` `/api/v1/auth/users/register`

Create Auth Users Register

## 01 Auth

### `POST` `/api/v1/auth/verify-email`

Create Auth Verify Email

## 01 Auth

### `POST` `/api/v1/auth/verify-reset-otp`

Create Auth Verify Reset Otp

## 06 Broadcast Notifications

### `GET` `/api/v1/broadcasts`

List Broadcasts

## 06 Broadcast Notifications

### `POST` `/api/v1/broadcasts`

Create Broadcasts

## 06 Broadcast Notifications

### `GET` `/api/v1/broadcasts/{id}`

Fetch Broadcasts details

## 06 Broadcast Notifications

### `PATCH` `/api/v1/broadcasts/{id}`

Update Broadcasts

## 06 Broadcast Notifications

### `POST` `/api/v1/broadcasts/{id}/cancel`

Create Broadcasts Cancel

## 06 Broadcast Notifications

### `GET` `/api/v1/broadcasts/{id}/recipients`

Fetch Broadcasts Recipients details

## 06 Broadcast Notifications

### `GET` `/api/v1/broadcasts/{id}/report`

Fetch Broadcasts Report details

## 06 Broadcast Notifications

### `PATCH` `/api/v1/broadcasts/{id}/schedule`

Update Broadcasts Schedule

## 06 Broadcast Notifications

### `PATCH` `/api/v1/broadcasts/{id}/targeting`

Update Broadcasts Targeting

## 06 Broadcast Notifications

### `POST` `/api/v1/broadcasts/estimate-reach`

Create Broadcasts Estimate Reach

## 07 Plans & Coupons

### `GET` `/api/v1/coupons`

List Coupons

## 07 Plans & Coupons

### `POST` `/api/v1/coupons`

Create Coupons

## 07 Plans & Coupons

### `GET` `/api/v1/coupons/{id}`

Fetch Coupons details

## 07 Plans & Coupons

### `PATCH` `/api/v1/coupons/{id}`

Update Coupons

## 07 Plans & Coupons

### `DELETE` `/api/v1/coupons/{id}`

Delete Coupons

## 07 Plans & Coupons

### `PATCH` `/api/v1/coupons/{id}/status`

Update Coupons Status

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

Delete customer address

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

List Customer Provider Reports

## 05 Customer - Provider Reports

### `GET` `/api/v1/customer/provider-reports/{id}`

Fetch Customer Provider Reports details

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

Fetch Customer Reviews details

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

Update Gift Moderation Flag

## 04 Gifts - Moderation

### `PATCH` `/api/v1/gift-moderation/{id}/reject`

Update Gift Moderation Reject

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

List Login Attempts

## 01 Auth - Login Attempts

### `GET` `/api/v1/login-attempts/export`

List Login Attempts Export

## 01 Auth - Login Attempts

### `GET` `/api/v1/login-attempts/stats`

List Login Attempts Stats

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

List Permissions Catalog

## 07 Plans & Coupons

### `GET` `/api/v1/plan-features`

List Plan Features

## 07 Plans & Coupons

### `POST` `/api/v1/plan-features`

Create Plan Features

## 07 Plans & Coupons

### `GET` `/api/v1/plan-features/{id}`

Fetch Plan Features details

## 07 Plans & Coupons

### `PATCH` `/api/v1/plan-features/{id}`

Update Plan Features

## 07 Plans & Coupons

### `DELETE` `/api/v1/plan-features/{id}`

Delete Plan Features

## 07 Plans & Coupons

### `GET` `/api/v1/plan-features/catalog`

List Plan Features Catalog

## 02 Admin - Promotional Offers Management

### `GET` `/api/v1/promotional-offers`

List Promotional Offers

## 02 Admin - Promotional Offers Management

### `POST` `/api/v1/promotional-offers`

Create Promotional Offers

## 02 Admin - Promotional Offers Management

### `GET` `/api/v1/promotional-offers/{id}`

Fetch Promotional Offers details

## 02 Admin - Promotional Offers Management

### `PATCH` `/api/v1/promotional-offers/{id}`

Update Promotional Offers

## 02 Admin - Promotional Offers Management

### `DELETE` `/api/v1/promotional-offers/{id}`

Delete Promotional Offers

## 02 Admin - Promotional Offers Management

### `PATCH` `/api/v1/promotional-offers/{id}/approve`

Update Promotional Offers Approve

## 02 Admin - Promotional Offers Management

### `PATCH` `/api/v1/promotional-offers/{id}/reject`

Update Promotional Offers Reject

## 02 Admin - Promotional Offers Management

### `PATCH` `/api/v1/promotional-offers/{id}/status`

Update Promotional Offers Status

## 02 Admin - Promotional Offers Management

### `GET` `/api/v1/promotional-offers/export`

List Promotional Offers Export

## 02 Admin - Promotional Offers Management

### `GET` `/api/v1/promotional-offers/stats`

List Promotional Offers Stats

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

List Provider Offers

## 03 Provider - Promotional Offers

### `POST` `/api/v1/provider/offers`

Create Provider Offers

## 03 Provider - Promotional Offers

### `GET` `/api/v1/provider/offers/{id}`

Fetch Provider Offers details

## 03 Provider - Promotional Offers

### `PATCH` `/api/v1/provider/offers/{id}`

Update Provider Offers

## 03 Provider - Promotional Offers

### `DELETE` `/api/v1/provider/offers/{id}`

Delete Provider Offers

## 03 Provider - Promotional Offers

### `PATCH` `/api/v1/provider/offers/{id}/status`

Update Provider Offers Status

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

## 03 Provider - Order Analytics

### `GET` `/api/v1/provider/orders/analytics/ratings`

Fetch own provider ratings analytics

## 03 Provider - Order Analytics

### `GET` `/api/v1/provider/orders/analytics/revenue`

Fetch own provider revenue analytics

## 03 Provider - Order Analytics

### `GET` `/api/v1/provider/orders/export`

Export own provider orders as CSV

## 03 Provider - Orders

### `GET` `/api/v1/provider/orders/history`

List own provider order history

## 03 Provider - Order Analytics

### `GET` `/api/v1/provider/orders/performance`

Fetch own provider order performance

## 03 Provider - Order Analytics

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

Fetch Provider Reviews details

## 03 Provider - Reviews

### `POST` `/api/v1/provider/reviews/{id}/response`

Post public review response

## 03 Provider - Reviews

### `PATCH` `/api/v1/provider/reviews/{id}/response`

Update public review response

## 03 Provider - Reviews

### `DELETE` `/api/v1/provider/reviews/{id}/response`

Delete public review response

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

Fetch Providers details

## 02 Admin - Provider Management

### `PATCH` `/api/v1/providers/{id}`

Update Providers

## 02 Admin - Provider Management

### `DELETE` `/api/v1/providers/{id}`

Permanently delete provider

## 02 Admin - Provider Management

### `GET` `/api/v1/providers/{id}/activity`

Fetch Providers Activity details

## 02 Admin - Provider Management

### `GET` `/api/v1/providers/{id}/items`

Fetch Providers Items details

## 02 Admin - Provider Management

### `POST` `/api/v1/providers/{id}/message`

Create Providers Message

## 02 Admin - Provider Management

### `PATCH` `/api/v1/providers/{id}/status`

Update provider lifecycle status

## 02 Admin - Provider Management

### `GET` `/api/v1/providers/export`

List Providers Export

## 02 Admin - Provider Management

### `GET` `/api/v1/providers/lookup`

List Providers Lookup

## 02 Admin - Provider Management

### `GET` `/api/v1/providers/stats`

List Providers Stats

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

List Subscription Plans

## 07 Plans & Coupons

### `POST` `/api/v1/subscription-plans`

Create Subscription Plans

## 07 Plans & Coupons

### `GET` `/api/v1/subscription-plans/{id}`

Fetch Subscription Plans details

## 07 Plans & Coupons

### `PATCH` `/api/v1/subscription-plans/{id}`

Update Subscription Plans

## 07 Plans & Coupons

### `DELETE` `/api/v1/subscription-plans/{id}`

Delete Subscription Plans

## 07 Plans & Coupons

### `GET` `/api/v1/subscription-plans/{id}/analytics`

Fetch Subscription Plans Analytics details

## 07 Plans & Coupons

### `PATCH` `/api/v1/subscription-plans/{id}/status`

Update Subscription Plans Status

## 07 Plans & Coupons

### `PATCH` `/api/v1/subscription-plans/{id}/visibility`

Update Subscription Plans Visibility

## 07 Plans & Coupons

### `GET` `/api/v1/subscription-plans/stats`

List Subscription Plans Stats

## 07 Storage

### `GET` `/api/v1/uploads`

List uploads

## 07 Storage

### `GET` `/api/v1/uploads/{id}`

Fetch upload details

## 07 Storage

### `DELETE` `/api/v1/uploads/{id}`

Delete upload

## 07 Storage

### `POST` `/api/v1/uploads/complete`

Complete upload

## 07 Storage

### `POST` `/api/v1/uploads/presigned-url`

Create presigned upload URL

## 02 Admin - User Management

### `GET` `/api/v1/users`

List registered users

## 02 Admin - User Management

### `GET` `/api/v1/users/{id}`

Fetch Users details

## 02 Admin - User Management

### `PATCH` `/api/v1/users/{id}`

Update Users

## 02 Admin - User Management

### `DELETE` `/api/v1/users/{id}`

Permanently delete registered user

## 02 Admin - User Management

### `GET` `/api/v1/users/{id}/activity`

Fetch Users Activity details

## 02 Admin - User Management

### `POST` `/api/v1/users/{id}/reset-password`

Change registered user password

## 02 Admin - User Management

### `GET` `/api/v1/users/{id}/stats`

Fetch Users Stats details

## 02 Admin - User Management

### `PATCH` `/api/v1/users/{id}/status`

Update Users Status

## 02 Admin - User Management

### `POST` `/api/v1/users/{id}/suspend`

Create Users Suspend

## 02 Admin - User Management

### `POST` `/api/v1/users/{id}/unsuspend`

Create Users Unsuspend

## 02 Admin - User Management

### `GET` `/api/v1/users/export`

List Users Export
