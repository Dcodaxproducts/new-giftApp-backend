# Gift App Backend — API Summary


## 01 Auth

- `POST` `/api/v1/auth/users/register` — **PUBLIC** — POST /api/v1/auth/users/register
- `POST` `/api/v1/auth/providers/register` — **PUBLIC** — POST /api/v1/auth/providers/register
- `POST` `/api/v1/auth/guest/session` — **PUBLIC** — POST /api/v1/auth/guest/session
- `POST` `/api/v1/auth/login` — **PUBLIC** — POST /api/v1/auth/login
- `POST` `/api/v1/auth/refresh` — **PUBLIC** — POST /api/v1/auth/refresh
- `POST` `/api/v1/auth/logout` — **Authenticated** — POST /api/v1/auth/logout
- `POST` `/api/v1/auth/verify-email` — **Authenticated** — POST /api/v1/auth/verify-email
- `POST` `/api/v1/auth/resend-otp` — **Authenticated** — POST /api/v1/auth/resend-otp
- `POST` `/api/v1/auth/forgot-password` — **PUBLIC** — POST /api/v1/auth/forgot-password
- `POST` `/api/v1/auth/verify-reset-otp` — **PUBLIC** — POST /api/v1/auth/verify-reset-otp
- `POST` `/api/v1/auth/reset-password` — **PUBLIC** — POST /api/v1/auth/reset-password
- `PATCH` `/api/v1/auth/change-password` — **Authenticated** — PATCH /api/v1/auth/change-password
- `GET` `/api/v1/auth/me` — **Authenticated** — GET /api/v1/auth/me
- `DELETE` `/api/v1/auth/account` — **Authenticated** — DELETE /api/v1/auth/account
- `POST` `/api/v1/auth/cancel-deletion` — **Authenticated** — POST /api/v1/auth/cancel-deletion

## 01 Auth - Login Attempts

- `GET` `/api/v1/login-attempts/stats` — **SUPER_ADMIN or ADMIN with loginAttempts.read** — GET /api/v1/login-attempts/stats
- `GET` `/api/v1/login-attempts/export` — **SUPER_ADMIN or ADMIN with loginAttempts.export** — GET /api/v1/login-attempts/export
- `GET` `/api/v1/login-attempts` — **SUPER_ADMIN or ADMIN with loginAttempts.read** — GET /api/v1/login-attempts

## 02 Admin - Staff Management

- `POST` `/api/v1/admins` — **SUPER_ADMIN** — Create admin staff user
- `GET` `/api/v1/admins` — **SUPER_ADMIN** — List admin staff users
- `GET` `/api/v1/admins/{id}` — **SUPER_ADMIN** — GET /api/v1/admins/{id}
- `PATCH` `/api/v1/admins/{id}` — **SUPER_ADMIN** — PATCH /api/v1/admins/{id}
- `DELETE` `/api/v1/admins/{id}` — **SUPER_ADMIN** — Permanently delete admin staff user
- `PATCH` `/api/v1/admins/{id}/active-status` — **SUPER_ADMIN** — PATCH /api/v1/admins/{id}/active-status
- `PATCH` `/api/v1/admins/{id}/password` — **SUPER_ADMIN** — PATCH /api/v1/admins/{id}/password

## 02 Admin - Roles & Permissions

- `GET` `/api/v1/admin-roles` — **SUPER_ADMIN** — GET /api/v1/admin-roles
- `POST` `/api/v1/admin-roles` — **SUPER_ADMIN** — POST /api/v1/admin-roles
- `GET` `/api/v1/admin-roles/{id}` — **SUPER_ADMIN** — GET /api/v1/admin-roles/{id}
- `PATCH` `/api/v1/admin-roles/{id}` — **SUPER_ADMIN** — PATCH /api/v1/admin-roles/{id}
- `DELETE` `/api/v1/admin-roles/{id}` — **SUPER_ADMIN** — DELETE /api/v1/admin-roles/{id}
- `PATCH` `/api/v1/admin-roles/{id}/permissions` — **SUPER_ADMIN** — PATCH /api/v1/admin-roles/{id}/permissions
- `GET` `/api/v1/permissions/catalog` — **SUPER_ADMIN** — GET /api/v1/permissions/catalog

## 02 Admin - User Management

