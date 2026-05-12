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
- `PATCH` `/api/v1/auth/me` — **Authenticated** — PATCH /api/v1/auth/me
- `GET` `/api/v1/auth/sessions` — **Authenticated** — GET /api/v1/auth/sessions
- `POST` `/api/v1/auth/sessions/logout-all` — **Authenticated** — POST /api/v1/auth/sessions/logout-all
- `DELETE` `/api/v1/auth/sessions/{id}` — **Authenticated** — DELETE /api/v1/auth/sessions/{id}
- `DELETE` `/api/v1/auth/account` — **Authenticated** — DELETE /api/v1/auth/account
- `POST` `/api/v1/auth/cancel-deletion` — **Authenticated** — POST /api/v1/auth/cancel-deletion

## 01 Auth - Login Attempts

- `GET` `/api/v1/login-attempts/stats` — **Authenticated** — GET /api/v1/login-attempts/stats
- `GET` `/api/v1/login-attempts/export` — **Authenticated** — GET /api/v1/login-attempts/export
- `GET` `/api/v1/login-attempts` — **Authenticated** — GET /api/v1/login-attempts

## 02 Admin - Staff Management

- `POST` `/api/v1/admins` — **Authenticated** — Create admin staff user
- `GET` `/api/v1/admins` — **Authenticated** — List admin staff users
- `GET` `/api/v1/admins/{id}` — **Authenticated** — GET /api/v1/admins/{id}
- `PATCH` `/api/v1/admins/{id}` — **Authenticated** — PATCH /api/v1/admins/{id}
- `DELETE` `/api/v1/admins/{id}` — **Authenticated** — Permanently delete admin staff user
- `PATCH` `/api/v1/admins/{id}/active-status` — **Authenticated** — PATCH /api/v1/admins/{id}/active-status
- `PATCH` `/api/v1/admins/{id}/password` — **Authenticated** — PATCH /api/v1/admins/{id}/password

## 02 Admin - Roles & Permissions

- `GET` `/api/v1/admin-roles` — **Authenticated** — GET /api/v1/admin-roles
- `POST` `/api/v1/admin-roles` — **Authenticated** — POST /api/v1/admin-roles
- `GET` `/api/v1/admin-roles/{id}` — **Authenticated** — GET /api/v1/admin-roles/{id}
- `PATCH` `/api/v1/admin-roles/{id}` — **Authenticated** — PATCH /api/v1/admin-roles/{id}
- `DELETE` `/api/v1/admin-roles/{id}` — **Authenticated** — DELETE /api/v1/admin-roles/{id}
- `PATCH` `/api/v1/admin-roles/{id}/permissions` — **Authenticated** — PATCH /api/v1/admin-roles/{id}/permissions
- `GET` `/api/v1/permissions/catalog` — **Authenticated** — GET /api/v1/permissions/catalog

## 02 Admin - User Management

- `GET` `/api/v1/users/export` — **Authenticated** — GET /api/v1/users/export
- `GET` `/api/v1/users` — **Authenticated** — List registered users
- `GET` `/api/v1/users/{id}` — **Authenticated** — GET /api/v1/users/{id}
- `PATCH` `/api/v1/users/{id}` — **Authenticated** — PATCH /api/v1/users/{id}
- `DELETE` `/api/v1/users/{id}` — **Authenticated** — Permanently delete registered user
- `PATCH` `/api/v1/users/{id}/status` — **Authenticated** — PATCH /api/v1/users/{id}/status
- `POST` `/api/v1/users/{id}/suspend` — **Authenticated** — POST /api/v1/users/{id}/suspend
- `POST` `/api/v1/users/{id}/unsuspend` — **Authenticated** — POST /api/v1/users/{id}/unsuspend
- `POST` `/api/v1/users/{id}/reset-password` — **Authenticated** — Change registered user password
- `GET` `/api/v1/users/{id}/activity` — **Authenticated** — GET /api/v1/users/{id}/activity
- `GET` `/api/v1/users/{id}/stats` — **Authenticated** — GET /api/v1/users/{id}/stats

## 02 Admin - Provider Management

- `GET` `/api/v1/providers/export` — **Authenticated** — GET /api/v1/providers/export
- `GET` `/api/v1/providers/stats` — **Authenticated** — GET /api/v1/providers/stats
- `GET` `/api/v1/providers` — **Authenticated** — List providers
- `POST` `/api/v1/providers` — **Authenticated** — Create provider from admin dashboard
- `GET` `/api/v1/providers/lookup` — **Authenticated** — GET /api/v1/providers/lookup
- `GET` `/api/v1/providers/{id}` — **Authenticated** — GET /api/v1/providers/{id}
- `PATCH` `/api/v1/providers/{id}` — **Authenticated** — PATCH /api/v1/providers/{id}
- `DELETE` `/api/v1/providers/{id}` — **Authenticated** — Permanently delete provider
- `PATCH` `/api/v1/providers/{id}/status` — **Authenticated** — Update provider lifecycle status
- `GET` `/api/v1/providers/{id}/items` — **Authenticated** — GET /api/v1/providers/{id}/items
- `GET` `/api/v1/providers/{id}/activity` — **Authenticated** — GET /api/v1/providers/{id}/activity
- `POST` `/api/v1/providers/{id}/message` — **Authenticated** — POST /api/v1/providers/{id}/message

## 02 Admin - Provider Business Categories

- `GET` `/api/v1/provider-business-categories` — **PUBLIC** — List provider business categories
- `POST` `/api/v1/provider-business-categories` — **Authenticated** — Create provider business category
- `GET` `/api/v1/provider-business-categories/{id}` — **Authenticated** — Fetch provider business category details
- `PATCH` `/api/v1/provider-business-categories/{id}` — **Authenticated** — Update provider business category
- `DELETE` `/api/v1/provider-business-categories/{id}` — **Authenticated** — Soft-delete provider business category

## 02 Admin - Referral Settings

- `GET` `/api/v1/referral-settings` — **Authenticated** — Fetch referral settings
- `PATCH` `/api/v1/referral-settings` — **Authenticated** — Update referral settings
- `POST` `/api/v1/referral-settings/activate` — **Authenticated** — Activate referral program
- `POST` `/api/v1/referral-settings/deactivate` — **Authenticated** — Deactivate referral program
- `GET` `/api/v1/referral-settings/stats` — **Authenticated** — Fetch referral stats
- `GET` `/api/v1/referral-settings/audit-logs` — **Authenticated** — List referral settings audit logs

## 02 Admin - Media Upload Policy

- `GET` `/api/v1/media-upload-policy` — **Authenticated** — Fetch global media upload policy
- `PATCH` `/api/v1/media-upload-policy` — **Authenticated** — Update global media upload policy
- `GET` `/api/v1/media-upload-policy/audit-logs` — **Authenticated** — List media upload policy audit logs

## 02 Admin - Audit Logs

- `GET` `/api/v1/audit-logs/export` — **Authenticated** — GET /api/v1/audit-logs/export
- `GET` `/api/v1/audit-logs` — **Authenticated** — GET /api/v1/audit-logs
- `GET` `/api/v1/audit-logs/{id}` — **Authenticated** — GET /api/v1/audit-logs/{id}

## 03 Provider - Business Info

- `GET` `/api/v1/provider/business-info` — **Authenticated** — Fetch own provider business information
- `PATCH` `/api/v1/provider/business-info` — **Authenticated** — Update own provider business information

## 03 Provider - Inventory

- `GET` `/api/v1/provider/inventory` — **Authenticated** — List provider inventory items
- `POST` `/api/v1/provider/inventory` — **Authenticated** — Create provider inventory item with optional nested variants
- `GET` `/api/v1/provider/inventory/stats` — **Authenticated** — Fetch provider inventory stats
- `GET` `/api/v1/provider/inventory/lookup` — **Authenticated** — Lookup active approved provider inventory items
- `GET` `/api/v1/provider/inventory/{id}` — **Authenticated** — Fetch own provider inventory item details
- `PATCH` `/api/v1/provider/inventory/{id}` — **Authenticated** — Update own provider inventory item and upsert variants
- `DELETE` `/api/v1/provider/inventory/{id}` — **Authenticated** — Soft-delete own inventory item
- `PATCH` `/api/v1/provider/inventory/{id}/availability` — **Authenticated** — Update own inventory availability