- `GET` `/api/v1/users/export` — **SUPER_ADMIN or ADMIN with users.export** — GET /api/v1/users/export
- `GET` `/api/v1/users` — **SUPER_ADMIN or ADMIN with users.read** — List registered users
- `GET` `/api/v1/users/{id}` — **SUPER_ADMIN or ADMIN with users.read** — GET /api/v1/users/{id}
- `PATCH` `/api/v1/users/{id}` — **SUPER_ADMIN or ADMIN with users.update** — PATCH /api/v1/users/{id}
- `DELETE` `/api/v1/users/{id}` — **SUPER_ADMIN** — Permanently delete registered user
- `PATCH` `/api/v1/users/{id}/status` — **SUPER_ADMIN or ADMIN with users.status.update** — PATCH /api/v1/users/{id}/status
- `POST` `/api/v1/users/{id}/suspend` — **SUPER_ADMIN or ADMIN with users.suspend** — POST /api/v1/users/{id}/suspend
- `POST` `/api/v1/users/{id}/unsuspend` — **SUPER_ADMIN or ADMIN with users.unsuspend** — POST /api/v1/users/{id}/unsuspend
- `POST` `/api/v1/users/{id}/reset-password` — **SUPER_ADMIN or ADMIN with users.resetPassword** — Change registered user password
- `GET` `/api/v1/users/{id}/activity` — **SUPER_ADMIN or ADMIN with users.read** — GET /api/v1/users/{id}/activity
- `GET` `/api/v1/users/{id}/stats` — **SUPER_ADMIN or ADMIN with users.read** — GET /api/v1/users/{id}/stats

## 02 Admin - Provider Management

- `GET` `/api/v1/providers/export` — **SUPER_ADMIN or ADMIN with providers.export** — GET /api/v1/providers/export
- `GET` `/api/v1/providers/stats` — **SUPER_ADMIN or ADMIN with providers.read** — GET /api/v1/providers/stats
- `GET` `/api/v1/providers` — **SUPER_ADMIN or ADMIN with providers.read** — List providers
- `POST` `/api/v1/providers` — **SUPER_ADMIN or ADMIN with providers.create** — Create provider from admin dashboard
- `GET` `/api/v1/providers/lookup` — **SUPER_ADMIN or ADMIN with providers.read** — GET /api/v1/providers/lookup
- `GET` `/api/v1/providers/{id}` — **SUPER_ADMIN or ADMIN with providers.read** — GET /api/v1/providers/{id}
- `PATCH` `/api/v1/providers/{id}` — **SUPER_ADMIN or ADMIN with providers.update** — PATCH /api/v1/providers/{id}
- `DELETE` `/api/v1/providers/{id}` — **SUPER_ADMIN** — Permanently delete provider
- `PATCH` `/api/v1/providers/{id}/status` — **SUPER_ADMIN or ADMIN with provider lifecycle permission (APPROVE=>providers.approve, REJECT=>providers.reject, SUSPEND=>providers.suspend, UNSUSPEND=>providers.suspend, UPDATE_STATUS=>providers.updateStatus)** — Update provider lifecycle status
- `GET` `/api/v1/providers/{id}/items` — **SUPER_ADMIN or ADMIN with providers.read** — GET /api/v1/providers/{id}/items
- `GET` `/api/v1/providers/{id}/activity` — **SUPER_ADMIN or ADMIN with providers.read** — GET /api/v1/providers/{id}/activity
- `POST` `/api/v1/providers/{id}/message` — **SUPER_ADMIN or ADMIN with providers.message** — POST /api/v1/providers/{id}/message

## 02 Admin - Provider Business Categories

- `GET` `/api/v1/provider-business-categories` — **PUBLIC** — List provider business categories
- `POST` `/api/v1/provider-business-categories` — **SUPER_ADMIN or ADMIN with providerBusinessCategories.create** — Create provider business category
- `GET` `/api/v1/provider-business-categories/{id}` — **SUPER_ADMIN or ADMIN with providerBusinessCategories.read** — Fetch provider business category details
- `PATCH` `/api/v1/provider-business-categories/{id}` — **SUPER_ADMIN or ADMIN with providerBusinessCategories.update** — Update provider business category
- `DELETE` `/api/v1/provider-business-categories/{id}` — **SUPER_ADMIN or ADMIN with providerBusinessCategories.delete** — Soft-delete provider business category

## 02 Admin - Referral Settings