## 03 Provider - Promotional Offers

- `GET` `/api/v1/provider/offers` — **Authenticated** — GET /api/v1/provider/offers
- `POST` `/api/v1/provider/offers` — **Authenticated** — POST /api/v1/provider/offers
- `GET` `/api/v1/provider/offers/{id}` — **Authenticated** — GET /api/v1/provider/offers/{id}
- `PATCH` `/api/v1/provider/offers/{id}` — **Authenticated** — PATCH /api/v1/provider/offers/{id}
- `DELETE` `/api/v1/provider/offers/{id}` — **Authenticated** — DELETE /api/v1/provider/offers/{id}
- `PATCH` `/api/v1/provider/offers/{id}/status` — **Authenticated** — PATCH /api/v1/provider/offers/{id}/status
- `GET` `/api/v1/promotional-offers/stats` — **Authenticated** — GET /api/v1/promotional-offers/stats
- `GET` `/api/v1/promotional-offers/export` — **Authenticated** — GET /api/v1/promotional-offers/export
- `GET` `/api/v1/promotional-offers` — **Authenticated** — GET /api/v1/promotional-offers
- `POST` `/api/v1/promotional-offers` — **Authenticated** — POST /api/v1/promotional-offers
- `GET` `/api/v1/promotional-offers/{id}` — **Authenticated** — GET /api/v1/promotional-offers/{id}
- `PATCH` `/api/v1/promotional-offers/{id}` — **Authenticated** — PATCH /api/v1/promotional-offers/{id}
- `DELETE` `/api/v1/promotional-offers/{id}` — **Authenticated** — DELETE /api/v1/promotional-offers/{id}
- `PATCH` `/api/v1/promotional-offers/{id}/approve` — **Authenticated** — PATCH /api/v1/promotional-offers/{id}/approve
- `PATCH` `/api/v1/promotional-offers/{id}/reject` — **Authenticated** — PATCH /api/v1/promotional-offers/{id}/reject
- `PATCH` `/api/v1/promotional-offers/{id}/status` — **Authenticated** — PATCH /api/v1/promotional-offers/{id}/status

## 03 Provider - Orders

- `GET` `/api/v1/provider/orders` — **Authenticated** — List own assigned provider orders
- `GET` `/api/v1/provider/orders/history` — **Authenticated** — List own provider order history
- `GET` `/api/v1/provider/orders/performance` — **Authenticated** — Fetch own provider order performance
- `GET` `/api/v1/provider/orders/analytics/revenue` — **Authenticated** — Fetch own provider revenue analytics
- `GET` `/api/v1/provider/orders/analytics/ratings` — **Authenticated** — Fetch own provider ratings analytics
- `GET` `/api/v1/provider/orders/recent` — **Authenticated** — List recent own provider orders
- `GET` `/api/v1/provider/orders/export` — **Authenticated** — Export own provider orders as CSV
- `GET` `/api/v1/provider/orders/summary` — **Authenticated** — Fetch own provider order summary
- `GET` `/api/v1/provider/orders/reject-reasons` — **Authenticated** — List provider order reject reasons
- `PATCH` `/api/v1/provider/orders/{id}/status` — **Authenticated** — Update own provider order fulfillment status
- `POST` `/api/v1/provider/orders/{id}/fulfill` — **Authenticated** — Fulfill own provider order with dispatch details
- `GET` `/api/v1/provider/orders/{id}/timeline` — **Authenticated** — Fetch own provider order timeline
- `GET` `/api/v1/provider/orders/{id}/checklist` — **Authenticated** — Fetch own provider order checklist
- `PATCH` `/api/v1/provider/orders/{id}/checklist` — **Authenticated** — Update own provider order checklist
- `POST` `/api/v1/provider/orders/{id}/message-buyer` — **Authenticated** — Message buyer for own provider order
- `GET` `/api/v1/provider/orders/{id}` — **Authenticated** — Fetch own provider order details
- `POST` `/api/v1/provider/orders/{id}/accept` — **Authenticated** — Accept own pending provider order
- `POST` `/api/v1/provider/orders/{id}/reject` — **Authenticated** — Reject own pending provider order