- `GET` `/api/v1/referral-settings` — **SUPER_ADMIN or ADMIN with referralSettings.read** — Fetch referral settings
- `PATCH` `/api/v1/referral-settings` — **SUPER_ADMIN** — Update referral settings
- `POST` `/api/v1/referral-settings/activate` — **SUPER_ADMIN** — Activate referral program
- `POST` `/api/v1/referral-settings/deactivate` — **SUPER_ADMIN** — Deactivate referral program
- `GET` `/api/v1/referral-settings/stats` — **SUPER_ADMIN or ADMIN with referralSettings.read** — Fetch referral stats
- `GET` `/api/v1/referral-settings/audit-logs` — **SUPER_ADMIN** — List referral settings audit logs

## 02 Admin - Media Upload Policy

- `GET` `/api/v1/media-upload-policy` — **SUPER_ADMIN or ADMIN with mediaPolicy.read** — Fetch global media upload policy
- `PATCH` `/api/v1/media-upload-policy` — **SUPER_ADMIN** — Update global media upload policy
- `GET` `/api/v1/media-upload-policy/audit-logs` — **SUPER_ADMIN** — List media upload policy audit logs

## 02 Admin - Audit Logs

- `GET` `/api/v1/audit-logs/export` — **SUPER_ADMIN** — GET /api/v1/audit-logs/export
- `GET` `/api/v1/audit-logs` — **SUPER_ADMIN** — GET /api/v1/audit-logs
- `GET` `/api/v1/audit-logs/{id}` — **SUPER_ADMIN** — GET /api/v1/audit-logs/{id}

## 03 Provider - Inventory

- `GET` `/api/v1/provider/inventory` — **PROVIDER** — List provider inventory items
- `POST` `/api/v1/provider/inventory` — **PROVIDER** — Create provider inventory item with optional nested variants
- `GET` `/api/v1/provider/inventory/stats` — **PROVIDER** — Fetch provider inventory stats
- `GET` `/api/v1/provider/inventory/lookup` — **PROVIDER** — Lookup active approved provider inventory items
- `GET` `/api/v1/provider/inventory/{id}` — **PROVIDER** — Fetch own provider inventory item details
- `PATCH` `/api/v1/provider/inventory/{id}` — **PROVIDER** — Update own provider inventory item and upsert variants
- `DELETE` `/api/v1/provider/inventory/{id}` — **PROVIDER** — Soft-delete own inventory item
- `PATCH` `/api/v1/provider/inventory/{id}/availability` — **PROVIDER** — Update own inventory availability

## 03 Provider - Promotional Offers

- `GET` `/api/v1/provider/offers` — **PROVIDER** — GET /api/v1/provider/offers
- `POST` `/api/v1/provider/offers` — **PROVIDER** — POST /api/v1/provider/offers
- `GET` `/api/v1/provider/offers/{id}` — **PROVIDER** — GET /api/v1/provider/offers/{id}
- `PATCH` `/api/v1/provider/offers/{id}` — **PROVIDER** — PATCH /api/v1/provider/offers/{id}
- `DELETE` `/api/v1/provider/offers/{id}` — **PROVIDER** — DELETE /api/v1/provider/offers/{id}
- `PATCH` `/api/v1/provider/offers/{id}/status` — **PROVIDER** — PATCH /api/v1/provider/offers/{id}/status
- `GET` `/api/v1/promotional-offers/stats` — **SUPER_ADMIN or ADMIN with promotionalOffers.read** — GET /api/v1/promotional-offers/stats
- `GET` `/api/v1/promotional-offers/export` — **SUPER_ADMIN or ADMIN with promotionalOffers.export** — GET /api/v1/promotional-offers/export
- `GET` `/api/v1/promotional-offers` — **SUPER_ADMIN or ADMIN with promotionalOffers.read** — GET /api/v1/promotional-offers
- `POST` `/api/v1/promotional-offers` — **SUPER_ADMIN or ADMIN with promotionalOffers.create** — POST /api/v1/promotional-offers
- `GET` `/api/v1/promotional-offers/{id}` — **SUPER_ADMIN or ADMIN with promotionalOffers.read** — GET /api/v1/promotional-offers/{id}
- `PATCH` `/api/v1/promotional-offers/{id}` — **SUPER_ADMIN or ADMIN with promotionalOffers.update** — PATCH /api/v1/promotional-offers/{id}
- `DELETE` `/api/v1/promotional-offers/{id}` — **SUPER_ADMIN or ADMIN with promotionalOffers.delete** — DELETE /api/v1/promotional-offers/{id}
- `PATCH` `/api/v1/promotional-offers/{id}/approve` — **SUPER_ADMIN or ADMIN with promotionalOffers.approve** — PATCH /api/v1/promotional-offers/{id}/approve
- `PATCH` `/api/v1/promotional-offers/{id}/reject` — **SUPER_ADMIN or ADMIN with promotionalOffers.reject** — PATCH /api/v1/promotional-offers/{id}/reject
- `PATCH` `/api/v1/promotional-offers/{id}/status` — **SUPER_ADMIN or ADMIN with promotionalOffers.status.update** — PATCH /api/v1/promotional-offers/{id}/status

## 03 Provider - Orders

- `GET` `/api/v1/provider/orders` — **PROVIDER** — List own assigned provider orders
- `GET` `/api/v1/provider/orders/history` — **PROVIDER** — List own provider order history
- `GET` `/api/v1/provider/orders/performance` — **PROVIDER** — Fetch own provider order performance
- `GET` `/api/v1/provider/orders/analytics/revenue` — **PROVIDER** — Fetch own provider revenue analytics
- `GET` `/api/v1/provider/orders/analytics/ratings` — **PROVIDER** — Fetch own provider ratings analytics
- `GET` `/api/v1/provider/orders/recent` — **PROVIDER** — List recent own provider orders
- `GET` `/api/v1/provider/orders/export` — **PROVIDER** — Export own provider orders as CSV
- `GET` `/api/v1/provider/orders/summary` — **PROVIDER** — Fetch own provider order summary
- `GET` `/api/v1/provider/orders/reject-reasons` — **PROVIDER** — List provider order reject reasons
- `PATCH` `/api/v1/provider/orders/{id}/status` — **PROVIDER** — Update own provider order fulfillment status
- `GET` `/api/v1/provider/orders/{id}/timeline` — **PROVIDER** — Fetch own provider order timeline
- `GET` `/api/v1/provider/orders/{id}/checklist` — **PROVIDER** — Fetch own provider order checklist
- `PATCH` `/api/v1/provider/orders/{id}/checklist` — **PROVIDER** — Update own provider order checklist
- `POST` `/api/v1/provider/orders/{id}/message-buyer` — **PROVIDER** — Message buyer for own provider order
- `GET` `/api/v1/provider/orders/{id}` — **PROVIDER** — Fetch own provider order details
- `POST` `/api/v1/provider/orders/{id}/accept` — **PROVIDER** — Accept own pending provider order
- `POST` `/api/v1/provider/orders/{id}/reject` — **PROVIDER** — Reject own pending provider order

## 04 Gifts - Categories

- `GET` `/api/v1/gift-categories/lookup` — **PUBLIC** — Lookup active gift categories
- `POST` `/api/v1/gift-categories` — **SUPER_ADMIN or ADMIN with giftCategories.create** — Create gift category
- `GET` `/api/v1/gift-categories` — **SUPER_ADMIN or ADMIN with giftCategories.read** — List gift categories
- `GET` `/api/v1/gift-categories/stats` — **SUPER_ADMIN or ADMIN with giftCategories.read** — Fetch gift category stats
- `GET` `/api/v1/gift-categories/{id}` — **SUPER_ADMIN or ADMIN with giftCategories.read** — Fetch gift category details
- `PATCH` `/api/v1/gift-categories/{id}` — **SUPER_ADMIN or ADMIN with giftCategories.update** — Update gift category
- `DELETE` `/api/v1/gift-categories/{id}` — **SUPER_ADMIN or ADMIN with giftCategories.delete** — Soft-delete gift category

## 04 Gifts - Management

- `POST` `/api/v1/gifts` — **SUPER_ADMIN or ADMIN with gifts.create** — Create admin gift with optional nested variants
- `GET` `/api/v1/gifts` — **SUPER_ADMIN or ADMIN with gifts.read** — List admin gifts
- `GET` `/api/v1/gifts/stats` — **SUPER_ADMIN or ADMIN with gifts.read** — Fetch gift inventory stats
- `GET` `/api/v1/gifts/export` — **SUPER_ADMIN or ADMIN with gifts.export** — Export gift inventory
- `GET` `/api/v1/gifts/{id}` — **SUPER_ADMIN or ADMIN with gifts.read** — Fetch admin gift details with variants
- `PATCH` `/api/v1/gifts/{id}` — **SUPER_ADMIN or ADMIN with gifts.update** — Update admin gift and upsert nested variants
- `DELETE` `/api/v1/gifts/{id}` — **SUPER_ADMIN or ADMIN with gifts.delete** — Soft-delete gift
- `PATCH` `/api/v1/gifts/{id}/status` — **SUPER_ADMIN or ADMIN with gifts.status.update** — Update gift status

## 04 Gifts - Moderation