## 03 Provider - Refund Requests

- `GET` `/api/v1/provider/refund-requests` — **Authenticated** — List own provider refund requests
- `GET` `/api/v1/provider/refund-requests/summary` — **Authenticated** — Fetch own refund request summary
- `GET` `/api/v1/provider/refund-requests/reject-reasons` — **Authenticated** — List refund rejection reasons
- `GET` `/api/v1/provider/refund-requests/{id}` — **Authenticated** — Fetch own refund request details
- `POST` `/api/v1/provider/refund-requests/{id}/approve` — **Authenticated** — Approve own requested refund
- `POST` `/api/v1/provider/refund-requests/{id}/reject` — **Authenticated** — Reject own requested refund

## 04 Gifts - Categories

- `GET` `/api/v1/gift-categories/lookup` — **PUBLIC** — Lookup active gift categories
- `POST` `/api/v1/gift-categories` — **giftCategories** — Create gift category
- `GET` `/api/v1/gift-categories` — **giftCategories** — List gift categories
- `GET` `/api/v1/gift-categories/stats` — **giftCategories** — Fetch gift category stats
- `GET` `/api/v1/gift-categories/{id}` — **giftCategories** — Fetch gift category details
- `PATCH` `/api/v1/gift-categories/{id}` — **giftCategories** — Update gift category
- `DELETE` `/api/v1/gift-categories/{id}` — **giftCategories** — Soft-delete gift category

## 04 Gifts - Management

- `POST` `/api/v1/gifts` — **Authenticated** — Create admin gift with optional nested variants
- `GET` `/api/v1/gifts` — **Authenticated** — List admin gifts
- `GET` `/api/v1/gifts/stats` — **Authenticated** — Fetch gift inventory stats
- `GET` `/api/v1/gifts/export` — **Authenticated** — Export gift inventory
- `GET` `/api/v1/gifts/{id}` — **Authenticated** — Fetch admin gift details with variants
- `PATCH` `/api/v1/gifts/{id}` — **Authenticated** — Update admin gift and upsert nested variants
- `DELETE` `/api/v1/gifts/{id}` — **Authenticated** — Soft-delete gift
- `PATCH` `/api/v1/gifts/{id}/status` — **Authenticated** — Update gift status

## 04 Gifts - Moderation

- `GET` `/api/v1/gift-moderation` — **Authenticated** — GET /api/v1/gift-moderation
- `PATCH` `/api/v1/gift-moderation/{id}/approve` — **Authenticated** — PATCH /api/v1/gift-moderation/{id}/approve
- `PATCH` `/api/v1/gift-moderation/{id}/reject` — **Authenticated** — PATCH /api/v1/gift-moderation/{id}/reject
- `PATCH` `/api/v1/gift-moderation/{id}/flag` — **Authenticated** — PATCH /api/v1/gift-moderation/{id}/flag

## 05 Customer - Marketplace

- `GET` `/api/v1/customer/home` — **Authenticated** — Fetch customer app home
- `GET` `/api/v1/customer/categories` — **Authenticated** — List customer marketplace categories
- `GET` `/api/v1/customer/gifts/discounted` — **Authenticated** — List discounted customer gifts
- `GET` `/api/v1/customer/gifts/filter-options` — **Authenticated** — Fetch marketplace gift filter options
- `GET` `/api/v1/customer/gifts` — **Authenticated** — List customer marketplace gifts
- `GET` `/api/v1/customer/gifts/{id}` — **Authenticated** — Fetch customer-safe gift details

## 05 Customer - Wishlist

- `GET` `/api/v1/customer/wishlist` — **Authenticated** — List wishlist gifts
- `POST` `/api/v1/customer/wishlist/{giftId}` — **Authenticated** — Add gift to wishlist
- `DELETE` `/api/v1/customer/wishlist/{giftId}` — **Authenticated** — Remove gift from wishlist

## 05 Customer - Addresses