- `GET` `/api/v1/gift-moderation` — **SUPER_ADMIN or ADMIN with giftModeration.read** — GET /api/v1/gift-moderation
- `PATCH` `/api/v1/gift-moderation/{id}/approve` — **SUPER_ADMIN or ADMIN with giftModeration.approve** — PATCH /api/v1/gift-moderation/{id}/approve
- `PATCH` `/api/v1/gift-moderation/{id}/reject` — **SUPER_ADMIN or ADMIN with giftModeration.reject** — PATCH /api/v1/gift-moderation/{id}/reject
- `PATCH` `/api/v1/gift-moderation/{id}/flag` — **SUPER_ADMIN or ADMIN with giftModeration.flag** — PATCH /api/v1/gift-moderation/{id}/flag

## 05 Customer - Marketplace

- `GET` `/api/v1/customer/home` — **REGISTERED_USER** — Fetch customer app home
- `GET` `/api/v1/customer/categories` — **REGISTERED_USER** — List customer marketplace categories
- `GET` `/api/v1/customer/gifts/discounted` — **REGISTERED_USER** — List discounted customer gifts
- `GET` `/api/v1/customer/gifts/filter-options` — **REGISTERED_USER** — Fetch marketplace gift filter options
- `GET` `/api/v1/customer/gifts` — **REGISTERED_USER** — List customer marketplace gifts
- `GET` `/api/v1/customer/gifts/{id}` — **REGISTERED_USER** — Fetch customer-safe gift details

## 05 Customer - Wishlist

- `GET` `/api/v1/customer/wishlist` — **REGISTERED_USER** — List wishlist gifts
- `POST` `/api/v1/customer/wishlist/{giftId}` — **REGISTERED_USER** — Add gift to wishlist
- `DELETE` `/api/v1/customer/wishlist/{giftId}` — **REGISTERED_USER** — Remove gift from wishlist

## 05 Customer - Addresses

- `GET` `/api/v1/customer/addresses` — **REGISTERED_USER** — List customer addresses
- `POST` `/api/v1/customer/addresses` — **REGISTERED_USER** — Create customer address
- `GET` `/api/v1/customer/addresses/{id}` — **REGISTERED_USER** — Fetch customer address
- `PATCH` `/api/v1/customer/addresses/{id}` — **REGISTERED_USER** — Update customer address
- `DELETE` `/api/v1/customer/addresses/{id}` — **REGISTERED_USER** — Soft-delete customer address
- `PATCH` `/api/v1/customer/addresses/{id}/default` — **REGISTERED_USER** — Set default customer address

## 05 Customer - Contacts

- `GET` `/api/v1/customer/contacts` — **REGISTERED_USER** — List customer contacts
- `POST` `/api/v1/customer/contacts` — **REGISTERED_USER** — Create customer contact
- `GET` `/api/v1/customer/contacts/{id}` — **REGISTERED_USER** — Fetch customer contact
- `PATCH` `/api/v1/customer/contacts/{id}` — **REGISTERED_USER** — Update customer contact
- `DELETE` `/api/v1/customer/contacts/{id}` — **REGISTERED_USER** — Soft-delete customer contact

## 05 Customer - Events

- `GET` `/api/v1/customer/events` — **REGISTERED_USER** — List customer events
- `POST` `/api/v1/customer/events` — **REGISTERED_USER** — Create customer event
- `GET` `/api/v1/customer/events/calendar` — **REGISTERED_USER** — Fetch monthly calendar events
- `GET` `/api/v1/customer/events/upcoming` — **REGISTERED_USER** — Fetch upcoming customer events
- `GET` `/api/v1/customer/events/{id}/reminder-settings` — **REGISTERED_USER** — Fetch event reminder settings
- `PATCH` `/api/v1/customer/events/{id}/reminder-settings` — **REGISTERED_USER** — Update event reminder settings
- `GET` `/api/v1/customer/events/{id}` — **REGISTERED_USER** — Fetch customer event details
- `PATCH` `/api/v1/customer/events/{id}` — **REGISTERED_USER** — Update customer event
- `DELETE` `/api/v1/customer/events/{id}` — **REGISTERED_USER** — Soft-delete customer event

## 05 Customer - Cart

- `GET` `/api/v1/customer/cart` — **REGISTERED_USER** — Fetch active cart
- `DELETE` `/api/v1/customer/cart` — **REGISTERED_USER** — Clear active cart
- `POST` `/api/v1/customer/cart/items` — **REGISTERED_USER** — Add item to cart
- `PATCH` `/api/v1/customer/cart/items/{id}` — **REGISTERED_USER** — Update cart item
- `DELETE` `/api/v1/customer/cart/items/{id}` — **REGISTERED_USER** — Delete cart item