- `GET` `/api/v1/customer/addresses` — **Authenticated** — List customer addresses
- `POST` `/api/v1/customer/addresses` — **Authenticated** — Create customer address
- `GET` `/api/v1/customer/addresses/{id}` — **Authenticated** — Fetch customer address
- `PATCH` `/api/v1/customer/addresses/{id}` — **Authenticated** — Update customer address
- `DELETE` `/api/v1/customer/addresses/{id}` — **Authenticated** — Soft-delete customer address
- `PATCH` `/api/v1/customer/addresses/{id}/default` — **Authenticated** — Set default customer address

## 05 Customer - Contacts

- `GET` `/api/v1/customer/contacts` — **Authenticated** — List customer contacts
- `POST` `/api/v1/customer/contacts` — **Authenticated** — Create customer contact
- `GET` `/api/v1/customer/contacts/{id}` — **Authenticated** — Fetch customer contact
- `PATCH` `/api/v1/customer/contacts/{id}` — **Authenticated** — Update customer contact
- `DELETE` `/api/v1/customer/contacts/{id}` — **Authenticated** — Soft-delete customer contact

## 05 Customer - Events

- `GET` `/api/v1/customer/events` — **Authenticated** — List customer events
- `POST` `/api/v1/customer/events` — **Authenticated** — Create customer event
- `GET` `/api/v1/customer/events/calendar` — **Authenticated** — Fetch monthly calendar events
- `GET` `/api/v1/customer/events/upcoming` — **Authenticated** — Fetch upcoming customer events
- `GET` `/api/v1/customer/events/{id}/reminder-settings` — **Authenticated** — Fetch event reminder settings
- `PATCH` `/api/v1/customer/events/{id}/reminder-settings` — **Authenticated** — Update event reminder settings
- `GET` `/api/v1/customer/events/{id}` — **Authenticated** — Fetch customer event details
- `PATCH` `/api/v1/customer/events/{id}` — **Authenticated** — Update customer event
- `DELETE` `/api/v1/customer/events/{id}` — **Authenticated** — Soft-delete customer event

## 05 Customer - Cart

- `GET` `/api/v1/customer/cart` — **Authenticated** — Fetch active cart
- `DELETE` `/api/v1/customer/cart` — **Authenticated** — Clear active cart
- `POST` `/api/v1/customer/cart/items` — **Authenticated** — Add item to cart
- `PATCH` `/api/v1/customer/cart/items/{id}` — **Authenticated** — Update cart item
- `DELETE` `/api/v1/customer/cart/items/{id}` — **Authenticated** — Delete cart item

## 05 Customer - Orders

- `POST` `/api/v1/customer/orders` — **Authenticated** — Create order from active cart
- `GET` `/api/v1/customer/orders` — **Authenticated** — List customer orders
- `GET` `/api/v1/customer/orders/{id}` — **Authenticated** — Fetch customer order

## 05 Customer - Recurring Payments

- `GET` `/api/v1/customer/recurring-payments` — **Authenticated** — List own recurring payments
- `POST` `/api/v1/customer/recurring-payments` — **Authenticated** — Create recurring payment
- `GET` `/api/v1/customer/recurring-payments/summary` — **Authenticated** — Fetch recurring payment summary counts
- `GET` `/api/v1/customer/recurring-payments/{id}` — **Authenticated** — Fetch own recurring payment details
- `PATCH` `/api/v1/customer/recurring-payments/{id}` — **Authenticated** — Update own recurring payment
- `POST` `/api/v1/customer/recurring-payments/{id}/pause` — **Authenticated** — Pause own active recurring payment
- `POST` `/api/v1/customer/recurring-payments/{id}/resume` — **Authenticated** — Resume own paused recurring payment
- `POST` `/api/v1/customer/recurring-payments/{id}/cancel` — **Authenticated** — Cancel own recurring payment
- `GET` `/api/v1/customer/recurring-payments/{id}/history` — **Authenticated** — List own recurring payment billing history

## 05 Customer - Transactions

- `GET` `/api/v1/customer/transactions` — **Authenticated** — List own customer transactions
- `GET` `/api/v1/customer/transactions/summary` — **Authenticated** — Fetch own transaction summary
- `GET` `/api/v1/customer/transactions/export` — **Authenticated** — Export own transactions
- `GET` `/api/v1/customer/transactions/{id}` — **Authenticated** — Fetch own transaction details
- `GET` `/api/v1/customer/transactions/{id}/receipt` — **Authenticated** — Download own transaction receipt

## 05 Customer - Referrals & Rewards

- `GET` `/api/v1/customer/referrals/summary` — **Authenticated** — Fetch own referral reward summary
- `GET` `/api/v1/customer/referrals/link` — **Authenticated** — Fetch own referral link
- `GET` `/api/v1/customer/referrals/history` — **Authenticated** — List own referral history
- `POST` `/api/v1/customer/referrals/redeem` — **Authenticated** — Redeem own available reward credit
- `GET` `/api/v1/customer/rewards/balance` — **Authenticated** — Fetch own reward balance
- `GET` `/api/v1/customer/rewards/ledger` — **Authenticated** — List own reward ledger
- `GET` `/api/v1/customer/referrals/terms` — **Authenticated** — Fetch referral terms

## 05 Customer - Wallet

- `GET` `/api/v1/customer/wallet` — **Authenticated** — Fetch own wallet
- `POST` `/api/v1/customer/wallet/add-funds` — **Authenticated** — Create wallet top-up payment
- `GET` `/api/v1/customer/wallet/history` — **Authenticated** — List own wallet history

## 05 Customer - Payment Methods

- `POST` `/api/v1/customer/bank-accounts` — **Authenticated** — Link placeholder bank account
- `GET` `/api/v1/customer/bank-accounts` — **Authenticated** — List own bank accounts
- `PATCH` `/api/v1/customer/bank-accounts/{id}/default` — **Authenticated** — Set own default bank account
- `DELETE` `/api/v1/customer/bank-accounts/{id}` — **Authenticated** — Delete own bank account
- `POST` `/api/v1/customer/payment-methods/setup-intent` — **Authenticated** — Create Stripe SetupIntent for saving card
- `GET` `/api/v1/customer/payment-methods/saved` — **Authenticated** — List own saved payment methods
- `DELETE` `/api/v1/customer/payment-methods/{id}` — **Authenticated** — Delete own saved payment method
- `GET` `/api/v1/customer/payment-methods` — **Authenticated** — List supported customer payment methods
- `PATCH` `/api/v1/customer/payment-methods/{id}/default` — **Authenticated** — Set own default payment method

## 06 Payments

- `POST` `/api/v1/customer/payments/create-intent` — **Authenticated** — Create payment intent from active cart
- `POST` `/api/v1/customer/payments/confirm` — **Authenticated** — Confirm Stripe payment
- `GET` `/api/v1/customer/payments/{id}` — **Authenticated** — Fetch own payment details
- `POST` `/api/v1/payments/stripe/webhook` — **PUBLIC** — Stripe webhook endpoint
- `POST` `/api/v1/customer/money-gifts` — **Authenticated** — Send payment as gift
- `GET` `/api/v1/customer/money-gifts` — **Authenticated** — List own money gifts
- `GET` `/api/v1/customer/money-gifts/{id}` — **Authenticated** — Fetch own money gift details

## 06 Notifications

- `GET` `/api/v1/notifications` — **Authenticated** — List notifications
- `GET` `/api/v1/notifications/summary` — **Authenticated** — Fetch notification summary
- `GET` `/api/v1/notifications/preferences` — **Authenticated** — Fetch notification preferences
- `PATCH` `/api/v1/notifications/preferences` — **Authenticated** — Update notification preferences
- `PATCH` `/api/v1/notifications/read-all` — **Authenticated** — Mark all own notifications as read
- `PATCH` `/api/v1/notifications/{id}/read` — **Authenticated** — Mark notification as read
- `POST` `/api/v1/notifications/{id}/action` — **Authenticated** — Process notification action
- `POST` `/api/v1/notifications/device-tokens` — **Authenticated** — Save device token
- `DELETE` `/api/v1/notifications/device-tokens/{id}` — **Authenticated** — Disable device token

## 06 Broadcast Notifications