## 05 Customer - Orders

- `POST` `/api/v1/customer/orders` — **REGISTERED_USER** — Create order from active cart
- `GET` `/api/v1/customer/orders` — **REGISTERED_USER** — List customer orders
- `GET` `/api/v1/customer/orders/{id}` — **REGISTERED_USER** — Fetch customer order

## 05 Customer - Recurring Payments

- `GET` `/api/v1/customer/recurring-payments` — **REGISTERED_USER** — List own recurring payments
- `POST` `/api/v1/customer/recurring-payments` — **REGISTERED_USER** — Create recurring payment
- `GET` `/api/v1/customer/recurring-payments/summary` — **REGISTERED_USER** — Fetch recurring payment summary counts
- `GET` `/api/v1/customer/recurring-payments/{id}` — **REGISTERED_USER** — Fetch own recurring payment details
- `PATCH` `/api/v1/customer/recurring-payments/{id}` — **REGISTERED_USER** — Update own recurring payment
- `POST` `/api/v1/customer/recurring-payments/{id}/pause` — **REGISTERED_USER** — Pause own active recurring payment
- `POST` `/api/v1/customer/recurring-payments/{id}/resume` — **REGISTERED_USER** — Resume own paused recurring payment
- `POST` `/api/v1/customer/recurring-payments/{id}/cancel` — **REGISTERED_USER** — Cancel own recurring payment
- `GET` `/api/v1/customer/recurring-payments/{id}/history` — **REGISTERED_USER** — List own recurring payment billing history

## 05 Customer - Transactions

- `GET` `/api/v1/customer/transactions` — **REGISTERED_USER** — List own customer transactions
- `GET` `/api/v1/customer/transactions/summary` — **REGISTERED_USER** — Fetch own transaction summary
- `GET` `/api/v1/customer/transactions/export` — **REGISTERED_USER** — Export own transactions
- `GET` `/api/v1/customer/transactions/{id}` — **REGISTERED_USER** — Fetch own transaction details
- `GET` `/api/v1/customer/transactions/{id}/receipt` — **REGISTERED_USER** — Download own transaction receipt

## 05 Customer - Referrals & Rewards

- `GET` `/api/v1/customer/referrals/summary` — **REGISTERED_USER** — Fetch own referral reward summary
- `GET` `/api/v1/customer/referrals/link` — **REGISTERED_USER** — Fetch own referral link
- `GET` `/api/v1/customer/referrals/history` — **REGISTERED_USER** — List own referral history
- `POST` `/api/v1/customer/referrals/redeem` — **REGISTERED_USER** — Redeem own available reward credit
- `GET` `/api/v1/customer/rewards/balance` — **REGISTERED_USER** — Fetch own reward balance
- `GET` `/api/v1/customer/rewards/ledger` — **REGISTERED_USER** — List own reward ledger
- `GET` `/api/v1/customer/referrals/terms` — **REGISTERED_USER** — Fetch referral terms

## 05 Customer - Wallet

- `GET` `/api/v1/customer/wallet` — **REGISTERED_USER** — Fetch own wallet
- `POST` `/api/v1/customer/wallet/add-funds` — **REGISTERED_USER** — Create wallet top-up payment
- `GET` `/api/v1/customer/wallet/history` — **REGISTERED_USER** — List own wallet history

## 05 Customer - Payment Methods

- `POST` `/api/v1/customer/bank-accounts` — **REGISTERED_USER** — Link placeholder bank account
- `GET` `/api/v1/customer/bank-accounts` — **REGISTERED_USER** — List own bank accounts
- `PATCH` `/api/v1/customer/bank-accounts/{id}/default` — **REGISTERED_USER** — Set own default bank account
- `DELETE` `/api/v1/customer/bank-accounts/{id}` — **REGISTERED_USER** — Delete own bank account
- `POST` `/api/v1/customer/payment-methods/setup-intent` — **REGISTERED_USER** — Create Stripe SetupIntent for saving card
- `GET` `/api/v1/customer/payment-methods/saved` — **REGISTERED_USER** — List own saved payment methods
- `DELETE` `/api/v1/customer/payment-methods/{id}` — **REGISTERED_USER** — Delete own saved payment method
- `GET` `/api/v1/customer/payment-methods` — **REGISTERED_USER** — List supported customer payment methods
- `PATCH` `/api/v1/customer/payment-methods/{id}/default` — **REGISTERED_USER** — Set own default payment method

## 06 Payments

- `POST` `/api/v1/customer/payments/create-intent` — **REGISTERED_USER** — Create payment intent from active cart
- `POST` `/api/v1/customer/payments/confirm` — **REGISTERED_USER** — Confirm Stripe payment
- `GET` `/api/v1/customer/payments/{id}` — **REGISTERED_USER** — Fetch own payment details
- `POST` `/api/v1/payments/stripe/webhook` — **PUBLIC** — Stripe webhook endpoint
- `POST` `/api/v1/customer/money-gifts` — **REGISTERED_USER** — Send payment as gift
- `GET` `/api/v1/customer/money-gifts` — **REGISTERED_USER** — List own money gifts
- `GET` `/api/v1/customer/money-gifts/{id}` — **REGISTERED_USER** — Fetch own money gift details

## 06 Notifications

- `GET` `/api/v1/notifications` — **SUPER_ADMIN, ADMIN, PROVIDER, or REGISTERED_USER** — List notifications
- `GET` `/api/v1/notifications/summary` — **SUPER_ADMIN, ADMIN, PROVIDER, or REGISTERED_USER** — Fetch notification summary
- `GET` `/api/v1/notifications/preferences` — **SUPER_ADMIN, ADMIN, PROVIDER, or REGISTERED_USER** — Fetch notification preferences
- `PATCH` `/api/v1/notifications/preferences` — **SUPER_ADMIN, ADMIN, PROVIDER, or REGISTERED_USER** — Update notification preferences
- `PATCH` `/api/v1/notifications/read-all` — **SUPER_ADMIN, ADMIN, PROVIDER, or REGISTERED_USER** — Mark all own notifications as read
- `PATCH` `/api/v1/notifications/{id}/read` — **SUPER_ADMIN, ADMIN, PROVIDER, or REGISTERED_USER** — Mark notification as read
- `POST` `/api/v1/notifications/{id}/action` — **SUPER_ADMIN, ADMIN, PROVIDER, or REGISTERED_USER** — Process notification action
- `POST` `/api/v1/notifications/device-tokens` — **SUPER_ADMIN, ADMIN, PROVIDER, or REGISTERED_USER** — Save device token
- `DELETE` `/api/v1/notifications/device-tokens/{id}` — **SUPER_ADMIN, ADMIN, PROVIDER, or REGISTERED_USER** — Disable device token

## 06 Broadcast Notifications

- `POST` `/api/v1/broadcasts` — **SUPER_ADMIN or ADMIN with broadcasts.create** — POST /api/v1/broadcasts
- `GET` `/api/v1/broadcasts` — **SUPER_ADMIN or ADMIN with broadcasts.read** — GET /api/v1/broadcasts
- `GET` `/api/v1/broadcasts/{id}` — **SUPER_ADMIN or ADMIN with broadcasts.read** — GET /api/v1/broadcasts/{id}
- `PATCH` `/api/v1/broadcasts/{id}` — **SUPER_ADMIN or ADMIN with broadcasts.update** — PATCH /api/v1/broadcasts/{id}
- `PATCH` `/api/v1/broadcasts/{id}/targeting` — **SUPER_ADMIN or ADMIN with broadcasts.update** — PATCH /api/v1/broadcasts/{id}/targeting
- `POST` `/api/v1/broadcasts/estimate-reach` — **SUPER_ADMIN or ADMIN with broadcasts.read** — POST /api/v1/broadcasts/estimate-reach
- `PATCH` `/api/v1/broadcasts/{id}/schedule` — **SUPER_ADMIN or ADMIN with broadcasts.schedule** — PATCH /api/v1/broadcasts/{id}/schedule
- `POST` `/api/v1/broadcasts/{id}/cancel` — **SUPER_ADMIN or ADMIN with broadcasts.cancel** — POST /api/v1/broadcasts/{id}/cancel
- `GET` `/api/v1/broadcasts/{id}/report` — **SUPER_ADMIN or ADMIN with broadcasts.report.read** — GET /api/v1/broadcasts/{id}/report
- `GET` `/api/v1/broadcasts/{id}/recipients` — **SUPER_ADMIN or ADMIN with broadcasts.report.read** — GET /api/v1/broadcasts/{id}/recipients

## 07 Plans & Coupons