- `POST` `/api/v1/broadcasts` — **Authenticated** — POST /api/v1/broadcasts
- `GET` `/api/v1/broadcasts` — **Authenticated** — GET /api/v1/broadcasts
- `GET` `/api/v1/broadcasts/{id}` — **Authenticated** — GET /api/v1/broadcasts/{id}
- `PATCH` `/api/v1/broadcasts/{id}` — **Authenticated** — PATCH /api/v1/broadcasts/{id}
- `PATCH` `/api/v1/broadcasts/{id}/targeting` — **Authenticated** — PATCH /api/v1/broadcasts/{id}/targeting
- `POST` `/api/v1/broadcasts/estimate-reach` — **Authenticated** — POST /api/v1/broadcasts/estimate-reach
- `PATCH` `/api/v1/broadcasts/{id}/schedule` — **Authenticated** — PATCH /api/v1/broadcasts/{id}/schedule
- `POST` `/api/v1/broadcasts/{id}/cancel` — **Authenticated** — POST /api/v1/broadcasts/{id}/cancel
- `GET` `/api/v1/broadcasts/{id}/report` — **Authenticated** — GET /api/v1/broadcasts/{id}/report
- `GET` `/api/v1/broadcasts/{id}/recipients` — **Authenticated** — GET /api/v1/broadcasts/{id}/recipients

## 07 Plans & Coupons

- `GET` `/api/v1/subscription-plans` — **Authenticated** — GET /api/v1/subscription-plans
- `POST` `/api/v1/subscription-plans` — **Authenticated** — POST /api/v1/subscription-plans
- `GET` `/api/v1/subscription-plans/stats` — **Authenticated** — GET /api/v1/subscription-plans/stats
- `GET` `/api/v1/subscription-plans/{id}` — **Authenticated** — GET /api/v1/subscription-plans/{id}
- `PATCH` `/api/v1/subscription-plans/{id}` — **Authenticated** — PATCH /api/v1/subscription-plans/{id}
- `DELETE` `/api/v1/subscription-plans/{id}` — **Authenticated** — DELETE /api/v1/subscription-plans/{id}
- `PATCH` `/api/v1/subscription-plans/{id}/status` — **Authenticated** — PATCH /api/v1/subscription-plans/{id}/status
- `PATCH` `/api/v1/subscription-plans/{id}/visibility` — **Authenticated** — PATCH /api/v1/subscription-plans/{id}/visibility
- `GET` `/api/v1/subscription-plans/{id}/analytics` — **Authenticated** — GET /api/v1/subscription-plans/{id}/analytics
- `GET` `/api/v1/plan-features/catalog` — **Authenticated** — GET /api/v1/plan-features/catalog
- `GET` `/api/v1/plan-features` — **Authenticated** — GET /api/v1/plan-features
- `POST` `/api/v1/plan-features` — **Authenticated** — POST /api/v1/plan-features
- `GET` `/api/v1/plan-features/{id}` — **Authenticated** — GET /api/v1/plan-features/{id}
- `PATCH` `/api/v1/plan-features/{id}` — **Authenticated** — PATCH /api/v1/plan-features/{id}
- `DELETE` `/api/v1/plan-features/{id}` — **Authenticated** — DELETE /api/v1/plan-features/{id}
- `GET` `/api/v1/coupons` — **Authenticated** — GET /api/v1/coupons
- `POST` `/api/v1/coupons` — **Authenticated** — POST /api/v1/coupons
- `GET` `/api/v1/coupons/{id}` — **Authenticated** — GET /api/v1/coupons/{id}
- `PATCH` `/api/v1/coupons/{id}` — **Authenticated** — PATCH /api/v1/coupons/{id}
- `DELETE` `/api/v1/coupons/{id}` — **Authenticated** — DELETE /api/v1/coupons/{id}
- `PATCH` `/api/v1/coupons/{id}/status` — **Authenticated** — PATCH /api/v1/coupons/{id}/status

## 07 Storage

- `POST` `/api/v1/uploads/presigned-url` — **Authenticated** — Create presigned upload URL
- `POST` `/api/v1/uploads/complete` — **Authenticated** — POST /api/v1/uploads/complete
- `GET` `/api/v1/uploads` — **Authenticated** — GET /api/v1/uploads
- `GET` `/api/v1/uploads/{id}` — **Authenticated** — GET /api/v1/uploads/{id}
- `DELETE` `/api/v1/uploads/{id}` — **Authenticated** — DELETE /api/v1/uploads/{id}