- `GET` `/api/v1/subscription-plans` — **SUPER_ADMIN or ADMIN with subscriptionPlans.read** — GET /api/v1/subscription-plans
- `POST` `/api/v1/subscription-plans` — **SUPER_ADMIN or ADMIN with subscriptionPlans.create** — POST /api/v1/subscription-plans
- `GET` `/api/v1/subscription-plans/stats` — **SUPER_ADMIN or ADMIN with subscriptionPlans.analytics.read** — GET /api/v1/subscription-plans/stats
- `GET` `/api/v1/subscription-plans/{id}` — **SUPER_ADMIN or ADMIN with subscriptionPlans.read** — GET /api/v1/subscription-plans/{id}
- `PATCH` `/api/v1/subscription-plans/{id}` — **SUPER_ADMIN or ADMIN with subscriptionPlans.update** — PATCH /api/v1/subscription-plans/{id}
- `DELETE` `/api/v1/subscription-plans/{id}` — **SUPER_ADMIN or ADMIN with subscriptionPlans.delete** — DELETE /api/v1/subscription-plans/{id}
- `PATCH` `/api/v1/subscription-plans/{id}/status` — **SUPER_ADMIN or ADMIN with subscriptionPlans.status.update** — PATCH /api/v1/subscription-plans/{id}/status
- `PATCH` `/api/v1/subscription-plans/{id}/visibility` — **SUPER_ADMIN or ADMIN with subscriptionPlans.visibility.update** — PATCH /api/v1/subscription-plans/{id}/visibility
- `GET` `/api/v1/subscription-plans/{id}/analytics` — **SUPER_ADMIN or ADMIN with subscriptionPlans.analytics.read** — GET /api/v1/subscription-plans/{id}/analytics
- `GET` `/api/v1/plan-features/catalog` — **SUPER_ADMIN or ADMIN with planFeatures.read** — GET /api/v1/plan-features/catalog
- `GET` `/api/v1/plan-features` — **SUPER_ADMIN or ADMIN with planFeatures.read** — GET /api/v1/plan-features
- `POST` `/api/v1/plan-features` — **SUPER_ADMIN or ADMIN with planFeatures.create** — POST /api/v1/plan-features
- `GET` `/api/v1/plan-features/{id}` — **SUPER_ADMIN or ADMIN with planFeatures.read** — GET /api/v1/plan-features/{id}
- `PATCH` `/api/v1/plan-features/{id}` — **SUPER_ADMIN or ADMIN with planFeatures.update** — PATCH /api/v1/plan-features/{id}
- `DELETE` `/api/v1/plan-features/{id}` — **SUPER_ADMIN or ADMIN with planFeatures.delete** — DELETE /api/v1/plan-features/{id}
- `GET` `/api/v1/coupons` — **SUPER_ADMIN or ADMIN with coupons.read** — GET /api/v1/coupons
- `POST` `/api/v1/coupons` — **SUPER_ADMIN or ADMIN with coupons.create** — POST /api/v1/coupons
- `GET` `/api/v1/coupons/{id}` — **SUPER_ADMIN or ADMIN with coupons.read** — GET /api/v1/coupons/{id}
- `PATCH` `/api/v1/coupons/{id}` — **SUPER_ADMIN or ADMIN with coupons.update** — PATCH /api/v1/coupons/{id}
- `DELETE` `/api/v1/coupons/{id}` — **SUPER_ADMIN or ADMIN with coupons.delete** — DELETE /api/v1/coupons/{id}
- `PATCH` `/api/v1/coupons/{id}/status` — **SUPER_ADMIN or ADMIN with coupons.status.update** — PATCH /api/v1/coupons/{id}/status

## 07 Storage

- `POST` `/api/v1/uploads/presigned-url` — **SUPER_ADMIN, ADMIN, PROVIDER, or REGISTERED_USER** — POST /api/v1/uploads/presigned-url
- `POST` `/api/v1/uploads/complete` — **SUPER_ADMIN, ADMIN, PROVIDER, or REGISTERED_USER** — POST /api/v1/uploads/complete
- `GET` `/api/v1/uploads` — **SUPER_ADMIN, ADMIN, PROVIDER, or REGISTERED_USER** — GET /api/v1/uploads
- `GET` `/api/v1/uploads/{id}` — **SUPER_ADMIN, ADMIN, PROVIDER, or REGISTERED_USER** — GET /api/v1/uploads/{id}
- `DELETE` `/api/v1/uploads/{id}` — **SUPER_ADMIN, ADMIN, PROVIDER, or REGISTERED_USER** — DELETE /api/v1/uploads/{id}
