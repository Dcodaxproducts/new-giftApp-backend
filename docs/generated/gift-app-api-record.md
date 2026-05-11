# Gift App API Record

Total endpoints: 254

## Endpoint Index

- `POST` `/api/v1/auth/users/register` — PUBLIC — POST /api/v1/auth/users/register
- `POST` `/api/v1/auth/providers/register` — PUBLIC — POST /api/v1/auth/providers/register
- `POST` `/api/v1/auth/guest/session` — PUBLIC — POST /api/v1/auth/guest/session
- `POST` `/api/v1/auth/login` — PUBLIC — POST /api/v1/auth/login
- `POST` `/api/v1/auth/refresh` — PUBLIC — POST /api/v1/auth/refresh
- `POST` `/api/v1/auth/logout` — Authenticated — POST /api/v1/auth/logout
- `POST` `/api/v1/auth/verify-email` — Authenticated — POST /api/v1/auth/verify-email
- `POST` `/api/v1/auth/resend-otp` — Authenticated — POST /api/v1/auth/resend-otp
- `POST` `/api/v1/auth/forgot-password` — PUBLIC — POST /api/v1/auth/forgot-password
- `POST` `/api/v1/auth/verify-reset-otp` — PUBLIC — POST /api/v1/auth/verify-reset-otp
- `POST` `/api/v1/auth/reset-password` — PUBLIC — POST /api/v1/auth/reset-password
- `PATCH` `/api/v1/auth/change-password` — Authenticated — PATCH /api/v1/auth/change-password
- `GET` `/api/v1/auth/me` — Authenticated — GET /api/v1/auth/me
- `DELETE` `/api/v1/auth/account` — Authenticated — DELETE /api/v1/auth/account
- `POST` `/api/v1/auth/cancel-deletion` — Authenticated — POST /api/v1/auth/cancel-deletion
- `GET` `/api/v1/login-attempts/stats` — Authenticated — GET /api/v1/login-attempts/stats
- `GET` `/api/v1/login-attempts/export` — Authenticated — GET /api/v1/login-attempts/export
- `GET` `/api/v1/login-attempts` — Authenticated — GET /api/v1/login-attempts
- `GET` `/api/v1/customer/referrals/summary` — REGISTERED_USER — Fetch own referral reward summary
- `GET` `/api/v1/customer/referrals/link` — Authenticated — Fetch own referral link
- `GET` `/api/v1/customer/referrals/history` — REGISTERED_USER — List own referral history
- `POST` `/api/v1/customer/referrals/redeem` — Authenticated — Redeem own available reward credit
- `GET` `/api/v1/customer/rewards/balance` — Authenticated — Fetch own reward balance
- `GET` `/api/v1/customer/rewards/ledger` — REGISTERED_USER — List own reward ledger
- `GET` `/api/v1/customer/referrals/terms` — Authenticated — Fetch referral terms
- `GET` `/api/v1/customer/wallet` — REGISTERED_USER — Fetch own wallet
- `POST` `/api/v1/customer/wallet/add-funds` — Authenticated — Create wallet top-up payment
- `GET` `/api/v1/customer/wallet/history` — Authenticated — List own wallet history
- `POST` `/api/v1/customer/bank-accounts` — Authenticated — Link placeholder bank account
- `GET` `/api/v1/customer/bank-accounts` — Authenticated — List own bank accounts
- `PATCH` `/api/v1/customer/bank-accounts/{id}/default` — Authenticated — Set own default bank account
- `DELETE` `/api/v1/customer/bank-accounts/{id}` — Authenticated — Delete own bank account
- `GET` `/api/v1/referral-settings` — SUPER_ADMIN, ADMIN — Fetch referral settings
- `PATCH` `/api/v1/referral-settings` — SUPER_ADMIN, ADMIN — Update referral settings
- `POST` `/api/v1/referral-settings/activate` — SUPER_ADMIN, ADMIN — Activate referral program
- `POST` `/api/v1/referral-settings/deactivate` — SUPER_ADMIN, ADMIN — Deactivate referral program
- `GET` `/api/v1/referral-settings/stats` — SUPER_ADMIN, ADMIN — Fetch referral stats
- `GET` `/api/v1/referral-settings/audit-logs` — SUPER_ADMIN, ADMIN — List referral settings audit logs
- `POST` `/api/v1/admins` — SUPER_ADMIN, ADMIN — Create admin staff user
- `GET` `/api/v1/admins` — SUPER_ADMIN, ADMIN — List admin staff users
- `GET` `/api/v1/admins/{id}` — Authenticated — GET /api/v1/admins/{id}
- `PATCH` `/api/v1/admins/{id}` — Authenticated — PATCH /api/v1/admins/{id}
- `DELETE` `/api/v1/admins/{id}` — SUPER_ADMIN, ADMIN — Permanently delete admin staff user
- `PATCH` `/api/v1/admins/{id}/active-status` — Authenticated — PATCH /api/v1/admins/{id}/active-status
- `PATCH` `/api/v1/admins/{id}/password` — Authenticated — PATCH /api/v1/admins/{id}/password
- `GET` `/api/v1/admin-roles` — SUPER_ADMIN, ADMIN — GET /api/v1/admin-roles
- `POST` `/api/v1/admin-roles` — Authenticated — POST /api/v1/admin-roles
- `GET` `/api/v1/admin-roles/{id}` — Authenticated — GET /api/v1/admin-roles/{id}
- `PATCH` `/api/v1/admin-roles/{id}` — Authenticated — PATCH /api/v1/admin-roles/{id}
- `DELETE` `/api/v1/admin-roles/{id}` — Authenticated — DELETE /api/v1/admin-roles/{id}
- `PATCH` `/api/v1/admin-roles/{id}/permissions` — Authenticated — PATCH /api/v1/admin-roles/{id}/permissions
- `GET` `/api/v1/permissions/catalog` — Authenticated — GET /api/v1/permissions/catalog
- `GET` `/api/v1/providers/export` — Authenticated — GET /api/v1/providers/export
- `GET` `/api/v1/providers/stats` — Authenticated — GET /api/v1/providers/stats
- `GET` `/api/v1/providers` — SUPER_ADMIN, ADMIN — List providers
- `POST` `/api/v1/providers` — SUPER_ADMIN, ADMIN — Create provider from admin dashboard
- `GET` `/api/v1/providers/lookup` — Authenticated — GET /api/v1/providers/lookup
- `GET` `/api/v1/providers/{id}` — Authenticated — GET /api/v1/providers/{id}
- `PATCH` `/api/v1/providers/{id}` — Authenticated — PATCH /api/v1/providers/{id}
- `DELETE` `/api/v1/providers/{id}` — Authenticated — Permanently delete provider
- `PATCH` `/api/v1/providers/{id}/status` — SUPER_ADMIN, ADMIN — Update provider lifecycle status
- `GET` `/api/v1/providers/{id}/items` — Authenticated — GET /api/v1/providers/{id}/items
- `GET` `/api/v1/providers/{id}/activity` — Authenticated — GET /api/v1/providers/{id}/activity
- `POST` `/api/v1/providers/{id}/message` — Authenticated — POST /api/v1/providers/{id}/message
- `GET` `/api/v1/provider-business-categories` — PUBLIC — List active provider business categories
- `POST` `/api/v1/provider-business-categories` — SUPER_ADMIN, ADMIN — Create provider business category
- `GET` `/api/v1/provider-business-categories/{id}` — SUPER_ADMIN, ADMIN — Fetch provider business category details
- `PATCH` `/api/v1/provider-business-categories/{id}` — SUPER_ADMIN, ADMIN — Update provider business category
- `DELETE` `/api/v1/provider-business-categories/{id}` — SUPER_ADMIN, ADMIN — Soft-delete provider business category
- `GET` `/api/v1/provider/inventory` — PROVIDER — List provider inventory items
- `POST` `/api/v1/provider/inventory` — PROVIDER — Create provider inventory item with optional nested variants
- `GET` `/api/v1/provider/inventory/stats` — Authenticated — Fetch provider inventory stats
- `GET` `/api/v1/provider/inventory/lookup` — Authenticated — Lookup active approved provider inventory items
- `GET` `/api/v1/provider/inventory/{id}` — Authenticated — Fetch own provider inventory item details
- `PATCH` `/api/v1/provider/inventory/{id}` — Authenticated — Update own provider inventory item and upsert variants
- `DELETE` `/api/v1/provider/inventory/{id}` — Authenticated — Soft-delete own inventory item
- `PATCH` `/api/v1/provider/inventory/{id}/availability` — Authenticated — Update own inventory availability
- `GET` `/api/v1/provider/orders` — PROVIDER — List own assigned provider orders
- `GET` `/api/v1/provider/orders/history` — PROVIDER — List own provider order history
- `GET` `/api/v1/provider/orders/performance` — PROVIDER — Fetch own provider order performance
- `GET` `/api/v1/provider/orders/analytics/revenue` — PROVIDER — Fetch own provider revenue analytics
- `GET` `/api/v1/provider/orders/analytics/ratings` — PROVIDER — Fetch own provider ratings analytics
- `GET` `/api/v1/provider/orders/recent` — PROVIDER — List recent own provider orders
- `GET` `/api/v1/provider/orders/export` — PROVIDER — Export own provider orders as CSV
- `GET` `/api/v1/provider/orders/summary` — PROVIDER — Fetch own provider order summary
- `GET` `/api/v1/provider/orders/reject-reasons` — Authenticated — List provider order reject reasons
- `PATCH` `/api/v1/provider/orders/{id}/status` — PROVIDER — Update own provider order fulfillment status
- `GET` `/api/v1/provider/orders/{id}/timeline` — PROVIDER — Fetch own provider order timeline
- `GET` `/api/v1/provider/orders/{id}/checklist` — PROVIDER — Fetch own provider order checklist
- `PATCH` `/api/v1/provider/orders/{id}/checklist` — PROVIDER — Update own provider order checklist
- `POST` `/api/v1/provider/orders/{id}/message-buyer` — PROVIDER — Message buyer for own provider order
- `GET` `/api/v1/provider/orders/{id}` — PROVIDER — Fetch own provider order details
- `POST` `/api/v1/provider/orders/{id}/accept` — Authenticated — Accept own pending provider order
- `POST` `/api/v1/provider/orders/{id}/reject` — Authenticated — Reject own pending provider order
- `GET` `/api/v1/provider/offers` — Authenticated — GET /api/v1/provider/offers
- `POST` `/api/v1/provider/offers` — Authenticated — POST /api/v1/provider/offers
- `GET` `/api/v1/provider/offers/{id}` — Authenticated — GET /api/v1/provider/offers/{id}
- `PATCH` `/api/v1/provider/offers/{id}` — Authenticated — PATCH /api/v1/provider/offers/{id}
- `DELETE` `/api/v1/provider/offers/{id}` — Authenticated — DELETE /api/v1/provider/offers/{id}
- `PATCH` `/api/v1/provider/offers/{id}/status` — Authenticated — PATCH /api/v1/provider/offers/{id}/status
- `GET` `/api/v1/promotional-offers/stats` — Authenticated — GET /api/v1/promotional-offers/stats
- `GET` `/api/v1/promotional-offers/export` — Authenticated — GET /api/v1/promotional-offers/export
- `GET` `/api/v1/promotional-offers` — Authenticated — GET /api/v1/promotional-offers
- `POST` `/api/v1/promotional-offers` — Authenticated — POST /api/v1/promotional-offers
- `GET` `/api/v1/promotional-offers/{id}` — Authenticated — GET /api/v1/promotional-offers/{id}
- `PATCH` `/api/v1/promotional-offers/{id}` — Authenticated — PATCH /api/v1/promotional-offers/{id}
- `DELETE` `/api/v1/promotional-offers/{id}` — Authenticated — DELETE /api/v1/promotional-offers/{id}
- `PATCH` `/api/v1/promotional-offers/{id}/approve` — Authenticated — PATCH /api/v1/promotional-offers/{id}/approve
- `PATCH` `/api/v1/promotional-offers/{id}/reject` — Authenticated — PATCH /api/v1/promotional-offers/{id}/reject
- `PATCH` `/api/v1/promotional-offers/{id}/status` — Authenticated — PATCH /api/v1/promotional-offers/{id}/status
- `GET` `/api/v1/users/export` — Authenticated — GET /api/v1/users/export
- `GET` `/api/v1/users` — SUPER_ADMIN, ADMIN — List registered users
- `GET` `/api/v1/users/{id}` — Authenticated — GET /api/v1/users/{id}
- `PATCH` `/api/v1/users/{id}` — Authenticated — PATCH /api/v1/users/{id}
- `DELETE` `/api/v1/users/{id}` — Authenticated — Permanently delete registered user
- `PATCH` `/api/v1/users/{id}/status` — Authenticated — PATCH /api/v1/users/{id}/status
- `POST` `/api/v1/users/{id}/suspend` — Authenticated — POST /api/v1/users/{id}/suspend
- `POST` `/api/v1/users/{id}/unsuspend` — Authenticated — POST /api/v1/users/{id}/unsuspend
- `POST` `/api/v1/users/{id}/reset-password` — SUPER_ADMIN; ADMIN with users.resetPassword — Change registered user password
- `GET` `/api/v1/users/{id}/activity` — Authenticated — GET /api/v1/users/{id}/activity
- `GET` `/api/v1/users/{id}/stats` — Authenticated — GET /api/v1/users/{id}/stats
- `GET` `/api/v1/customer/contacts` — REGISTERED_USER — List customer contacts
- `POST` `/api/v1/customer/contacts` — REGISTERED_USER — Create customer contact
- `GET` `/api/v1/customer/contacts/{id}` — REGISTERED_USER — Fetch customer contact
- `PATCH` `/api/v1/customer/contacts/{id}` — REGISTERED_USER — Update customer contact
- `DELETE` `/api/v1/customer/contacts/{id}` — REGISTERED_USER — Soft-delete customer contact
- `GET` `/api/v1/customer/events` — REGISTERED_USER — List customer events
- `POST` `/api/v1/customer/events` — REGISTERED_USER — Create customer event
- `GET` `/api/v1/customer/events/calendar` — REGISTERED_USER — Fetch monthly calendar events
- `GET` `/api/v1/customer/events/upcoming` — REGISTERED_USER — Fetch upcoming customer events
- `GET` `/api/v1/customer/events/{id}/reminder-settings` — REGISTERED_USER — Fetch event reminder settings
- `PATCH` `/api/v1/customer/events/{id}/reminder-settings` — REGISTERED_USER — Update event reminder settings
- `GET` `/api/v1/customer/events/{id}` — REGISTERED_USER — Fetch customer event details
- `PATCH` `/api/v1/customer/events/{id}` — REGISTERED_USER — Update customer event
- `DELETE` `/api/v1/customer/events/{id}` — REGISTERED_USER — Soft-delete customer event
- `GET` `/api/v1/customer/home` — REGISTERED_USER — Fetch customer app home
- `GET` `/api/v1/customer/categories` — REGISTERED_USER — List customer marketplace categories
- `GET` `/api/v1/customer/gifts/discounted` — REGISTERED_USER — List discounted customer gifts
- `GET` `/api/v1/customer/gifts/filter-options` — REGISTERED_USER — Fetch marketplace gift filter options
- `GET` `/api/v1/customer/gifts` — REGISTERED_USER — List customer marketplace gifts
- `GET` `/api/v1/customer/gifts/{id}` — REGISTERED_USER — Fetch customer-safe gift details
- `GET` `/api/v1/customer/wishlist` — REGISTERED_USER — List wishlist gifts
- `POST` `/api/v1/customer/wishlist/{giftId}` — REGISTERED_USER — Add gift to wishlist
- `DELETE` `/api/v1/customer/wishlist/{giftId}` — REGISTERED_USER — Remove gift from wishlist
- `GET` `/api/v1/customer/addresses` — REGISTERED_USER — List customer addresses
- `POST` `/api/v1/customer/addresses` — REGISTERED_USER — Create customer address
- `GET` `/api/v1/customer/addresses/{id}` — REGISTERED_USER — Fetch customer address
- `PATCH` `/api/v1/customer/addresses/{id}` — REGISTERED_USER — Update customer address
- `DELETE` `/api/v1/customer/addresses/{id}` — REGISTERED_USER — Soft-delete customer address
- `PATCH` `/api/v1/customer/addresses/{id}/default` — REGISTERED_USER — Set default customer address
- `GET` `/api/v1/customer/cart` — REGISTERED_USER — Fetch active cart
- `DELETE` `/api/v1/customer/cart` — REGISTERED_USER — Clear active cart
- `POST` `/api/v1/customer/cart/items` — REGISTERED_USER — Add item to cart
- `PATCH` `/api/v1/customer/cart/items/{id}` — REGISTERED_USER — Update cart item
- `DELETE` `/api/v1/customer/cart/items/{id}` — REGISTERED_USER — Delete cart item
- `POST` `/api/v1/customer/orders` — REGISTERED_USER — Create order from active cart
- `GET` `/api/v1/customer/orders` — REGISTERED_USER — List customer orders
- `GET` `/api/v1/customer/orders/{id}` — REGISTERED_USER — Fetch customer order
- `GET` `/api/v1/customer/recurring-payments` — REGISTERED_USER — List own recurring payments
- `POST` `/api/v1/customer/recurring-payments` — REGISTERED_USER — Create recurring payment
- `GET` `/api/v1/customer/recurring-payments/summary` — Authenticated — Fetch recurring payment summary counts
- `GET` `/api/v1/customer/recurring-payments/{id}` — REGISTERED_USER — Fetch own recurring payment details
- `PATCH` `/api/v1/customer/recurring-payments/{id}` — Authenticated — Update own recurring payment
- `POST` `/api/v1/customer/recurring-payments/{id}/pause` — Authenticated — Pause own active recurring payment
- `POST` `/api/v1/customer/recurring-payments/{id}/resume` — Authenticated — Resume own paused recurring payment
- `POST` `/api/v1/customer/recurring-payments/{id}/cancel` — Authenticated — Cancel own recurring payment
- `GET` `/api/v1/customer/recurring-payments/{id}/history` — Authenticated — List own recurring payment billing history
- `POST` `/api/v1/customer/payment-methods/setup-intent` — Authenticated — Create Stripe SetupIntent for saving card
- `GET` `/api/v1/customer/payment-methods/saved` — Authenticated — List own saved payment methods
- `DELETE` `/api/v1/customer/payment-methods/{id}` — Authenticated — Delete own saved payment method
- `GET` `/api/v1/customer/transactions` — REGISTERED_USER — List own customer transactions
- `GET` `/api/v1/customer/transactions/summary` — Authenticated — Fetch own transaction summary
- `GET` `/api/v1/customer/transactions/export` — Authenticated — Export own transactions
- `GET` `/api/v1/customer/transactions/{id}` — Authenticated — Fetch own transaction details
- `GET` `/api/v1/customer/transactions/{id}/receipt` — Authenticated — Download own transaction receipt
- `GET` `/api/v1/gift-categories/lookup` — PUBLIC — Lookup active gift categories
- `POST` `/api/v1/gift-categories` — Authenticated — Create gift category
- `GET` `/api/v1/gift-categories` — Authenticated — List gift categories
- `GET` `/api/v1/gift-categories/stats` — Authenticated — Fetch gift category stats
- `GET` `/api/v1/gift-categories/{id}` — Authenticated — Fetch gift category details
- `PATCH` `/api/v1/gift-categories/{id}` — Authenticated — Update gift category
- `DELETE` `/api/v1/gift-categories/{id}` — Authenticated — Soft-delete gift category
- `POST` `/api/v1/gifts` — SUPER_ADMIN, ADMIN — Create admin gift with optional nested variants
- `GET` `/api/v1/gifts` — SUPER_ADMIN, ADMIN — List admin gifts
- `GET` `/api/v1/gifts/stats` — Authenticated — Fetch gift inventory stats
- `GET` `/api/v1/gifts/export` — Authenticated — Export gift inventory
- `GET` `/api/v1/gifts/{id}` — Authenticated — Fetch admin gift details with variants
- `PATCH` `/api/v1/gifts/{id}` — Authenticated — Update admin gift and upsert nested variants
- `DELETE` `/api/v1/gifts/{id}` — Authenticated — Soft-delete gift
- `PATCH` `/api/v1/gifts/{id}/status` — Authenticated — Update gift status
- `GET` `/api/v1/gift-moderation` — Authenticated — GET /api/v1/gift-moderation
- `PATCH` `/api/v1/gift-moderation/{id}/approve` — Authenticated — PATCH /api/v1/gift-moderation/{id}/approve
- `PATCH` `/api/v1/gift-moderation/{id}/reject` — Authenticated — PATCH /api/v1/gift-moderation/{id}/reject
- `PATCH` `/api/v1/gift-moderation/{id}/flag` — Authenticated — PATCH /api/v1/gift-moderation/{id}/flag
- `POST` `/api/v1/broadcasts` — Authenticated — POST /api/v1/broadcasts
- `GET` `/api/v1/broadcasts` — Authenticated — GET /api/v1/broadcasts
- `GET` `/api/v1/broadcasts/{id}` — Authenticated — GET /api/v1/broadcasts/{id}
- `PATCH` `/api/v1/broadcasts/{id}` — Authenticated — PATCH /api/v1/broadcasts/{id}
- `PATCH` `/api/v1/broadcasts/{id}/targeting` — Authenticated — PATCH /api/v1/broadcasts/{id}/targeting
- `POST` `/api/v1/broadcasts/estimate-reach` — Authenticated — POST /api/v1/broadcasts/estimate-reach
- `PATCH` `/api/v1/broadcasts/{id}/schedule` — Authenticated — PATCH /api/v1/broadcasts/{id}/schedule
- `POST` `/api/v1/broadcasts/{id}/cancel` — Authenticated — POST /api/v1/broadcasts/{id}/cancel
- `GET` `/api/v1/broadcasts/{id}/report` — Authenticated — GET /api/v1/broadcasts/{id}/report
- `GET` `/api/v1/broadcasts/{id}/recipients` — Authenticated — GET /api/v1/broadcasts/{id}/recipients
- `GET` `/api/v1/notifications` — Authenticated — List notifications
- `GET` `/api/v1/notifications/summary` — Authenticated — Fetch notification summary
- `GET` `/api/v1/notifications/preferences` — Authenticated — Fetch notification preferences
- `PATCH` `/api/v1/notifications/preferences` — Authenticated — Update notification preferences
- `PATCH` `/api/v1/notifications/read-all` — Authenticated — Mark all own notifications as read
- `PATCH` `/api/v1/notifications/{id}/read` — Authenticated — Mark notification as read
- `POST` `/api/v1/notifications/{id}/action` — Authenticated — Process notification action
- `POST` `/api/v1/notifications/device-tokens` — Authenticated — Save device token
- `DELETE` `/api/v1/notifications/device-tokens/{id}` — Authenticated — Disable device token
- `GET` `/api/v1/subscription-plans` — Authenticated — GET /api/v1/subscription-plans
- `POST` `/api/v1/subscription-plans` — Authenticated — POST /api/v1/subscription-plans
- `GET` `/api/v1/subscription-plans/stats` — Authenticated — GET /api/v1/subscription-plans/stats
- `GET` `/api/v1/subscription-plans/{id}` — Authenticated — GET /api/v1/subscription-plans/{id}
- `PATCH` `/api/v1/subscription-plans/{id}` — Authenticated — PATCH /api/v1/subscription-plans/{id}
- `DELETE` `/api/v1/subscription-plans/{id}` — Authenticated — DELETE /api/v1/subscription-plans/{id}
- `PATCH` `/api/v1/subscription-plans/{id}/status` — Authenticated — PATCH /api/v1/subscription-plans/{id}/status
- `PATCH` `/api/v1/subscription-plans/{id}/visibility` — Authenticated — PATCH /api/v1/subscription-plans/{id}/visibility
- `GET` `/api/v1/subscription-plans/{id}/analytics` — Authenticated — GET /api/v1/subscription-plans/{id}/analytics
- `GET` `/api/v1/plan-features/catalog` — Authenticated — GET /api/v1/plan-features/catalog
- `GET` `/api/v1/plan-features` — Authenticated — GET /api/v1/plan-features
- `POST` `/api/v1/plan-features` — Authenticated — POST /api/v1/plan-features
- `GET` `/api/v1/plan-features/{id}` — Authenticated — GET /api/v1/plan-features/{id}
- `PATCH` `/api/v1/plan-features/{id}` — Authenticated — PATCH /api/v1/plan-features/{id}
- `DELETE` `/api/v1/plan-features/{id}` — Authenticated — DELETE /api/v1/plan-features/{id}
- `GET` `/api/v1/coupons` — Authenticated — GET /api/v1/coupons
- `POST` `/api/v1/coupons` — Authenticated — POST /api/v1/coupons
- `GET` `/api/v1/coupons/{id}` — Authenticated — GET /api/v1/coupons/{id}
- `PATCH` `/api/v1/coupons/{id}` — Authenticated — PATCH /api/v1/coupons/{id}
- `DELETE` `/api/v1/coupons/{id}` — Authenticated — DELETE /api/v1/coupons/{id}
- `PATCH` `/api/v1/coupons/{id}/status` — Authenticated — PATCH /api/v1/coupons/{id}/status
- `GET` `/api/v1/media-upload-policy` — SUPER_ADMIN, ADMIN — Fetch global media upload policy
- `PATCH` `/api/v1/media-upload-policy` — SUPER_ADMIN, ADMIN — Update global media upload policy
- `GET` `/api/v1/media-upload-policy/audit-logs` — SUPER_ADMIN, ADMIN — List media upload policy audit logs
- `POST` `/api/v1/customer/payments/create-intent` — REGISTERED_USER — Create payment intent from active cart
- `POST` `/api/v1/customer/payments/confirm` — REGISTERED_USER — Confirm Stripe payment
- `GET` `/api/v1/customer/payments/{id}` — Authenticated — Fetch own payment details
- `GET` `/api/v1/customer/payment-methods` — Authenticated — List supported customer payment methods
- `PATCH` `/api/v1/customer/payment-methods/{id}/default` — Authenticated — Set own default payment method
- `POST` `/api/v1/payments/stripe/webhook` — PUBLIC — Stripe webhook endpoint
- `POST` `/api/v1/customer/money-gifts` — Authenticated — Send payment as gift
- `GET` `/api/v1/customer/money-gifts` — Authenticated — List own money gifts
- `GET` `/api/v1/customer/money-gifts/{id}` — Authenticated — Fetch own money gift details
- `GET` `/api/v1/audit-logs/export` — Authenticated — GET /api/v1/audit-logs/export
- `GET` `/api/v1/audit-logs` — Authenticated — GET /api/v1/audit-logs
- `GET` `/api/v1/audit-logs/{id}` — Authenticated — GET /api/v1/audit-logs/{id}
- `POST` `/api/v1/uploads/presigned-url` — Authenticated — POST /api/v1/uploads/presigned-url
- `POST` `/api/v1/uploads/complete` — Authenticated — POST /api/v1/uploads/complete
- `GET` `/api/v1/uploads` — Authenticated — GET /api/v1/uploads
- `GET` `/api/v1/uploads/{id}` — Authenticated — GET /api/v1/uploads/{id}
- `DELETE` `/api/v1/uploads/{id}` — Authenticated — DELETE /api/v1/uploads/{id}

## 01 Auth

### POST /api/v1/auth/users/register

**Allowed role/access:** PUBLIC

**Summary:** POST /api/v1/auth/users/register

**Request payload example:**

```json
{
  "email": "string",
  "password": "string",
  "firstName": "string",
  "lastName": "string",
  "phone": "string",
  "referralCode": "SARAH-M"
}
```

**Response example:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```

### POST /api/v1/auth/providers/register

**Allowed role/access:** PUBLIC

**Summary:** POST /api/v1/auth/providers/register

**Request payload example:**

```json
{
  "email": "string",
  "password": "string",
  "firstName": "string",
  "lastName": "string",
  "phone": "string",
  "referralCode": "SARAH-M",
  "businessName": "string",
  "businessCategoryId": "string",
  "taxId": "string",
  "businessAddress": "string",
  "fulfillmentMethods": [],
  "autoAcceptOrders": false
}
```

**Response example:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```

### POST /api/v1/auth/guest/session

**Allowed role/access:** PUBLIC

**Summary:** POST /api/v1/auth/guest/session

**Request payload example:**

```json
{
  "capabilities": []
}
```

**Response example:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```

### POST /api/v1/auth/login

**Allowed role/access:** PUBLIC

**Summary:** POST /api/v1/auth/login

**Request payload example:**

```json
{
  "email": "string",
  "password": "string"
}
```

**Response example:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```

### POST /api/v1/auth/refresh

**Allowed role/access:** PUBLIC

**Summary:** POST /api/v1/auth/refresh

**Request payload example:**

```json
{
  "refreshToken": "string"
}
```

**Response example:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```

### POST /api/v1/auth/logout

**Allowed role/access:** Authenticated

**Summary:** POST /api/v1/auth/logout

**Request payload example:**

```text
None
```

**Response example:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```

### POST /api/v1/auth/verify-email

**Allowed role/access:** Authenticated

**Summary:** POST /api/v1/auth/verify-email

**Request payload example:**

```json
{
  "otp": "string"
}
```

**Response example:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```

### POST /api/v1/auth/resend-otp

**Allowed role/access:** Authenticated

**Summary:** POST /api/v1/auth/resend-otp

**Request payload example:**

```text
None
```

**Response example:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```

### POST /api/v1/auth/forgot-password

**Allowed role/access:** PUBLIC

**Summary:** POST /api/v1/auth/forgot-password

**Request payload example:**

```json
{
  "email": "user@example.com"
}
```

**Response example:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```

### POST /api/v1/auth/verify-reset-otp

**Allowed role/access:** PUBLIC

**Summary:** POST /api/v1/auth/verify-reset-otp

**Request payload example:**

```json
{
  "email": "user@example.com",
  "otp": "334018"
}
```

**Response example:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```

### POST /api/v1/auth/reset-password

**Allowed role/access:** PUBLIC

**Summary:** POST /api/v1/auth/reset-password

**Request payload example:**

```json
{
  "email": "user@example.com",
  "otp": "334018",
  "newPassword": "NewPassword@123"
}
```

**Response example:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```

### PATCH /api/v1/auth/change-password

**Allowed role/access:** Authenticated

**Summary:** PATCH /api/v1/auth/change-password

**Request payload example:**

```json
{
  "currentPassword": "string",
  "newPassword": "string"
}
```

**Response example:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```

### GET /api/v1/auth/me

**Allowed role/access:** Authenticated

**Summary:** GET /api/v1/auth/me

**Request payload example:**

```text
None
```

**Response example:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```

### DELETE /api/v1/auth/account

**Allowed role/access:** Authenticated

**Summary:** DELETE /api/v1/auth/account

**Request payload example:**

```text
None
```

**Response example:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```

### POST /api/v1/auth/cancel-deletion

**Allowed role/access:** Authenticated

**Summary:** POST /api/v1/auth/cancel-deletion

**Request payload example:**

```text
None
```

**Response example:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```


## 01 Auth - Login Attempts

### GET /api/v1/login-attempts/stats

**Allowed role/access:** Authenticated

**Summary:** GET /api/v1/login-attempts/stats

**Parameters:**

- `email` (query, optional)
- `status` (query, optional)
- `role` (query, optional)
- `page` (query, optional)
- `limit` (query, optional)
- `userId` (query, optional)
- `from` (query, optional)
- `to` (query, optional)

**Request payload example:**

```text
None
```

**Response example:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```

### GET /api/v1/login-attempts/export

**Allowed role/access:** Authenticated

**Summary:** GET /api/v1/login-attempts/export

**Parameters:**

- `email` (query, optional)
- `status` (query, optional)
- `role` (query, optional)
- `page` (query, optional)
- `limit` (query, optional)
- `userId` (query, optional)
- `from` (query, optional)
- `to` (query, optional)

**Request payload example:**

```text
None
```

**Response example:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```

### GET /api/v1/login-attempts

**Allowed role/access:** Authenticated

**Summary:** GET /api/v1/login-attempts

**Parameters:**

- `email` (query, optional)
- `status` (query, optional)
- `role` (query, optional)
- `page` (query, optional)
- `limit` (query, optional)
- `userId` (query, optional)
- `from` (query, optional)
- `to` (query, optional)

**Request payload example:**

```text
None
```

**Response example:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```


## 02 Admin - Staff Management

### POST /api/v1/admins

**Allowed role/access:** SUPER_ADMIN, ADMIN

**Summary:** Create admin staff user

**Description:** Creates an ADMIN staff user under Super Admin. The roleId field is the AdminRole ID that controls this staff user's permissions. This endpoint cannot create SUPER_ADMIN, REGISTERED_USER, PROVIDER, or GUEST_USER accounts.

**Request payload example:**

```json
{}
```

**Response example:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```

### GET /api/v1/admins

**Allowed role/access:** SUPER_ADMIN, ADMIN

**Summary:** List admin staff users

**Description:** SUPER_ADMIN only. Returns User.role = ADMIN staff accounts only; SUPER_ADMIN accounts are intentionally excluded.

**Parameters:**

- `page` (query, optional)
- `limit` (query, optional)
- `search` (query, optional)
- `roleId` (query, optional)
- `role` (query, optional)
- `status` (query, optional)
- `sortBy` (query, optional)
- `sortOrder` (query, optional)

**Request payload example:**

```text
None
```

**Response example:**

```json
{
  "success": true,
  "data": [
    {
      "id": "admin_id",
      "firstName": "Operations",
      "lastName": "Staff",
      "fullName": "Operations Staff",
      "email": "staff@example.com",
      "phone": "+15550000002",
      "role": {
        "id": "admin_role_id",
        "name": "Gift Manager",
        "slug": "gift-manager"
      },
      "isActive": true,
      "isVerified": true,
      "createdAt": "2026-05-09T10:00:00.000Z",
      "lastLoginAt": null
    }
  ],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "totalPages": 1
  },
  "message": "Admins fetched successfully"
}
```

### GET /api/v1/admins/{id}

**Allowed role/access:** Authenticated

**Summary:** GET /api/v1/admins/{id}

**Parameters:**

- `id` (path, required)

**Request payload example:**

```text
None
```

**Response example:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```

### PATCH /api/v1/admins/{id}

**Allowed role/access:** Authenticated

**Summary:** PATCH /api/v1/admins/{id}

**Parameters:**

- `id` (path, required)

**Request payload example:**

```json
{
  "firstName": "string",
  "lastName": "string",
  "phone": "string",
  "avatarUrl": "string",
  "title": "string",
  "roleId": "string",
  "isActive": true
}
```

**Response example:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```

### DELETE /api/v1/admins/{id}

**Allowed role/access:** SUPER_ADMIN, ADMIN

**Summary:** Permanently delete admin staff user

**Description:** DANGER: This endpoint permanently deletes an ADMIN staff account from the database. This is not a soft delete. Use only from Super Admin danger zone screens. SUPER_ADMIN accounts and self-delete are blocked.

**Parameters:**

- `id` (path, required)

**Request payload example:**

```json
{
  "confirmation": "PERMANENTLY_DELETE_ADMIN",
  "reason": "Staff account removed."
}
```

**Response example:**

```json
{
  "success": true,
  "data": {
    "deletedAdminId": "admin_id"
  },
  "message": "Admin staff user permanently deleted successfully."
}
```

### PATCH /api/v1/admins/{id}/active-status

**Allowed role/access:** Authenticated

**Summary:** PATCH /api/v1/admins/{id}/active-status

**Parameters:**

- `id` (path, required)

**Request payload example:**

```json
{
  "isActive": true
}
```

**Response example:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```

### PATCH /api/v1/admins/{id}/password

**Allowed role/access:** Authenticated

**Summary:** PATCH /api/v1/admins/{id}/password

**Parameters:**

- `id` (path, required)

**Request payload example:**

```json
{
  "temporaryPassword": "string",
  "generateTemporaryPassword": true,
  "mustChangePassword": true,
  "sendEmail": true
}
```

**Response example:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```


## 02 Admin - Roles & Permissions

### GET /api/v1/admin-roles

**Allowed role/access:** SUPER_ADMIN, ADMIN

**Summary:** GET /api/v1/admin-roles

**Description:** Admin Roles / RBAC manages permission roles for ADMIN staff users only. SUPER_ADMIN has full immutable access and does not depend on AdminRole permissions.

**Parameters:**

- `search` (query, optional)
- `isSystem` (query, optional)
- `isActive` (query, optional)

**Request payload example:**

```text
None
```

**Response example:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```

### POST /api/v1/admin-roles

**Allowed role/access:** Authenticated

**Summary:** POST /api/v1/admin-roles

**Request payload example:**

```json
{
  "name": "string",
  "description": "string",
  "permissions": "string"
}
```

**Response example:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```

### GET /api/v1/admin-roles/{id}

**Allowed role/access:** Authenticated

**Summary:** GET /api/v1/admin-roles/{id}

**Parameters:**

- `id` (path, required)

**Request payload example:**

```text
None
```

**Response example:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```

### PATCH /api/v1/admin-roles/{id}

**Allowed role/access:** Authenticated

**Summary:** PATCH /api/v1/admin-roles/{id}

**Parameters:**

- `id` (path, required)

**Request payload example:**

```json
{
  "name": "string",
  "description": "string",
  "isActive": true
}
```

**Response example:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```

### DELETE /api/v1/admin-roles/{id}

**Allowed role/access:** Authenticated

**Summary:** DELETE /api/v1/admin-roles/{id}

**Parameters:**

- `id` (path, required)

**Request payload example:**

```text
None
```

**Response example:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```

### PATCH /api/v1/admin-roles/{id}/permissions

**Allowed role/access:** Authenticated

**Summary:** PATCH /api/v1/admin-roles/{id}/permissions

**Parameters:**

- `id` (path, required)

**Request payload example:**

```json
{
  "permissions": "string"
}
```

**Response example:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```

### GET /api/v1/permissions/catalog

**Allowed role/access:** Authenticated

**Summary:** GET /api/v1/permissions/catalog

**Description:** Read-only list of backend-supported permission keys that can be assigned to admin roles.

**Request payload example:**

```text
None
```

**Response example:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```


## 02 Admin - User Management

### GET /api/v1/users/export

**Allowed role/access:** Authenticated

**Summary:** GET /api/v1/users/export

**Parameters:**

- `search` (query, optional)
- `status` (query, optional)
- `registrationFrom` (query, optional)
- `registrationTo` (query, optional)
- `format` (query, optional)

**Request payload example:**

```text
None
```

**Response example:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```

### GET /api/v1/users

**Allowed role/access:** SUPER_ADMIN, ADMIN

**Summary:** List registered users

**Description:** SUPER_ADMIN/ADMIN with users.read permission.

**Parameters:**

- `page` (query, optional)
- `limit` (query, optional)
- `search` (query, optional)
- `status` (query, optional)
- `registrationFrom` (query, optional)
- `registrationTo` (query, optional)
- `sortBy` (query, optional)
- `sortOrder` (query, optional)

**Request payload example:**

```text
None
```

**Response example:**

```json
{
  "success": true,
  "data": [
    {
      "id": "user_id",
      "email": "customer@example.com",
      "firstName": "Sarah",
      "lastName": "Johnson",
      "phone": "+923001234567",
      "role": "REGISTERED_USER",
      "isVerified": true,
      "isActive": true,
      "createdAt": "2026-05-09T10:00:00.000Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "totalPages": 1
  },
  "message": "Users fetched successfully"
}
```

### GET /api/v1/users/{id}

**Allowed role/access:** Authenticated

**Summary:** GET /api/v1/users/{id}

**Parameters:**

- `id` (path, required)

**Request payload example:**

```text
None
```

**Response example:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```

### PATCH /api/v1/users/{id}

**Allowed role/access:** Authenticated

**Summary:** PATCH /api/v1/users/{id}

**Parameters:**

- `id` (path, required)

**Request payload example:**

```json
{
  "firstName": "Alex",
  "lastName": "Johnson",
  "phone": "+15552345678",
  "avatarUrl": "https://<YOUR_PUBLIC_BUCKET_OR_CDN_URL>/user-avatars/avatar.jpg",
  "location": "New York, USA"
}
```

**Response example:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```

### DELETE /api/v1/users/{id}

**Allowed role/access:** Authenticated

**Summary:** Permanently delete registered user

**Description:** DANGER: This endpoint permanently deletes/anonymizes the registered user and removes related non-financial data from the database. This is not a soft delete. Use only from Super Admin danger zone screens.

**Parameters:**

- `id` (path, required)

**Request payload example:**

```json
{
  "confirmation": "PERMANENTLY_DELETE_USER",
  "reason": "User requested full deletion.",
  "deleteRelatedRecords": true
}
```

**Response example:**

```json
{
  "success": true,
  "data": {
    "deletedUserId": "user_id",
    "deletedRelatedRecords": true
  },
  "message": "User permanently deleted successfully."
}
```

### PATCH /api/v1/users/{id}/status

**Allowed role/access:** Authenticated

**Summary:** PATCH /api/v1/users/{id}/status

**Parameters:**

- `id` (path, required)

**Request payload example:**

```json
{
  "status": "string",
  "reason": "string",
  "comment": "Suspicious activity detected on this account.",
  "notifyUser": true
}
```

**Response example:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```

### POST /api/v1/users/{id}/suspend

**Allowed role/access:** Authenticated

**Summary:** POST /api/v1/users/{id}/suspend

**Parameters:**

- `id` (path, required)

**Request payload example:**

```json
{
  "reason": "string",
  "comment": "Suspicious account activity.",
  "notifyUser": true
}
```

**Response example:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```

### POST /api/v1/users/{id}/unsuspend

**Allowed role/access:** Authenticated

**Summary:** POST /api/v1/users/{id}/unsuspend

**Parameters:**

- `id` (path, required)

**Request payload example:**

```json
{
  "comment": "Account reviewed and restored.",
  "notifyUser": true
}
```

**Response example:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```

### POST /api/v1/users/{id}/reset-password

**Allowed role/access:** SUPER_ADMIN; ADMIN with users.resetPassword

**Summary:** Change registered user password

**Description:** SUPER_ADMIN or ADMIN with users.resetPassword permission can change a REGISTERED_USER password from the dashboard. Optionally sends email and in-app notification to the user.

**Parameters:**

- `id` (path, required)

**Request payload example:**

```json
{
  "newPassword": "NewUser@123456",
  "sendEmail": true,
  "sendNotification": true,
  "reason": "Password changed by support request."
}
```

**Response example:**

```json
{
  "success": true,
  "data": {
    "userId": "user_id",
    "email": "user@example.com",
    "emailSent": true,
    "notificationSent": true
  },
  "message": "User password changed successfully."
}
```

### GET /api/v1/users/{id}/activity

**Allowed role/access:** Authenticated

**Summary:** GET /api/v1/users/{id}/activity

**Parameters:**

- `id` (path, required)
- `page` (query, optional)
- `limit` (query, optional)
- `type` (query, optional)

**Request payload example:**

```text
None
```

**Response example:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```

### GET /api/v1/users/{id}/stats

**Allowed role/access:** Authenticated

**Summary:** GET /api/v1/users/{id}/stats

**Parameters:**

- `id` (path, required)

**Request payload example:**

```text
None
```

**Response example:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```


## 02 Admin - Provider Management

### GET /api/v1/providers/export

**Allowed role/access:** Authenticated

**Summary:** GET /api/v1/providers/export

**Parameters:**

- `search` (query, optional)
- `status` (query, optional)
- `approvalStatus` (query, optional)
- `format` (query, optional)

**Request payload example:**

```text
None
```

**Response example:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```

### GET /api/v1/providers/stats

**Allowed role/access:** Authenticated

**Summary:** GET /api/v1/providers/stats

**Request payload example:**

```text
None
```

**Response example:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```

### GET /api/v1/providers

**Allowed role/access:** SUPER_ADMIN, ADMIN

**Summary:** List providers

**Description:** SUPER_ADMIN/ADMIN with providers.read permission.

**Parameters:**

- `page` (query, optional)
- `limit` (query, optional)
- `search` (query, optional)
- `status` (query, optional)
- `approvalStatus` (query, optional)
- `sortBy` (query, optional)
- `sortOrder` (query, optional)

**Request payload example:**

```text
None
```

**Response example:**

```json
{
  "success": true,
  "data": [
    {
      "id": "provider_id",
      "businessName": "Premium Gifts Co",
      "email": "provider@example.com",
      "phone": "+923001234567",
      "approvalStatus": "APPROVED",
      "isActive": true,
      "businessCategory": {
        "id": "category_id",
        "name": "Gift Supplier"
      },
      "createdAt": "2026-05-09T10:00:00.000Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "totalPages": 1
  },
  "message": "Providers fetched successfully"
}
```

### POST /api/v1/providers

**Allowed role/access:** SUPER_ADMIN, ADMIN

**Summary:** Create provider from admin dashboard

**Description:** SUPER_ADMIN or ADMIN with providers.create permission. Creates a PROVIDER account and provider business profile. Supports same business fields as provider self-registration, plus temporary password and invite email flow.

**Request payload example:**

```json
{
  "email": "contact@giftsandblooms.com",
  "firstName": "Ali",
  "lastName": "Raza",
  "phone": "+15551234567",
  "businessName": "Gifts & Blooms Co. Ltd",
  "businessCategoryId": "provider_business_category_id",
  "taxId": "TAX-12345",
  "businessAddress": "123 Gift Street",
  "serviceArea": "New York, USA",
  "headquarters": "New York, USA",
  "fulfillmentMethods": [
    "PICKUP",
    "DELIVERY"
  ],
  "autoAcceptOrders": false,
  "documentUrls": [
    "https://cdn.yourdomain.com/provider-documents/license.pdf"
  ],
  "generateTemporaryPassword": true,
  "temporaryPassword": "Provider@123456",
  "mustChangePassword": true,
  "sendInviteEmail": true,
  "approvalStatus": "PENDING",
  "isActive": true
}
```

**Response example:**

```json
{
  "success": true,
  "data": {
    "id": "provider_id",
    "userId": "provider_id",
    "email": "contact@giftsandblooms.com",
    "businessName": "Gifts & Blooms Co. Ltd",
    "approvalStatus": "PENDING",
    "isActive": true,
    "inviteEmailSent": true
  },
  "message": "Provider created successfully and invite email sent."
}
```

### GET /api/v1/providers/lookup

**Allowed role/access:** Authenticated

**Summary:** GET /api/v1/providers/lookup

**Parameters:**

- `search` (query, optional)
- `approvalStatus` (query, optional)
- `isActive` (query, optional)
- `limit` (query, optional)

**Request payload example:**

```text
None
```

**Response example:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```

### GET /api/v1/providers/{id}

**Allowed role/access:** Authenticated

**Summary:** GET /api/v1/providers/{id}

**Parameters:**

- `id` (path, required)

**Request payload example:**

```text
None
```

**Response example:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```

### PATCH /api/v1/providers/{id}

**Allowed role/access:** Authenticated

**Summary:** PATCH /api/v1/providers/{id}

**Parameters:**

- `id` (path, required)

**Request payload example:**

```json
{
  "businessName": "Gifts & Blooms Co. Ltd",
  "phone": "+15551234567",
  "serviceArea": "New York, USA",
  "headquarters": "New York, USA",
  "avatarUrl": "https://<YOUR_PUBLIC_BUCKET_OR_CDN_URL>/provider-logos/logo.png",
  "documentUrls": []
}
```

**Response example:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```

### DELETE /api/v1/providers/{id}

**Allowed role/access:** Authenticated

**Summary:** Permanently delete provider

**Description:** DANGER: This endpoint permanently deletes/anonymizes the provider and related provider data from the database. This is not a soft delete. Use only from Super Admin danger zone screens. Active processing orders block deletion.

**Parameters:**

- `id` (path, required)

**Request payload example:**

```json
{
  "confirmation": "PERMANENTLY_DELETE_PROVIDER",
  "reason": "Provider account removed by Super Admin.",
  "deleteRelatedRecords": true
}
```

**Response example:**

```json
{
  "success": true,
  "data": {
    "deletedProviderId": "provider_id",
    "deletedRelatedRecords": true
  },
  "message": "Provider permanently deleted successfully."
}
```

### PATCH /api/v1/providers/{id}/status

**Allowed role/access:** SUPER_ADMIN, ADMIN

**Summary:** Update provider lifecycle status

**Description:** SUPER_ADMIN or ADMIN with providers.updateStatus permission can use this unified provider lifecycle endpoint for approving, rejecting, activating, deactivating, suspending, and unsuspending providers. Uses action-based request body.

**Parameters:**

- `id` (path, required)

**Request payload example:**

```json
{
  "action": "APPROVE",
  "status": "ACTIVE",
  "reason": "INCOMPLETE_DOCUMENTS",
  "comment": "Documents verified successfully.",
  "notifyProvider": true
}
```

**Response example:**

```json
{
  "success": true,
  "data": {
    "id": "provider_id",
    "approvalStatus": "APPROVED",
    "status": "ACTIVE",
    "isActive": true
  },
  "message": "Provider approved successfully."
}
```

### GET /api/v1/providers/{id}/items

**Allowed role/access:** Authenticated

**Summary:** GET /api/v1/providers/{id}/items

**Parameters:**

- `id` (path, required)
- `page` (query, optional)
- `limit` (query, optional)
- `search` (query, optional)
- `status` (query, optional)
- `sortBy` (query, optional)
- `sortOrder` (query, optional)

**Request payload example:**

```text
None
```

**Response example:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```

### GET /api/v1/providers/{id}/activity

**Allowed role/access:** Authenticated

**Summary:** GET /api/v1/providers/{id}/activity

**Parameters:**

- `id` (path, required)
- `page` (query, optional)
- `limit` (query, optional)
- `type` (query, optional)

**Request payload example:**

```text
None
```

**Response example:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```

### POST /api/v1/providers/{id}/message

**Allowed role/access:** Authenticated

**Summary:** POST /api/v1/providers/{id}/message

**Parameters:**

- `id` (path, required)

**Request payload example:**

```json
{
  "subject": "Account update",
  "message": "Please update your business documents.",
  "channel": "string"
}
```

**Response example:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```

### GET /api/v1/provider-business-categories

**Allowed role/access:** PUBLIC

**Summary:** List active provider business categories

**Description:** Public signup dropdown. Returns active, non-deleted provider business categories only.

**Parameters:**

- `page` (query, optional)
- `limit` (query, optional)
- `search` (query, optional)
- `isActive` (query, optional)

**Request payload example:**

```text
None
```

**Response example:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```

### POST /api/v1/provider-business-categories

**Allowed role/access:** SUPER_ADMIN, ADMIN

**Summary:** Create provider business category

**Description:** SUPER_ADMIN or ADMIN with providerBusinessCategories.create permission only.

**Request payload example:**

```json
{
  "name": "string",
  "description": "string",
  "iconKey": "string",
  "sortOrder": 0,
  "isActive": true
}
```

**Response example:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```

### GET /api/v1/provider-business-categories/{id}

**Allowed role/access:** SUPER_ADMIN, ADMIN

**Summary:** Fetch provider business category details

**Description:** SUPER_ADMIN or ADMIN with providerBusinessCategories.read permission only.

**Parameters:**

- `id` (path, required)

**Request payload example:**

```text
None
```

**Response example:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```

### PATCH /api/v1/provider-business-categories/{id}

**Allowed role/access:** SUPER_ADMIN, ADMIN

**Summary:** Update provider business category

**Description:** SUPER_ADMIN or ADMIN with providerBusinessCategories.update permission only.

**Parameters:**

- `id` (path, required)

**Request payload example:**

```json
{
  "name": "string",
  "description": "string",
  "iconKey": "string",
  "sortOrder": 0,
  "isActive": true
}
```

**Response example:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```

### DELETE /api/v1/provider-business-categories/{id}

**Allowed role/access:** SUPER_ADMIN, ADMIN

**Summary:** Soft-delete provider business category

**Description:** SUPER_ADMIN or ADMIN with providerBusinessCategories.delete permission only. Refuses deletion when active providers are attached.

**Parameters:**

- `id` (path, required)

**Request payload example:**

```text
None
```

**Response example:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```


## 02 Admin - Promotional Offers

### GET /api/v1/promotional-offers/stats

**Allowed role/access:** Authenticated

**Summary:** GET /api/v1/promotional-offers/stats

**Request payload example:**

```text
None
```

**Response example:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```

### GET /api/v1/promotional-offers/export

**Allowed role/access:** Authenticated

**Summary:** GET /api/v1/promotional-offers/export

**Parameters:**

- `page` (query, optional)
- `limit` (query, optional)
- `search` (query, optional)
- `status` (query, optional)
- `itemId` (query, optional)
- `sortBy` (query, optional)
- `sortOrder` (query, optional)
- `providerId` (query, optional)
- `approvalStatus` (query, optional)
- `discountType` (query, optional)
- `startFrom` (query, optional)
- `startTo` (query, optional)

**Request payload example:**

```text
None
```

**Response example:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```

### GET /api/v1/promotional-offers

**Allowed role/access:** Authenticated

**Summary:** GET /api/v1/promotional-offers

**Parameters:**

- `page` (query, optional)
- `limit` (query, optional)
- `search` (query, optional)
- `status` (query, optional)
- `itemId` (query, optional)
- `sortBy` (query, optional)
- `sortOrder` (query, optional)
- `providerId` (query, optional)
- `approvalStatus` (query, optional)
- `discountType` (query, optional)
- `startFrom` (query, optional)
- `startTo` (query, optional)

**Request payload example:**

```text
None
```

**Response example:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```

### POST /api/v1/promotional-offers

**Allowed role/access:** Authenticated

**Summary:** POST /api/v1/promotional-offers

**Request payload example:**

```json
{
  "itemId": "string",
  "title": "string",
  "description": "string",
  "discountType": "string",
  "discountValue": 0,
  "startDate": "string",
  "endDate": "string",
  "eligibilityRules": "string",
  "isActive": true,
  "providerId": "string",
  "approvalStatus": "string"
}
```

**Response example:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```

### GET /api/v1/promotional-offers/{id}

**Allowed role/access:** Authenticated

**Summary:** GET /api/v1/promotional-offers/{id}

**Parameters:**

- `id` (path, required)

**Request payload example:**

```text
None
```

**Response example:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```

### PATCH /api/v1/promotional-offers/{id}

**Allowed role/access:** Authenticated

**Summary:** PATCH /api/v1/promotional-offers/{id}

**Parameters:**

- `id` (path, required)

**Request payload example:**

```json
{
  "title": "string",
  "description": "string",
  "discountType": "string",
  "discountValue": 0,
  "startDate": "string",
  "endDate": "string",
  "eligibilityRules": "string",
  "isActive": true
}
```

**Response example:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```

### DELETE /api/v1/promotional-offers/{id}

**Allowed role/access:** Authenticated

**Summary:** DELETE /api/v1/promotional-offers/{id}

**Parameters:**

- `id` (path, required)

**Request payload example:**

```text
None
```

**Response example:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```

### PATCH /api/v1/promotional-offers/{id}/approve

**Allowed role/access:** Authenticated

**Summary:** PATCH /api/v1/promotional-offers/{id}/approve

**Parameters:**

- `id` (path, required)

**Request payload example:**

```json
{
  "comment": "string",
  "notifyProvider": true
}
```

**Response example:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```

### PATCH /api/v1/promotional-offers/{id}/reject

**Allowed role/access:** Authenticated

**Summary:** PATCH /api/v1/promotional-offers/{id}/reject

**Parameters:**

- `id` (path, required)

**Request payload example:**

```json
{
  "reason": "string",
  "comment": "string",
  "notifyProvider": true
}
```

**Response example:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```

### PATCH /api/v1/promotional-offers/{id}/status

**Allowed role/access:** Authenticated

**Summary:** PATCH /api/v1/promotional-offers/{id}/status

**Parameters:**

- `id` (path, required)

**Request payload example:**

```json
{
  "isActive": true,
  "reason": "string"
}
```

**Response example:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```


## 02 Admin - Referral Settings

### GET /api/v1/referral-settings

**Allowed role/access:** SUPER_ADMIN, ADMIN

**Summary:** Fetch referral settings

**Description:** SUPER_ADMIN or ADMIN with referralSettings.read. Customer referral APIs consume these settings. Pending referrals use the settings snapshot stored at referral creation.

**Request payload example:**

```text
None
```

**Response example:**

```json
{
  "success": true,
  "data": {
    "isActive": true,
    "referrerRewardAmount": 25,
    "newUserRewardAmount": 10,
    "rewardCurrency": "USD",
    "minimumTransactionAmount": 50,
    "referralExpirationValue": 30,
    "referralExpirationUnit": "DAYS",
    "allowSelfReferrals": false,
    "qualificationRule": "FIRST_SUCCESSFUL_PURCHASE",
    "updatedAt": "2026-05-09T10:00:00.000Z"
  },
  "message": "Referral settings fetched successfully."
}
```

### PATCH /api/v1/referral-settings

**Allowed role/access:** SUPER_ADMIN, ADMIN

**Summary:** Update referral settings

**Description:** SUPER_ADMIN only. Changes apply to future referral snapshots and do not recalculate already-earned rewards.

**Request payload example:**

```json
{
  "referrerRewardAmount": 25,
  "newUserRewardAmount": 10,
  "rewardCurrency": "USD",
  "minimumTransactionAmount": 50,
  "referralExpirationValue": 30,
  "referralExpirationUnit": "DAYS",
  "allowSelfReferrals": false,
  "qualificationRule": "FIRST_SUCCESSFUL_PURCHASE"
}
```

**Response example:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```

### POST /api/v1/referral-settings/activate

**Allowed role/access:** SUPER_ADMIN, ADMIN

**Summary:** Activate referral program

**Description:** SUPER_ADMIN only. Existing earned rewards remain redeemable.

**Request payload example:**

```text
None
```

**Response example:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```

### POST /api/v1/referral-settings/deactivate

**Allowed role/access:** SUPER_ADMIN, ADMIN

**Summary:** Deactivate referral program

**Description:** SUPER_ADMIN only. New referral rewards are blocked while inactive; earned rewards remain redeemable.

**Request payload example:**

```json
{
  "reason": "Temporarily paused by Super Admin."
}
```

**Response example:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```

### GET /api/v1/referral-settings/stats

**Allowed role/access:** SUPER_ADMIN, ADMIN

**Summary:** Fetch referral stats

**Description:** SUPER_ADMIN or ADMIN with referralSettings.read.

**Request payload example:**

```text
None
```

**Response example:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```

### GET /api/v1/referral-settings/audit-logs

**Allowed role/access:** SUPER_ADMIN, ADMIN

**Summary:** List referral settings audit logs

**Description:** SUPER_ADMIN only.

**Parameters:**

- `page` (query, optional)
- `limit` (query, optional)
- `fromDate` (query, optional)
- `toDate` (query, optional)

**Request payload example:**

```text
None
```

**Response example:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```


## 02 Admin - Media Upload Policy

### GET /api/v1/media-upload-policy

**Allowed role/access:** SUPER_ADMIN, ADMIN

**Summary:** Fetch global media upload policy

**Description:** SUPER_ADMIN or ADMIN with mediaPolicy.read. uploads/presigned-url enforces this policy before issuing upload URLs.

**Request payload example:**

```text
None
```

**Response example:**

```json
{
  "success": true,
  "data": {
    "allowedFileTypes": {
      "jpeg": true,
      "jpg": true,
      "png": true,
      "gif": false,
      "mp4": true,
      "mov": true,
      "mp3": true,
      "wav": false,
      "svg": false
    },
    "maxImageSizeMb": 10,
    "maxVideoSizeMb": 500,
    "maxAudioSizeMb": 50,
    "scanUploads": true,
    "blockSvgUploads": true,
    "updatedAt": "2026-05-09T10:00:00.000Z",
    "updatedBy": {
      "id": "admin_id",
      "name": "Alex Rivera"
    }
  },
  "message": "Media upload policy fetched successfully."
}
```

### PATCH /api/v1/media-upload-policy

**Allowed role/access:** SUPER_ADMIN, ADMIN

**Summary:** Update global media upload policy

**Description:** SUPER_ADMIN only. Does not expose AWS secrets or bucket credentials.

**Request payload example:**

```json
{
  "allowedFileTypes": "string",
  "maxImageSizeMb": 10,
  "maxVideoSizeMb": 500,
  "maxAudioSizeMb": 50,
  "scanUploads": true,
  "blockSvgUploads": true
}
```

**Response example:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```

### GET /api/v1/media-upload-policy/audit-logs

**Allowed role/access:** SUPER_ADMIN, ADMIN

**Summary:** List media upload policy audit logs

**Description:** SUPER_ADMIN only.

**Parameters:**

- `page` (query, optional)
- `limit` (query, optional)
- `fromDate` (query, optional)
- `toDate` (query, optional)

**Request payload example:**

```text
None
```

**Response example:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```


## 02 Admin - Audit Logs

### GET /api/v1/audit-logs/export

**Allowed role/access:** Authenticated

**Summary:** GET /api/v1/audit-logs/export

**Parameters:**

- `page` (query, optional)
- `limit` (query, optional)
- `actorId` (query, optional)
- `targetId` (query, optional)
- `action` (query, optional)
- `targetType` (query, optional)
- `module` (query, optional)
- `from` (query, optional)
- `to` (query, optional)
- `sortBy` (query, optional)
- `sortOrder` (query, optional)

**Request payload example:**

```text
None
```

**Response example:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```

### GET /api/v1/audit-logs

**Allowed role/access:** Authenticated

**Summary:** GET /api/v1/audit-logs

**Parameters:**

- `page` (query, optional)
- `limit` (query, optional)
- `actorId` (query, optional)
- `targetId` (query, optional)
- `action` (query, optional)
- `targetType` (query, optional)
- `module` (query, optional)
- `from` (query, optional)
- `to` (query, optional)
- `sortBy` (query, optional)
- `sortOrder` (query, optional)

**Request payload example:**

```text
None
```

**Response example:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```

### GET /api/v1/audit-logs/{id}

**Allowed role/access:** Authenticated

**Summary:** GET /api/v1/audit-logs/{id}

**Parameters:**

- `id` (path, required)

**Request payload example:**

```text
None
```

**Response example:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```


## 03 Provider - Inventory

### GET /api/v1/provider/inventory

**Allowed role/access:** PROVIDER

**Summary:** List provider inventory items

**Description:** PROVIDER only. Returns only inventory owned by the authenticated provider.

**Parameters:**

- `page` (query, optional)
- `limit` (query, optional)
- `search` (query, optional)
- `status` (query, optional)
- `categoryId` (query, optional)
- `sortBy` (query, optional)
- `sortOrder` (query, optional)

**Request payload example:**

```text
None
```

**Response example:**

```json
{
  "success": true,
  "data": [
    {
      "id": "gift_id",
      "name": "Luxury Perfume",
      "price": 99.99,
      "currency": "PKR",
      "stockQuantity": 50,
      "status": "ACTIVE",
      "moderationStatus": "APPROVED",
      "isAvailable": true,
      "category": {
        "id": "category_id",
        "name": "Perfumes"
      },
      "variants": [
        {
          "id": "variant_id",
          "name": "50ml",
          "price": 129.99,
          "stockQuantity": 20,
          "isDefault": true
        }
      ]
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "totalPages": 1
  },
  "message": "Provider inventory fetched successfully"
}
```

### POST /api/v1/provider/inventory

**Allowed role/access:** PROVIDER

**Summary:** Create provider inventory item with optional nested variants

**Description:** PROVIDER only. providerId is derived from JWT; provider cannot approve/publish variants directly.

**Request payload example:**

```json
{
  "name": "string",
  "description": "string",
  "shortDescription": "string",
  "price": 0,
  "currency": "string",
  "stockQuantity": 0,
  "sku": "string",
  "categoryId": "string",
  "imageUrls": [],
  "isAvailable": true,
  "variants": []
}
```

**Response example:**

```json
{
  "success": true,
  "data": {
    "id": "gift_id",
    "name": "Luxury Perfume",
    "price": 99.99,
    "currency": "PKR",
    "stockQuantity": 50,
    "status": "ACTIVE",
    "moderationStatus": "PENDING",
    "variants": [
      {
        "id": "variant_id",
        "name": "50ml",
        "price": 129.99,
        "originalPrice": 159.99,
        "stockQuantity": 20,
        "sku": "PERFUME-50ML",
        "isDefault": true,
        "isActive": true
      }
    ]
  },
  "message": "Inventory item created successfully"
}
```

### GET /api/v1/provider/inventory/stats

**Allowed role/access:** Authenticated

**Summary:** Fetch provider inventory stats

**Request payload example:**

```text
None
```

**Response example:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```

### GET /api/v1/provider/inventory/lookup

**Allowed role/access:** Authenticated

**Summary:** Lookup active approved provider inventory items

**Request payload example:**

```text
None
```

**Response example:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```

### GET /api/v1/provider/inventory/{id}

**Allowed role/access:** Authenticated

**Summary:** Fetch own provider inventory item details

**Parameters:**

- `id` (path, required)

**Request payload example:**

```text
None
```

**Response example:**

```json
{
  "success": true,
  "data": {
    "id": "gift_id",
    "name": "Luxury Perfume",
    "description": "Long-lasting premium fragrance.",
    "price": 99.99,
    "currency": "PKR",
    "stockQuantity": 50,
    "status": "ACTIVE",
    "moderationStatus": "APPROVED",
    "imageUrls": [
      "https://cdn.yourdomain.com/gift-images/perfume.png"
    ],
    "variants": [
      {
        "id": "variant_id",
        "name": "50ml",
        "price": 129.99,
        "originalPrice": 159.99,
        "stockQuantity": 20,
        "sku": "PERFUME-50ML",
        "isDefault": true,
        "isActive": true
      }
    ]
  },
  "message": "Inventory item fetched successfully"
}
```

### PATCH /api/v1/provider/inventory/{id}

**Allowed role/access:** Authenticated

**Summary:** Update own provider inventory item and upsert variants

**Description:** Variant id must belong to the provider-owned gift. Material variant changes re-submit approved gifts for moderation; stock-only changes do not.

**Parameters:**

- `id` (path, required)

**Request payload example:**

```json
{
  "name": "string",
  "description": "string",
  "shortDescription": "string",
  "price": 0,
  "currency": "string",
  "stockQuantity": 0,
  "sku": "string",
  "categoryId": "string",
  "imageUrls": [],
  "isAvailable": true,
  "replaceVariants": false,
  "variants": []
}
```

**Response example:**

```json
{
  "success": true,
  "data": {
    "id": "gift_id",
    "name": "Luxury Perfume",
    "variants": [
      {
        "id": "variant_id",
        "name": "50ml",
        "price": 129.99,
        "stockQuantity": 20,
        "isDefault": true,
        "isActive": true
      }
    ]
  },
  "message": "Inventory item updated successfully"
}
```

### DELETE /api/v1/provider/inventory/{id}

**Allowed role/access:** Authenticated

**Summary:** Soft-delete own inventory item

**Parameters:**

- `id` (path, required)

**Request payload example:**

```text
None
```

**Response example:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```

### PATCH /api/v1/provider/inventory/{id}/availability

**Allowed role/access:** Authenticated

**Summary:** Update own inventory availability

**Parameters:**

- `id` (path, required)

**Request payload example:**

```json
{
  "isAvailable": true
}
```

**Response example:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```


## 03 Provider - Promotional Offers

### GET /api/v1/provider/offers

**Allowed role/access:** Authenticated

**Summary:** GET /api/v1/provider/offers

**Parameters:**

- `page` (query, optional)
- `limit` (query, optional)
- `search` (query, optional)
- `status` (query, optional)
- `itemId` (query, optional)
- `sortBy` (query, optional)
- `sortOrder` (query, optional)

**Request payload example:**

```text
None
```

**Response example:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```

### POST /api/v1/provider/offers

**Allowed role/access:** Authenticated

**Summary:** POST /api/v1/provider/offers

**Request payload example:**

```json
{
  "itemId": "string",
  "title": "string",
  "description": "string",
  "discountType": "string",
  "discountValue": 0,
  "startDate": "string",
  "endDate": "string",
  "eligibilityRules": "string",
  "isActive": true
}
```

**Response example:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```

### GET /api/v1/provider/offers/{id}

**Allowed role/access:** Authenticated

**Summary:** GET /api/v1/provider/offers/{id}

**Parameters:**

- `id` (path, required)

**Request payload example:**

```text
None
```

**Response example:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```

### PATCH /api/v1/provider/offers/{id}

**Allowed role/access:** Authenticated

**Summary:** PATCH /api/v1/provider/offers/{id}

**Parameters:**

- `id` (path, required)

**Request payload example:**

```json
{
  "title": "string",
  "description": "string",
  "discountType": "string",
  "discountValue": 0,
  "startDate": "string",
  "endDate": "string",
  "eligibilityRules": "string",
  "isActive": true
}
```

**Response example:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```

### DELETE /api/v1/provider/offers/{id}

**Allowed role/access:** Authenticated

**Summary:** DELETE /api/v1/provider/offers/{id}

**Parameters:**

- `id` (path, required)

**Request payload example:**

```text
None
```

**Response example:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```

### PATCH /api/v1/provider/offers/{id}/status

**Allowed role/access:** Authenticated

**Summary:** PATCH /api/v1/provider/offers/{id}/status

**Parameters:**

- `id` (path, required)

**Request payload example:**

```json
{
  "isActive": true,
  "reason": "string"
}
```

**Response example:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```


## 03 Provider - Orders

### GET /api/v1/provider/orders

**Allowed role/access:** PROVIDER

**Summary:** List own assigned provider orders

**Description:** PROVIDER only. Returns only orders assigned to the authenticated providerId. Default status filter is PENDING.

**Parameters:**

- `page` (query, optional)
- `limit` (query, optional)
- `status` (query, optional)
- `search` (query, optional)
- `fromDate` (query, optional)
- `toDate` (query, optional)
- `sortBy` (query, optional)
- `sortOrder` (query, optional)

**Request payload example:**

```text
None
```

**Response example:**

```json
{
  "success": true,
  "data": [
    {
      "id": "provider_order_id",
      "orderId": "order_id",
      "orderNumber": "ORD-10293",
      "status": "PENDING",
      "paymentStatus": "SUCCEEDED",
      "customer": {
        "name": "Sarah Jenkins",
        "phone": "+15551234567"
      },
      "itemPreview": [
        {
          "name": "Premium Sneakers",
          "imageUrl": "https://cdn.yourdomain.com/gifts/sneaker.png"
        }
      ],
      "itemCount": 3,
      "totalPayout": 142,
      "currency": "PKR",
      "createdAt": "2026-10-24T10:45:00.000Z",
      "receivedAgoText": "5m ago"
    }
  ],
  "message": "Provider orders fetched successfully."
}
```

### GET /api/v1/provider/orders/history

**Allowed role/access:** PROVIDER

**Summary:** List own provider order history

**Description:** PROVIDER only. Uses ProviderOrder records scoped to the authenticated provider. Status tabs map to provider order statuses.

**Parameters:**

- `page` (query, optional)
- `limit` (query, optional)
- `status` (query, optional)
- `search` (query, optional)
- `fromDate` (query, optional)
- `toDate` (query, optional)
- `sortBy` (query, optional)
- `sortOrder` (query, optional)

**Request payload example:**

```text
None
```

**Response example:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```

### GET /api/v1/provider/orders/performance

**Allowed role/access:** PROVIDER

**Summary:** Fetch own provider order performance

**Description:** PROVIDER only. Completion rate uses completed / non-cancelled own provider orders.

**Parameters:**

- `range` (query, optional)
- `fromDate` (query, optional)
- `toDate` (query, optional)

**Request payload example:**

```text
None
```

**Response example:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```

### GET /api/v1/provider/orders/analytics/revenue

**Allowed role/access:** PROVIDER

**Summary:** Fetch own provider revenue analytics

**Description:** PROVIDER only. Revenue uses provider totalPayout for paid active/completed provider orders.

**Parameters:**

- `range` (query, optional)
- `fromDate` (query, optional)
- `toDate` (query, optional)

**Request payload example:**

```text
None
```

**Response example:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```

### GET /api/v1/provider/orders/analytics/ratings

**Allowed role/access:** PROVIDER

**Summary:** Fetch own provider ratings analytics

**Description:** PROVIDER only. Returns stable zero values until reviews module is available.

**Request payload example:**

```text
None
```

**Response example:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```

### GET /api/v1/provider/orders/recent

**Allowed role/access:** PROVIDER

**Summary:** List recent own provider orders

**Description:** PROVIDER only. Defaults to 5 latest orders.

**Parameters:**

- `limit` (query, optional)

**Request payload example:**

```text
None
```

**Response example:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```

### GET /api/v1/provider/orders/export

**Allowed role/access:** PROVIDER

**Summary:** Export own provider orders as CSV

**Description:** PROVIDER only. Export is scoped to logged-in provider orders.

**Parameters:**

- `status` (query, optional)
- `fromDate` (query, optional)
- `toDate` (query, optional)
- `format` (query, optional)

**Request payload example:**

```text
None
```

**Response example:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```

### GET /api/v1/provider/orders/summary

**Allowed role/access:** PROVIDER

**Summary:** Fetch own provider order summary

**Description:** Route intentionally declared before :id. PROVIDER only.

**Parameters:**

- `fromDate` (query, optional)
- `toDate` (query, optional)

**Request payload example:**

```text
None
```

**Response example:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```

### GET /api/v1/provider/orders/reject-reasons

**Allowed role/access:** Authenticated

**Summary:** List provider order reject reasons

**Description:** Route intentionally declared before :id.

**Request payload example:**

```text
None
```

**Response example:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```

### PATCH /api/v1/provider/orders/{id}/status

**Allowed role/access:** PROVIDER

**Summary:** Update own provider order fulfillment status

**Description:** PROVIDER only. Enforces ownership, valid transitions, paid-order fulfillment checks, timeline entries, and customer notifications.

**Parameters:**

- `id` (path, required)

**Request payload example:**

```json
{
  "status": "SHIPPED",
  "note": "Package handed over to courier.",
  "trackingNumber": "FDX-123456",
  "carrier": "FedEx",
  "estimatedDeliveryAt": "2026-10-26T10:00:00.000Z"
}
```

**Response example:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```

### GET /api/v1/provider/orders/{id}/timeline

**Allowed role/access:** PROVIDER

**Summary:** Fetch own provider order timeline

**Description:** PROVIDER only. Timeline is scoped to the authenticated provider order.

**Parameters:**

- `id` (path, required)

**Request payload example:**

```text
None
```

**Response example:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```

### GET /api/v1/provider/orders/{id}/checklist

**Allowed role/access:** PROVIDER

**Summary:** Fetch own provider order checklist

**Description:** PROVIDER only. Checklist is operational and does not change status automatically.

**Parameters:**

- `id` (path, required)

**Request payload example:**

```text
None
```

**Response example:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```

### PATCH /api/v1/provider/orders/{id}/checklist

**Allowed role/access:** PROVIDER

**Summary:** Update own provider order checklist

**Description:** PROVIDER only. Checklist updates do not directly change order status.

**Parameters:**

- `id` (path, required)

**Request payload example:**

```json
{
  "itemsPacked": true,
  "giftMessageAttached": true,
  "addressVerified": true,
  "customerContactChecked": true,
  "readyForCourier": false,
  "customItems": [
    {
      "id": "checklist_item_id",
      "label": "Include gift wrap",
      "isCompleted": true
    }
  ]
}
```

**Response example:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```

### POST /api/v1/provider/orders/{id}/message-buyer

**Allowed role/access:** PROVIDER

**Summary:** Message buyer for own provider order

**Description:** PROVIDER only. Creates an order message and customer notification; SMS is placeholder only.

**Parameters:**

- `id` (path, required)

**Request payload example:**

```json
{
  "message": "Your order is being prepared and will be shipped soon.",
  "channel": "IN_APP"
}
```

**Response example:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```

### GET /api/v1/provider/orders/{id}

**Allowed role/access:** PROVIDER

**Summary:** Fetch own provider order details

**Description:** PROVIDER only. Does not expose customer card/payment secrets or admin-only order fields.

**Parameters:**

- `id` (path, required)

**Request payload example:**

```text
None
```

**Response example:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```

### POST /api/v1/provider/orders/{id}/accept

**Allowed role/access:** Authenticated

**Summary:** Accept own pending provider order

**Description:** Allowed transition: PENDING -> ACCEPTED. Creates timeline entry and customer notification.

**Parameters:**

- `id` (path, required)

**Request payload example:**

```json
{
  "note": "Order accepted and will be processed shortly."
}
```

**Response example:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```

### POST /api/v1/provider/orders/{id}/reject

**Allowed role/access:** Authenticated

**Summary:** Reject own pending provider order

**Description:** Allowed transition: PENDING -> REJECTED. Does not refund automatically; flags order for review/cancellation based on provider split count.

**Parameters:**

- `id` (path, required)

**Request payload example:**

```json
{
  "reason": "OUT_OF_STOCK",
  "comment": "The selected size is currently unavailable."
}
```

**Response example:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```


## 04 Gifts - Categories

### GET /api/v1/gift-categories/lookup

**Allowed role/access:** PUBLIC

**Summary:** Lookup active gift categories

**Description:** Public lookup under Gift Categories. Returns active category identifiers and media fields for lightweight selectors.

**Request payload example:**

```text
None
```

**Response example:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```

### POST /api/v1/gift-categories

**Allowed role/access:** Authenticated

**Summary:** Create gift category

**Description:** RBAC permission: giftCategories.create. Slug is auto-generated and unique. backgroundColor defaults to #F3E8FF; color remains a backward-compatible alias.

**Request payload example:**

```json
{
  "name": "string",
  "description": "string",
  "iconKey": "string",
  "color": "#8B5CF6",
  "backgroundColor": "#E9D5FF",
  "imageUrl": "https://<YOUR_PUBLIC_BUCKET_OR_CDN_URL>/gift-category-images/perfumes.png",
  "sortOrder": 0,
  "isActive": true
}
```

**Response example:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```

### GET /api/v1/gift-categories

**Allowed role/access:** Authenticated

**Summary:** List gift categories

**Description:** RBAC permission: giftCategories.read. Returns soft-delete-filtered categories with gift counts and category media fields.

**Parameters:**

- `page` (query, optional)
- `limit` (query, optional)
- `search` (query, optional)
- `isActive` (query, optional)
- `sortBy` (query, optional)
- `sortOrder` (query, optional)

**Request payload example:**

```text
None
```

**Response example:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```

### GET /api/v1/gift-categories/stats

**Allowed role/access:** Authenticated

**Summary:** Fetch gift category stats

**Description:** RBAC permission: giftCategories.read. Returns admin category inventory counters.

**Request payload example:**

```text
None
```

**Response example:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```

### GET /api/v1/gift-categories/{id}

**Allowed role/access:** Authenticated

**Summary:** Fetch gift category details

**Description:** RBAC permission: giftCategories.read. Includes backgroundColor and imageUrl for customer app design support.

**Parameters:**

- `id` (path, required)

**Request payload example:**

```text
None
```

**Response example:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```

### PATCH /api/v1/gift-categories/{id}

**Allowed role/access:** Authenticated

**Summary:** Update gift category

**Description:** RBAC permission: giftCategories.update. Slug is regenerated when name changes. Soft-deleted categories are not updated.

**Parameters:**

- `id` (path, required)

**Request payload example:**

```json
{
  "name": "string",
  "description": "string",
  "iconKey": "string",
  "color": "#8B5CF6",
  "backgroundColor": "#E9D5FF",
  "imageUrl": "https://<YOUR_PUBLIC_BUCKET_OR_CDN_URL>/gift-category-images/perfumes.png",
  "sortOrder": 0,
  "isActive": true
}
```

**Response example:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```

### DELETE /api/v1/gift-categories/{id}

**Allowed role/access:** Authenticated

**Summary:** Soft-delete gift category

**Description:** RBAC permission: giftCategories.delete. Categories with attached gifts cannot be deleted; delete writes an audit log.

**Parameters:**

- `id` (path, required)

**Request payload example:**

```text
None
```

**Response example:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```


## 04 Gifts - Management

### POST /api/v1/gifts

**Allowed role/access:** SUPER_ADMIN, ADMIN

**Summary:** Create admin gift with optional nested variants

**Description:** SUPER_ADMIN/ADMIN with gifts.create. Nested variants are created in the same transaction and stored in GiftVariant.

**Request payload example:**

```json
{
  "name": "string",
  "description": "string",
  "shortDescription": "string",
  "categoryId": "string",
  "providerId": "string",
  "price": 0,
  "currency": "USD",
  "stockQuantity": 0,
  "sku": "string",
  "imageUrls": [],
  "isPublished": true,
  "isFeatured": true,
  "tags": [],
  "moderationStatus": "string",
  "variants": []
}
```

**Response example:**

```json
{
  "success": true,
  "data": {
    "id": "gift_id",
    "name": "Luxury Perfume",
    "price": 99.99,
    "currency": "PKR",
    "stockQuantity": 50,
    "sku": "PERFUME-001",
    "variants": [
      {
        "id": "variant_id",
        "name": "50ml",
        "price": 129.99,
        "originalPrice": 159.99,
        "stockQuantity": 20,
        "sku": "PERFUME-50ML",
        "isPopular": true,
        "isDefault": true,
        "sortOrder": 2,
        "isActive": true
      }
    ]
  },
  "message": "Gift created successfully"
}
```

### GET /api/v1/gifts

**Allowed role/access:** SUPER_ADMIN, ADMIN

**Summary:** List admin gifts

**Description:** SUPER_ADMIN/ADMIN with gifts.read. Supports category/provider/status/moderation filters.

**Parameters:**

- `page` (query, optional)
- `limit` (query, optional)
- `search` (query, optional)
- `categoryId` (query, optional)
- `providerId` (query, optional)
- `status` (query, optional)
- `moderationStatus` (query, optional)
- `isPublished` (query, optional)
- `sortBy` (query, optional)
- `sortOrder` (query, optional)

**Request payload example:**

```text
None
```

**Response example:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```

### GET /api/v1/gifts/stats

**Allowed role/access:** Authenticated

**Summary:** Fetch gift inventory stats

**Request payload example:**

```text
None
```

**Response example:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```

### GET /api/v1/gifts/export

**Allowed role/access:** Authenticated

**Summary:** Export gift inventory

**Parameters:**

- `page` (query, optional)
- `limit` (query, optional)
- `search` (query, optional)
- `categoryId` (query, optional)
- `providerId` (query, optional)
- `status` (query, optional)
- `moderationStatus` (query, optional)
- `isPublished` (query, optional)
- `sortBy` (query, optional)
- `sortOrder` (query, optional)
- `format` (query, optional)

**Request payload example:**

```text
None
```

**Response example:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```

### GET /api/v1/gifts/{id}

**Allowed role/access:** Authenticated

**Summary:** Fetch admin gift details with variants

**Parameters:**

- `id` (path, required)

**Request payload example:**

```text
None
```

**Response example:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```

### PATCH /api/v1/gifts/{id}

**Allowed role/access:** Authenticated

**Summary:** Update admin gift and upsert nested variants

**Description:** If replaceVariants=true, omitted variants are soft-deleted. Only one default variant is allowed.

**Parameters:**

- `id` (path, required)

**Request payload example:**

```json
{
  "name": "string",
  "description": "string",
  "shortDescription": "string",
  "categoryId": "string",
  "providerId": "string",
  "price": 0,
  "currency": "USD",
  "stockQuantity": 0,
  "sku": "string",
  "imageUrls": [],
  "isPublished": true,
  "isFeatured": true,
  "tags": [],
  "replaceVariants": false,
  "variants": []
}
```

**Response example:**

```json
{
  "success": true,
  "data": {
    "id": "gift_id",
    "name": "Luxury Perfume Updated",
    "variants": [
      {
        "id": "variant_id",
        "name": "50ml",
        "price": 129.99,
        "originalPrice": 159.99,
        "stockQuantity": 20,
        "sku": "PERFUME-50ML",
        "isDefault": true,
        "isActive": true
      }
    ]
  },
  "message": "Gift updated successfully"
}
```

### DELETE /api/v1/gifts/{id}

**Allowed role/access:** Authenticated

**Summary:** Soft-delete gift

**Parameters:**

- `id` (path, required)

**Request payload example:**

```text
None
```

**Response example:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```

### PATCH /api/v1/gifts/{id}/status

**Allowed role/access:** Authenticated

**Summary:** Update gift status

**Parameters:**

- `id` (path, required)

**Request payload example:**

```json
{
  "status": "string",
  "reason": "string"
}
```

**Response example:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```


## 04 Gifts - Moderation

### GET /api/v1/gift-moderation

**Allowed role/access:** Authenticated

**Summary:** GET /api/v1/gift-moderation

**Parameters:**

- `page` (query, optional)
- `limit` (query, optional)
- `status` (query, optional)
- `search` (query, optional)
- `providerId` (query, optional)
- `view` (query, optional)
- `sortBy` (query, optional)
- `sortOrder` (query, optional)

**Request payload example:**

```text
None
```

**Response example:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```

### PATCH /api/v1/gift-moderation/{id}/approve

**Allowed role/access:** Authenticated

**Summary:** PATCH /api/v1/gift-moderation/{id}/approve

**Parameters:**

- `id` (path, required)

**Request payload example:**

```json
{
  "comment": "string",
  "publishNow": true,
  "notifyProvider": true
}
```

**Response example:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```

### PATCH /api/v1/gift-moderation/{id}/reject

**Allowed role/access:** Authenticated

**Summary:** PATCH /api/v1/gift-moderation/{id}/reject

**Parameters:**

- `id` (path, required)

**Request payload example:**

```json
{
  "reason": "string",
  "comment": "string",
  "notifyProvider": true
}
```

**Response example:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```

### PATCH /api/v1/gift-moderation/{id}/flag

**Allowed role/access:** Authenticated

**Summary:** PATCH /api/v1/gift-moderation/{id}/flag

**Parameters:**

- `id` (path, required)

**Request payload example:**

```json
{
  "reason": "string",
  "comment": "string"
}
```

**Response example:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```


## 05 Customer - Marketplace

### GET /api/v1/customer/home

**Allowed role/access:** REGISTERED_USER

**Summary:** Fetch customer app home

**Description:** REGISTERED_USER only. Returns safe marketplace categories, discounted gifts, default address, and upcoming reminder.

**Request payload example:**

```text
None
```

**Response example:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```

### GET /api/v1/customer/categories

**Allowed role/access:** REGISTERED_USER

**Summary:** List customer marketplace categories

**Description:** REGISTERED_USER only. Returns active categories that have available approved gifts.

**Request payload example:**

```text
None
```

**Response example:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```

### GET /api/v1/customer/gifts/discounted

**Allowed role/access:** REGISTERED_USER

**Summary:** List discounted customer gifts

**Description:** REGISTERED_USER only. Reuses marketplace gift filters with offerOnly=true.

**Parameters:**

- `page` (query, optional)
- `limit` (query, optional)
- `search` (query, optional)
- `categoryId` (query, optional)
- `categorySlug` (query, optional)
- `providerId` (query, optional)
- `offerOnly` (query, optional)
- `minPrice` (query, optional)
- `maxPrice` (query, optional)
- `minRating` (query, optional)
- `brand` (query, optional)
- `deliveryOption` (query, optional)
- `sortBy` (query, optional)

**Request payload example:**

```text
None
```

**Response example:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```

### GET /api/v1/customer/gifts/filter-options

**Allowed role/access:** REGISTERED_USER

**Summary:** Fetch marketplace gift filter options

**Description:** REGISTERED_USER only. Brands are derived from approved active provider business names.

**Request payload example:**

```text
None
```

**Response example:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```

### GET /api/v1/customer/gifts

**Allowed role/access:** REGISTERED_USER

**Summary:** List customer marketplace gifts

**Description:** REGISTERED_USER only. Only approved, published, active, in-stock gifts from approved active providers are returned. Active offers are calculated by the backend.

**Parameters:**

- `page` (query, optional)
- `limit` (query, optional)
- `search` (query, optional)
- `categoryId` (query, optional)
- `categorySlug` (query, optional)
- `providerId` (query, optional)
- `offerOnly` (query, optional)
- `minPrice` (query, optional)
- `maxPrice` (query, optional)
- `minRating` (query, optional)
- `brand` (query, optional)
- `deliveryOption` (query, optional)
- `sortBy` (query, optional)

**Request payload example:**

```text
None
```

**Response example:**

```json
{
  "success": true,
  "data": [
    {
      "id": "gift_id",
      "name": "Luxury Perfume",
      "price": 99.99,
      "currency": "PKR",
      "imageUrl": "https://cdn.yourdomain.com/gift-images/perfume.png",
      "rating": 4.8,
      "isWishlisted": false,
      "shortDescription": "Premium fragrance gift.",
      "reviewCount": 0,
      "stockQuantity": 50,
      "category": {
        "id": "gift_category_id",
        "name": "Perfumes",
        "slug": "perfumes"
      },
      "provider": {
        "id": "provider_id",
        "businessName": "Dcodax Gifts"
      },
      "deliveryOptions": [
        "SAME_DAY",
        "NEXT_DAY",
        "SCHEDULED"
      ],
      "activeOffer": null
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "totalPages": 1
  },
  "message": "Customer gifts fetched successfully"
}
```

### GET /api/v1/customer/gifts/{id}

**Allowed role/access:** REGISTERED_USER

**Summary:** Fetch customer-safe gift details

**Description:** REGISTERED_USER only. Hidden/admin-only gift records are never returned.

**Parameters:**

- `id` (path, required)

**Request payload example:**

```text
None
```

**Response example:**

```json
{
  "success": true,
  "data": {
    "id": "gift_id",
    "name": "Luxury Perfume",
    "description": "Long-lasting premium fragrance.",
    "shortDescription": "Premium fragrance gift.",
    "price": 99.99,
    "originalPrice": 99.99,
    "currency": "PKR",
    "imageUrls": [
      "https://cdn.yourdomain.com/gift-images/perfume.png"
    ],
    "rating": 4.8,
    "reviewCount": 0,
    "stockQuantity": 50,
    "sku": "PERFUME-001",
    "isWishlisted": false,
    "badges": [
      "AUTHENTIC"
    ],
    "category": {
      "id": "gift_category_id",
      "name": "Perfumes",
      "slug": "perfumes"
    },
    "provider": {
      "id": "provider_id",
      "businessName": "Dcodax Gifts",
      "rating": 4.8,
      "reviewCount": 0,
      "fulfillmentMethods": [
        "DELIVERY"
      ]
    },
    "variants": [
      {
        "id": "variant_id",
        "name": "50ml",
        "price": 129.99,
        "originalPrice": 159.99,
        "stockQuantity": 20,
        "sku": "PERFUME-50ML",
        "isPopular": true,
        "isDefault": true
      }
    ],
    "deliveryOptions": [
      "SAME_DAY",
      "NEXT_DAY",
      "SCHEDULED"
    ],
    "activeOffer": null
  },
  "message": "Gift details fetched successfully"
}
```


## 05 Customer - Wishlist

### GET /api/v1/customer/wishlist

**Allowed role/access:** REGISTERED_USER

**Summary:** List wishlist gifts

**Description:** REGISTERED_USER only. Returns customer-safe available gifts.

**Request payload example:**

```text
None
```

**Response example:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```

### POST /api/v1/customer/wishlist/{giftId}

**Allowed role/access:** REGISTERED_USER

**Summary:** Add gift to wishlist

**Description:** REGISTERED_USER only. Gift must be active, approved, published, and in stock. Duplicate wishlist entries are ignored.

**Parameters:**

- `giftId` (path, required)

**Request payload example:**

```text
None
```

**Response example:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```

### DELETE /api/v1/customer/wishlist/{giftId}

**Allowed role/access:** REGISTERED_USER

**Summary:** Remove gift from wishlist

**Description:** REGISTERED_USER only. Removes only the current customer wishlist row.

**Parameters:**

- `giftId` (path, required)

**Request payload example:**

```text
None
```

**Response example:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```


## 05 Customer - Addresses

### GET /api/v1/customer/addresses

**Allowed role/access:** REGISTERED_USER

**Summary:** List customer addresses

**Description:** REGISTERED_USER only. Customers can only view their own non-deleted addresses.

**Request payload example:**

```text
None
```

**Response example:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```

### POST /api/v1/customer/addresses

**Allowed role/access:** REGISTERED_USER

**Summary:** Create customer address

**Description:** REGISTERED_USER only. Maintains one default address per customer.

**Request payload example:**

```json
{
  "label": "Home",
  "fullName": "Sarah Khan",
  "phone": "+923001234567",
  "line1": "House 12, Street 4, F-8/2",
  "line2": "Near Centaurus Mall",
  "city": "Islamabad",
  "state": "Islamabad Capital Territory",
  "country": "Pakistan",
  "postalCode": "44000",
  "latitude": 33.6844,
  "longitude": 73.0479,
  "deliveryInstructions": "Leave at reception.",
  "isDefault": true
}
```

**Response example:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```

### GET /api/v1/customer/addresses/{id}

**Allowed role/access:** REGISTERED_USER

**Summary:** Fetch customer address

**Description:** REGISTERED_USER only. Address must belong to the current customer.

**Parameters:**

- `id` (path, required)

**Request payload example:**

```text
None
```

**Response example:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```

### PATCH /api/v1/customer/addresses/{id}

**Allowed role/access:** REGISTERED_USER

**Summary:** Update customer address

**Description:** REGISTERED_USER only. Maintains one default address per customer.

**Parameters:**

- `id` (path, required)

**Request payload example:**

```json
{
  "label": "Home",
  "fullName": "Sarah Khan",
  "phone": "+923001234567",
  "line1": "House 12, Street 4, F-8/2",
  "line2": "Near Centaurus Mall",
  "city": "Islamabad",
  "state": "Islamabad Capital Territory",
  "country": "Pakistan",
  "postalCode": "44000",
  "latitude": 33.6844,
  "longitude": 73.0479,
  "deliveryInstructions": "Leave at reception.",
  "isDefault": true
}
```

**Response example:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```

### DELETE /api/v1/customer/addresses/{id}

**Allowed role/access:** REGISTERED_USER

**Summary:** Soft-delete customer address

**Description:** REGISTERED_USER only. Address is soft deleted and removed from default status.

**Parameters:**

- `id` (path, required)

**Request payload example:**

```text
None
```

**Response example:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```

### PATCH /api/v1/customer/addresses/{id}/default

**Allowed role/access:** REGISTERED_USER

**Summary:** Set default customer address

**Description:** REGISTERED_USER only. Clears default flag from all other customer addresses.

**Parameters:**

- `id` (path, required)

**Request payload example:**

```text
None
```

**Response example:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```


## 05 Customer - Contacts

### GET /api/v1/customer/contacts

**Allowed role/access:** REGISTERED_USER

**Summary:** List customer contacts

**Description:** REGISTERED_USER only. Lists only contacts owned by the authenticated customer.

**Parameters:**

- `page` (query, optional)
- `limit` (query, optional)
- `search` (query, optional)
- `relationship` (query, optional)
- `sortBy` (query, optional)
- `sortOrder` (query, optional)

**Request payload example:**

```text
None
```

**Response example:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```

### POST /api/v1/customer/contacts

**Allowed role/access:** REGISTERED_USER

**Summary:** Create customer contact

**Description:** REGISTERED_USER only. Creates a personal gift contact owned by the authenticated customer. Requires at least one contact method: phone, email, or address.

**Request payload example:**

```json
{
  "name": "Mary Wilson",
  "relationship": "Mother",
  "phone": "+1234567890",
  "email": "mary@example.com",
  "address": "387 Merdina",
  "likes": "Glasses, makeup, dresses",
  "avatarUrl": "https://cdn.yourdomain.com/customer-contact-avatars/mary.png",
  "birthday": "1990-05-12",
  "notes": "Prefers elegant gifts."
}
```

**Response example:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```

### GET /api/v1/customer/contacts/{id}

**Allowed role/access:** REGISTERED_USER

**Summary:** Fetch customer contact

**Description:** REGISTERED_USER only. Contact must belong to the authenticated customer.

**Parameters:**

- `id` (path, required)

**Request payload example:**

```text
None
```

**Response example:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```

### PATCH /api/v1/customer/contacts/{id}

**Allowed role/access:** REGISTERED_USER

**Summary:** Update customer contact

**Description:** REGISTERED_USER only. Updates only contacts owned by the authenticated customer.

**Parameters:**

- `id` (path, required)

**Request payload example:**

```json
{
  "name": "Mary Wilson",
  "relationship": "Mother",
  "phone": "+1234567890",
  "email": "mary@example.com",
  "address": "387 Merdina",
  "likes": "Glasses, makeup, dresses",
  "avatarUrl": "https://cdn.yourdomain.com/customer-contact-avatars/mary.png",
  "birthday": "1990-05-12",
  "notes": "Prefers elegant gifts."
}
```

**Response example:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```

### DELETE /api/v1/customer/contacts/{id}

**Allowed role/access:** REGISTERED_USER

**Summary:** Soft-delete customer contact

**Description:** REGISTERED_USER only. Soft deletes only contacts owned by the authenticated customer.

**Parameters:**

- `id` (path, required)

**Request payload example:**

```text
None
```

**Response example:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```


## 05 Customer - Events

### GET /api/v1/customer/events

**Allowed role/access:** REGISTERED_USER

**Summary:** List customer events

**Description:** REGISTERED_USER only. Lists only events owned by the authenticated customer.

**Parameters:**

- `page` (query, optional)
- `limit` (query, optional)
- `search` (query, optional)
- `eventType` (query, optional)
- `fromDate` (query, optional)
- `toDate` (query, optional)
- `recipientId` (query, optional)
- `sortBy` (query, optional)
- `sortOrder` (query, optional)

**Request payload example:**

```text
None
```

**Response example:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```

### POST /api/v1/customer/events

**Allowed role/access:** REGISTERED_USER

**Summary:** Create customer event

**Description:** REGISTERED_USER only. recipientId must belong to the authenticated customer.

**Request payload example:**

```json
{
  "eventType": "BIRTHDAY",
  "title": "Sarah's Birthday",
  "recipientId": "cmf0contactmary001",
  "eventDate": "2026-01-31T00:00:00.000Z",
  "reminderTiming": "ON_THE_DAY",
  "reminderFrequency": "ONE_TIME",
  "customAlertTime": "09:00",
  "channels": [
    "EMAIL",
    "SMS"
  ],
  "notes": "Send a birthday gift.",
  "isActive": true
}
```

**Response example:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```

### GET /api/v1/customer/events/calendar

**Allowed role/access:** REGISTERED_USER

**Summary:** Fetch monthly calendar events

**Description:** REGISTERED_USER only. Returns marked dates and own events.

**Parameters:**

- `month` (query, required)
- `year` (query, required)
- `eventType` (query, optional)

**Request payload example:**

```text
None
```

**Response example:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```

### GET /api/v1/customer/events/upcoming

**Allowed role/access:** REGISTERED_USER

**Summary:** Fetch upcoming customer events

**Description:** REGISTERED_USER only. Defaults to 10 events within 30 days.

**Parameters:**

- `limit` (query, optional)
- `daysAhead` (query, optional)
- `eventType` (query, optional)

**Request payload example:**

```text
None
```

**Response example:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```

### GET /api/v1/customer/events/{id}/reminder-settings

**Allowed role/access:** REGISTERED_USER

**Summary:** Fetch event reminder settings

**Description:** REGISTERED_USER only. Event must belong to the authenticated customer.

**Parameters:**

- `id` (path, required)

**Request payload example:**

```text
None
```

**Response example:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```

### PATCH /api/v1/customer/events/{id}/reminder-settings

**Allowed role/access:** REGISTERED_USER

**Summary:** Update event reminder settings

**Description:** REGISTERED_USER only. Event must belong to the authenticated customer.

**Parameters:**

- `id` (path, required)

**Request payload example:**

```json
{
  "reminderFrequency": "YEARLY",
  "reminderTiming": "ONE_DAY_BEFORE",
  "customAlertTime": "09:00",
  "channels": {
    "push": true,
    "email": true,
    "sms": false
  }
}
```

**Response example:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```

### GET /api/v1/customer/events/{id}

**Allowed role/access:** REGISTERED_USER

**Summary:** Fetch customer event details

**Description:** REGISTERED_USER only. Event must belong to the authenticated customer.

**Parameters:**

- `id` (path, required)

**Request payload example:**

```text
None
```

**Response example:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```

### PATCH /api/v1/customer/events/{id}

**Allowed role/access:** REGISTERED_USER

**Summary:** Update customer event

**Description:** REGISTERED_USER only. Event and recipient contact must belong to the authenticated customer.

**Parameters:**

- `id` (path, required)

**Request payload example:**

```json
{
  "eventType": "ANNIVERSARY",
  "title": "Sarah's Anniversary",
  "recipientId": "cmf0contactmary001",
  "eventDate": "2026-01-31T00:00:00.000Z",
  "reminderTiming": "THREE_DAYS_BEFORE",
  "reminderFrequency": "YEARLY",
  "customAlertTime": "09:00",
  "channels": [
    "PUSH",
    "EMAIL"
  ],
  "notes": "Send flowers.",
  "isActive": true
}
```

**Response example:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```

### DELETE /api/v1/customer/events/{id}

**Allowed role/access:** REGISTERED_USER

**Summary:** Soft-delete customer event

**Description:** REGISTERED_USER only. Soft deletes only own event and cancels pending reminder jobs.

**Parameters:**

- `id` (path, required)

**Request payload example:**

```text
None
```

**Response example:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```


## 05 Customer - Cart

### GET /api/v1/customer/cart

**Allowed role/access:** REGISTERED_USER

**Summary:** Fetch active cart

**Description:** REGISTERED_USER only. Totals are backend calculated from price snapshots.

**Request payload example:**

```text
None
```

**Response example:**

```json
{
  "success": true,
  "data": {
    "id": "cart_id",
    "status": "ACTIVE",
    "items": [
      {
        "id": "cart_item_id",
        "giftId": "gift_id",
        "variantId": "variant_id",
        "name": "Luxury Perfume",
        "variantName": "50ml",
        "quantity": 1,
        "unitPrice": 129.99,
        "discountAmount": 20,
        "finalUnitPrice": 109.99,
        "lineTotal": 109.99,
        "imageUrl": "https://cdn.yourdomain.com/gift-images/perfume.png",
        "deliveryOption": "SAME_DAY",
        "recipient": {
          "contactId": "contact_id",
          "name": "Sarah Khan",
          "phone": "+923001234567",
          "addressId": "address_id"
        },
        "giftMessage": "Hope you love this special surprise!",
        "messageMediaUrls": [
          "https://cdn.yourdomain.com/gift-message-media/photo.png"
        ],
        "scheduledDeliveryAt": "2026-12-24T10:00:00.000Z"
      }
    ],
    "summary": {
      "subtotal": 129.99,
      "discountTotal": 20,
      "deliveryFee": 0,
      "tax": 0,
      "total": 109.99,
      "currency": "PKR"
    }
  },
  "message": "Cart fetched successfully"
}
```

### DELETE /api/v1/customer/cart

**Allowed role/access:** REGISTERED_USER

**Summary:** Clear active cart

**Description:** REGISTERED_USER only. Removes all items from active cart.

**Request payload example:**

```text
None
```

**Response example:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```

### POST /api/v1/customer/cart/items

**Allowed role/access:** REGISTERED_USER

**Summary:** Add item to cart

**Description:** REGISTERED_USER only. Backend calculates unit price, active offer discount, final price, subtotal, delivery fee placeholder, and total.

**Request payload example:**

```json
{
  "giftId": "cmf0giftroses001",
  "variantId": "cmf0variant50ml001",
  "quantity": 1,
  "deliveryOption": "SCHEDULED",
  "recipientContactId": "cmf0contactmary001",
  "recipientName": "Sarah Khan",
  "recipientPhone": "+923001234567",
  "recipientAddressId": "cmf0addresshome001",
  "eventId": "cmf0eventbirthday001",
  "giftMessage": "Hope you love this special surprise!",
  "messageMediaUrls": [
    "https://cdn.yourdomain.com/gift-message-media/photo.png"
  ],
  "scheduledDeliveryAt": "2026-06-01T12:00:00.000Z"
}
```

**Response example:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```

### PATCH /api/v1/customer/cart/items/{id}

**Allowed role/access:** REGISTERED_USER

**Summary:** Update cart item

**Description:** REGISTERED_USER only. Validates ownership through the active customer cart.

**Parameters:**

- `id` (path, required)

**Request payload example:**

```json
{
  "variantId": "cmf0variant100ml001",
  "quantity": 2,
  "deliveryOption": "NEXT_DAY",
  "recipientContactId": "cmf0contactmary001",
  "recipientName": "Sarah Khan",
  "recipientPhone": "+923001234567",
  "recipientAddressId": "cmf0addresshome001",
  "eventId": "cmf0eventbirthday001",
  "giftMessage": "Happy Birthday!",
  "messageMediaUrls": [
    "https://cdn.yourdomain.com/gift-message-media/video.mp4"
  ],
  "scheduledDeliveryAt": "2026-06-01T12:00:00.000Z"
}
```

**Response example:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```

### DELETE /api/v1/customer/cart/items/{id}

**Allowed role/access:** REGISTERED_USER

**Summary:** Delete cart item

**Description:** REGISTERED_USER only. Deletes only items in the current customer active cart.

**Parameters:**

- `id` (path, required)

**Request payload example:**

```text
None
```

**Response example:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```


## 05 Customer - Orders

### POST /api/v1/customer/orders

**Allowed role/access:** REGISTERED_USER

**Summary:** Create order from active cart

**Description:** REGISTERED_USER only. Prices are backend-calculated from cart/payment snapshots. STRIPE_CARD requires a successful owned paymentId; COD stays pending; PLACEHOLDER is for development only. Multiple providers are split into provider sub-orders.

**Request payload example:**

```json
{
  "cartId": "cmf0cartactive001",
  "paymentId": "cmf0payment001",
  "deliveryAddressId": "cmf0addresshome001",
  "paymentMethod": "COD"
}
```

**Response example:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```

### GET /api/v1/customer/orders

**Allowed role/access:** REGISTERED_USER

**Summary:** List customer orders

**Description:** REGISTERED_USER only. Returns orders owned by the current customer.

**Parameters:**

- `page` (query, optional)
- `limit` (query, optional)
- `type` (query, optional)
- `status` (query, optional)
- `fromDate` (query, optional)
- `toDate` (query, optional)

**Request payload example:**

```text
None
```

**Response example:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```

### GET /api/v1/customer/orders/{id}

**Allowed role/access:** REGISTERED_USER

**Summary:** Fetch customer order

**Description:** REGISTERED_USER only. Order must belong to the current customer.

**Parameters:**

- `id` (path, required)

**Request payload example:**

```text
None
```

**Response example:**

```json
{
  "success": true,
  "data": {
    "id": "order_id",
    "orderNumber": "ORD-1760000000000",
    "status": "CONFIRMED",
    "paymentStatus": "SUCCEEDED",
    "paymentMethod": "STRIPE_CARD",
    "recipient": {
      "name": "Sarah Khan",
      "email": null,
      "phone": "+923001234567",
      "avatarUrl": null
    },
    "deliveryDate": "2026-12-24T10:00:00.000Z",
    "occasion": null,
    "giftMessage": "Hope you love this special surprise!",
    "items": [
      {
        "giftId": "gift_id",
        "name": "Luxury Perfume",
        "variantName": "50ml",
        "quantity": 1,
        "imageUrl": "https://cdn.yourdomain.com/gift-images/perfume.png",
        "total": 109.99
      }
    ],
    "summary": {
      "subtotal": 129.99,
      "discountTotal": 20,
      "deliveryFee": 0,
      "tax": 0,
      "total": 109.99,
      "currency": "PKR"
    }
  },
  "message": "Order fetched successfully."
}
```


## 05 Customer - Recurring Payments

### GET /api/v1/customer/recurring-payments

**Allowed role/access:** REGISTERED_USER

**Summary:** List own recurring payments

**Description:** REGISTERED_USER only. Returns recurring money/gift payment subscriptions owned by the logged-in customer.

**Parameters:**

- `page` (query, optional)
- `limit` (query, optional)
- `search` (query, optional)
- `status` (query, optional)
- `frequency` (query, optional)
- `recipientContactId` (query, optional)
- `sortBy` (query, optional)
- `sortOrder` (query, optional)

**Request payload example:**

```text
None
```

**Response example:**

```json
{
  "success": true,
  "data": [
    {
      "id": "recurring_payment_id",
      "title": "Sarah's Birthday",
      "recipient": {
        "id": "contact_id",
        "name": "Sarah Johnson",
        "email": "sarah.j@example.com",
        "avatarUrl": "https://cdn.yourdomain.com/customer-contact-avatars/sarah.png"
      },
      "amount": 50,
      "currency": "PKR",
      "frequency": "MONTHLY",
      "nextBillingAt": "2026-03-15T09:00:00.000Z",
      "status": "ACTIVE",
      "message": "Monthly flowers",
      "createdAt": "2026-05-09T10:00:00.000Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "totalPages": 1
  },
  "message": "Recurring payments fetched successfully."
}
```

### POST /api/v1/customer/recurring-payments

**Allowed role/access:** REGISTERED_USER

**Summary:** Create recurring payment

**Description:** REGISTERED_USER only. Recipient contact and saved Stripe payment method must both belong to the logged-in customer. Stripe card recurring payments require a saved payment method.

**Request payload example:**

```json
{
  "amount": 100,
  "currency": "PKR",
  "frequency": "WEEKLY",
  "schedule": "string",
  "recipientContactId": "contact_id",
  "message": "Hope you love this special surprise!",
  "messageMediaUrls": [
    "https://cdn.yourdomain.com/gift-message-media/photo.png"
  ],
  "paymentMethod": "STRIPE_CARD",
  "stripePaymentMethodId": "pm_xxx",
  "startDate": "2026-05-10T00:00:00.000Z",
  "endDate": null,
  "autoSend": true
}
```

**Response example:**

```json
{
  "success": true,
  "data": {
    "id": "recurring_payment_id",
    "amount": 100,
    "currency": "PKR",
    "frequency": "WEEKLY",
    "nextBillingAt": "2026-05-12T09:00:00.000Z",
    "status": "ACTIVE"
  },
  "message": "Recurring payment created successfully."
}
```

### GET /api/v1/customer/recurring-payments/summary

**Allowed role/access:** Authenticated

**Summary:** Fetch recurring payment summary counts

**Description:** Must stay before /customer/recurring-payments/:id route.

**Request payload example:**

```text
None
```

**Response example:**

```json
{
  "success": true,
  "data": {
    "total": 5,
    "active": 3,
    "paused": 1,
    "cancelled": 1,
    "failed": 0
  },
  "message": "Recurring payment summary fetched successfully."
}
```

### GET /api/v1/customer/recurring-payments/{id}

**Allowed role/access:** REGISTERED_USER

**Summary:** Fetch own recurring payment details

**Description:** REGISTERED_USER only. Customer cannot access another user’s recurring payment.

**Parameters:**

- `id` (path, required)

**Request payload example:**

```text
None
```

**Response example:**

```json
{
  "success": true,
  "data": {
    "id": "recurring_payment_id",
    "title": "Monthly Flowers",
    "recipient": {
      "id": "contact_id",
      "name": "Sarah Johnson",
      "email": "sarah.j@example.com",
      "avatarUrl": "https://cdn.yourdomain.com/customer-contact-avatars/sarah.png"
    },
    "amount": 50,
    "currency": "PKR",
    "frequency": "MONTHLY",
    "nextBillingAt": "2026-03-15T09:00:00.000Z",
    "status": "ACTIVE",
    "message": "Fresh seasonal bouquet delivered to her doorstep every month",
    "messageMediaUrls": [],
    "paymentMethod": {
      "type": "STRIPE_CARD",
      "brand": "visa",
      "last4": "4242",
      "expiryMonth": 12,
      "expiryYear": 2026
    },
    "schedule": {
      "frequency": "MONTHLY",
      "dayOfMonth": 15,
      "time": "09:00",
      "timezone": "Asia/Karachi"
    },
    "createdAt": "2026-05-09T10:00:00.000Z"
  },
  "message": "Recurring payment fetched successfully."
}
```

### PATCH /api/v1/customer/recurring-payments/{id}

**Allowed role/access:** Authenticated

**Summary:** Update own recurring payment

**Description:** Cannot edit CANCELLED recurring payments. Changes apply from the next billing cycle and nextBillingAt is recalculated.

**Parameters:**

- `id` (path, required)

**Request payload example:**

```json
{
  "amount": 50,
  "frequency": "MONTHLY",
  "schedule": "string",
  "message": "Fresh flowers every month.",
  "messageMediaUrls": [],
  "stripePaymentMethodId": "pm_xxx"
}
```

**Response example:**

```json
{
  "success": true,
  "data": {
    "id": "recurring_payment_id",
    "status": "ACTIVE",
    "nextBillingAt": "2026-03-15T09:00:00.000Z"
  },
  "message": "Recurring payment updated successfully. Changes will apply from the next billing cycle."
}
```

### POST /api/v1/customer/recurring-payments/{id}/pause

**Allowed role/access:** Authenticated

**Summary:** Pause own active recurring payment

**Parameters:**

- `id` (path, required)

**Request payload example:**

```json
{
  "reason": "User paused recurring payment."
}
```

**Response example:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```

### POST /api/v1/customer/recurring-payments/{id}/resume

**Allowed role/access:** Authenticated

**Summary:** Resume own paused recurring payment

**Parameters:**

- `id` (path, required)

**Request payload example:**

```text
None
```

**Response example:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```

### POST /api/v1/customer/recurring-payments/{id}/cancel

**Allowed role/access:** Authenticated

**Summary:** Cancel own recurring payment

**Description:** IMMEDIATELY cancels future processing. AFTER_CURRENT_BILLING_CYCLE sets cancelAtPeriodEnd and cancelAt.

**Parameters:**

- `id` (path, required)

**Request payload example:**

```json
{
  "cancelMode": "IMMEDIATELY",
  "reason": "No longer needed."
}
```

**Response example:**

```json
{
  "success": true,
  "data": {
    "id": "recurring_payment_id",
    "status": "CANCELLED",
    "cancelMode": "IMMEDIATELY"
  },
  "message": "Recurring payment cancelled successfully."
}
```

### GET /api/v1/customer/recurring-payments/{id}/history

**Allowed role/access:** Authenticated

**Summary:** List own recurring payment billing history

**Parameters:**

- `id` (path, required)
- `page` (query, optional)
- `limit` (query, optional)
- `status` (query, optional)

**Request payload example:**

```text
None
```

**Response example:**

```json
{
  "success": true,
  "data": [
    {
      "id": "history_id",
      "paymentId": "payment_id",
      "amount": 50,
      "currency": "PKR",
      "status": "SUCCESS",
      "billingDate": "2026-02-15T09:00:00.000Z",
      "transactionId": "GFT-8829-XPL",
      "failureReason": null
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "totalPages": 1
  },
  "message": "Recurring payment history fetched successfully."
}
```


## 05 Customer - Transactions

### GET /api/v1/customer/transactions

**Allowed role/access:** REGISTERED_USER

**Summary:** List own customer transactions

**Description:** REGISTERED_USER only. Normalizes backend Payment, Order, MoneyGift, and RecurringPayment occurrence records owned by the logged-in customer.

**Parameters:**

- `page` (query, optional)
- `limit` (query, optional)
- `search` (query, optional)
- `fromDate` (query, optional)
- `toDate` (query, optional)
- `type` (query, optional)
- `status` (query, optional)
- `paymentMethod` (query, optional)
- `minAmount` (query, optional)
- `maxAmount` (query, optional)
- `sortBy` (query, optional)
- `sortOrder` (query, optional)

**Request payload example:**

```text
None
```

**Response example:**

```json
{
  "success": true,
  "data": [
    {
      "id": "payment_id",
      "transactionId": "TXN-2026-001234",
      "title": "Monthly Flowers",
      "description": "Recurring payment",
      "recipient": {
        "id": "contact_id",
        "name": "Sarah Johnson",
        "avatarUrl": "https://cdn.yourdomain.com/customer-contact-avatars/sarah.png"
      },
      "amount": 50,
      "currency": "PKR",
      "type": "RECURRING_PAYMENT",
      "status": "SUCCESS",
      "paymentMethod": "STRIPE_CARD",
      "createdAt": "2026-03-01T14:34:00.000Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "totalPages": 1
  },
  "message": "Transactions fetched successfully."
}
```

### GET /api/v1/customer/transactions/summary

**Allowed role/access:** Authenticated

**Summary:** Fetch own transaction summary

**Description:** Defaults to current month when no date range is provided. Uses backend-calculated payment records only.

**Parameters:**

- `fromDate` (query, optional)
- `toDate` (query, optional)

**Request payload example:**

```text
None
```

**Response example:**

```json
{
  "success": true,
  "data": {
    "totalSpentThisMonth": 255,
    "currency": "PKR",
    "successfulCount": 9,
    "failedCount": 1,
    "pendingCount": 0,
    "refundedCount": 0
  },
  "message": "Transaction summary fetched successfully."
}
```

### GET /api/v1/customer/transactions/export

**Allowed role/access:** Authenticated

**Summary:** Export own transactions

**Description:** CSV is supported and returned as a file. Export is scoped to the logged-in customer only.

**Parameters:**

- `page` (query, optional)
- `limit` (query, optional)
- `search` (query, optional)
- `fromDate` (query, optional)
- `toDate` (query, optional)
- `type` (query, optional)
- `status` (query, optional)
- `paymentMethod` (query, optional)
- `minAmount` (query, optional)
- `maxAmount` (query, optional)
- `sortBy` (query, optional)
- `sortOrder` (query, optional)
- `format` (query, optional)

**Request payload example:**

```text
None
```

**Response example:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```

### GET /api/v1/customer/transactions/{id}

**Allowed role/access:** Authenticated

**Summary:** Fetch own transaction details

**Description:** Includes order, money gift, recurring payment, and payment gateway references when available. Billing address returns null until available.

**Parameters:**

- `id` (path, required)

**Request payload example:**

```text
None
```

**Response example:**

```json
{
  "success": true,
  "data": {
    "id": "payment_id",
    "transactionId": "TXN-2026-001234-ABC-XYZ",
    "status": "SUCCESS",
    "amount": 50,
    "currency": "PKR",
    "createdAt": "2026-03-01T14:34:00.000Z",
    "type": "RECURRING_PAYMENT",
    "giftInformation": {
      "giftName": "Monthly Flowers Subscription",
      "deliveryType": "Money",
      "recipient": {
        "id": "contact_id",
        "name": "Sarah Johnson",
        "avatarUrl": "https://cdn.yourdomain.com/customer-contact-avatars/sarah.png"
      },
      "orderReference": null,
      "recurringPaymentId": "recurring_payment_id"
    },
    "paymentInformation": {
      "paymentMethod": "Stripe card",
      "gatewayReference": "pi_3MmlLrLkdIwHu7ix0fhBHWqt",
      "billingAddress": null
    }
  },
  "message": "Transaction details fetched successfully."
}
```

### GET /api/v1/customer/transactions/{id}/receipt

**Allowed role/access:** Authenticated

**Summary:** Download own transaction receipt

**Description:** Receipt is generated only for the transaction owner and never exposes Stripe secret data.

**Parameters:**

- `id` (path, required)

**Request payload example:**

```text
None
```

**Response example:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```


## 05 Customer - Referrals & Rewards

### GET /api/v1/customer/referrals/summary

**Allowed role/access:** REGISTERED_USER

**Summary:** Fetch own referral reward summary

**Description:** REGISTERED_USER only. Customers can view only their own referral progress and ledger-derived balances.

**Request payload example:**

```text
None
```

**Response example:**

```json
{
  "success": true,
  "data": {
    "invitedFriends": 3,
    "successfulReferrals": 2,
    "rewardsEarned": 20,
    "availableCredit": 20,
    "currency": "USD",
    "progress": {
      "totalInvited": 3,
      "joined": 2,
      "pending": 1
    }
  },
  "message": "Referral summary fetched successfully."
}
```

### GET /api/v1/customer/referrals/link

**Allowed role/access:** Authenticated

**Summary:** Fetch own referral link

**Description:** Generates a unique customer referral code when missing. The link never exposes internal user IDs.

**Request payload example:**

```text
None
```

**Response example:**

```json
{
  "success": true,
  "data": {
    "referralCode": "SARAH-M",
    "referralLink": "https://giftapp.com/share/sarah-m",
    "shareTitle": "Invite Friends, Earn Rewards",
    "shareMessage": "Join Gift App with my referral link and we both earn rewards after your first gift purchase.",
    "rewardText": "Get $10 credit after your friend's first gift purchase."
  },
  "message": "Referral link fetched successfully."
}
```

### GET /api/v1/customer/referrals/history

**Allowed role/access:** REGISTERED_USER

**Summary:** List own referral history

**Description:** REGISTERED_USER only. History is scoped to referrals created by the logged-in customer.

**Parameters:**

- `page` (query, optional)
- `limit` (query, optional)
- `status` (query, optional)

**Request payload example:**

```text
None
```

**Response example:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```

### POST /api/v1/customer/referrals/redeem

**Allowed role/access:** Authenticated

**Summary:** Redeem own available reward credit

**Description:** Creates a REDEEMED reward ledger entry. Redemption cannot exceed ledger-derived available credit.

**Request payload example:**

```json
{
  "amount": 20,
  "redeemTo": "WALLET"
}
```

**Response example:**

```json
{
  "success": true,
  "data": {
    "redeemedAmount": 20,
    "currency": "USD",
    "walletBalance": 20
  },
  "message": "Reward redeemed successfully."
}
```

### GET /api/v1/customer/rewards/balance

**Allowed role/access:** Authenticated

**Summary:** Fetch own reward balance

**Description:** Balance is calculated from RewardLedger entries, not a mutable user balance field.

**Request payload example:**

```text
None
```

**Response example:**

```json
{
  "success": true,
  "data": {
    "availableCredit": 20,
    "lifetimeEarned": 20,
    "lifetimeRedeemed": 0,
    "currency": "USD"
  },
  "message": "Reward balance fetched successfully."
}
```

### GET /api/v1/customer/rewards/ledger

**Allowed role/access:** REGISTERED_USER

**Summary:** List own reward ledger

**Description:** REGISTERED_USER only. Returns ledger entries owned by the logged-in customer.

**Parameters:**

- `page` (query, optional)
- `limit` (query, optional)
- `type` (query, optional)

**Request payload example:**

```text
None
```

**Response example:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```

### GET /api/v1/customer/referrals/terms

**Allowed role/access:** Authenticated

**Summary:** Fetch referral terms

**Description:** Returns config/env based customer referral terms for the mobile app.

**Request payload example:**

```text
None
```

**Response example:**

```json
{
  "success": true,
  "data": {
    "title": "Referral Terms",
    "rewardAmount": 10,
    "currency": "USD",
    "qualificationRule": "Reward is credited after your referred friend completes their first gift purchase.",
    "terms": [
      "Referral rewards are available only for registered users.",
      "Reward is credited after the referred user's first successful purchase.",
      "Cancelled or refunded orders may revoke reward eligibility.",
      "Referral abuse may result in reward cancellation."
    ]
  },
  "message": "Referral terms fetched successfully."
}
```


## 05 Customer - Wallet

### GET /api/v1/customer/wallet

**Allowed role/access:** REGISTERED_USER

**Summary:** Fetch own wallet

**Description:** REGISTERED_USER only. Wallet is lazily created and balances are backed by wallet ledger entries.

**Request payload example:**

```text
None
```

**Response example:**

```json
{
  "success": true,
  "data": {
    "totalBalance": 1240.5,
    "giftCredits": 350,
    "cashBalance": 890.5,
    "currency": "USD",
    "defaultPaymentMethod": {
      "id": "pm_xxx",
      "type": "CARD",
      "brand": "visa",
      "last4": "4242",
      "expiryMonth": 9,
      "expiryYear": 2025,
      "isDefault": true
    },
    "defaultBankAccount": {
      "id": "bank_account_id",
      "bankName": "Chase Bank",
      "last4": "8821",
      "isDefault": false
    }
  },
  "message": "Wallet fetched successfully."
}
```

### POST /api/v1/customer/wallet/add-funds

**Allowed role/access:** Authenticated

**Summary:** Create wallet top-up payment

**Description:** Uses Stripe PaymentIntent. Wallet is credited only after successful server-side confirmation/webhook.

**Request payload example:**

```json
{
  "amount": 100,
  "currency": "USD",
  "paymentMethod": "STRIPE_CARD",
  "stripePaymentMethodId": "pm_xxx"
}
```

**Response example:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```

### GET /api/v1/customer/wallet/history

**Allowed role/access:** Authenticated

**Summary:** List own wallet history

**Description:** Positive amounts are credits, negative amounts are debits. Results are scoped to the logged-in customer.

**Parameters:**

- `page` (query, optional)
- `limit` (query, optional)
- `type` (query, optional)
- `status` (query, optional)
- `fromDate` (query, optional)
- `toDate` (query, optional)

**Request payload example:**

```text
None
```

**Response example:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```


## 05 Customer - Payment Methods

### POST /api/v1/customer/bank-accounts

**Allowed role/access:** Authenticated

**Summary:** Link placeholder bank account

**Description:** Stores only masked display data. Full IBAN/account number is never returned.

**Request payload example:**

```json
{
  "accountHolderName": "John Smith",
  "bankName": "Chase Bank",
  "ibanOrAccountNumber": "1234567890",
  "isDefault": false
}
```

**Response example:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```

### GET /api/v1/customer/bank-accounts

**Allowed role/access:** Authenticated

**Summary:** List own bank accounts

**Request payload example:**

```text
None
```

**Response example:**

```json
{
  "success": true,
  "data": [
    {
      "id": "bank_account_id",
      "accountHolderName": "John Smith",
      "bankName": "Chase Bank",
      "last4": "8821",
      "maskedAccount": "**** 8821",
      "isDefault": false
    }
  ],
  "message": "Bank accounts fetched successfully."
}
```

### PATCH /api/v1/customer/bank-accounts/{id}/default

**Allowed role/access:** Authenticated

**Summary:** Set own default bank account

**Parameters:**

- `id` (path, required)

**Request payload example:**

```text
None
```

**Response example:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```

### DELETE /api/v1/customer/bank-accounts/{id}

**Allowed role/access:** Authenticated

**Summary:** Delete own bank account

**Parameters:**

- `id` (path, required)

**Request payload example:**

```text
None
```

**Response example:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```

### POST /api/v1/customer/payment-methods/setup-intent

**Allowed role/access:** Authenticated

**Summary:** Create Stripe SetupIntent for saving card

**Description:** Frontend confirms card with Stripe SDK. Backend never accepts raw card number or CVV.

**Request payload example:**

```text
None
```

**Response example:**

```json
{
  "success": true,
  "data": {
    "setupIntentId": "seti_xxx",
    "clientSecret": "seti_xxx_secret_xxx",
    "publishableKey": "pk_test_xxx"
  },
  "message": "Setup intent created successfully."
}
```

### GET /api/v1/customer/payment-methods/saved

**Allowed role/access:** Authenticated

**Summary:** List own saved payment methods

**Description:** Returns masked Stripe card metadata only.

**Request payload example:**

```text
None
```

**Response example:**

```json
{
  "success": true,
  "data": [
    {
      "id": "pm_xxx",
      "type": "CARD",
      "brand": "visa",
      "last4": "4242",
      "expiryMonth": 9,
      "expiryYear": 2025,
      "isDefault": true
    }
  ],
  "message": "Saved payment methods fetched successfully."
}
```

### DELETE /api/v1/customer/payment-methods/{id}

**Allowed role/access:** Authenticated

**Summary:** Delete own saved payment method

**Description:** Rejects deletion when the method is used by an active recurring payment.

**Parameters:**

- `id` (path, required)

**Request payload example:**

```text
None
```

**Response example:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```

### GET /api/v1/customer/payment-methods

**Allowed role/access:** Authenticated

**Summary:** List supported customer payment methods

**Request payload example:**

```text
None
```

**Response example:**

```json
{
  "success": true,
  "data": [
    {
      "key": "STRIPE_CARD",
      "label": "Credit/Debit Card",
      "enabled": true
    },
    {
      "key": "BANK_TRANSFER",
      "label": "Bank Payment",
      "enabled": true
    },
    {
      "key": "E_WALLET",
      "label": "E-Wallet",
      "enabled": false
    }
  ],
  "message": "Payment methods fetched successfully."
}
```

### PATCH /api/v1/customer/payment-methods/{id}/default

**Allowed role/access:** Authenticated

**Summary:** Set own default payment method

**Parameters:**

- `id` (path, required)

**Request payload example:**

```text
None
```

**Response example:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```


## 06 Payments

### POST /api/v1/customer/payments/create-intent

**Allowed role/access:** REGISTERED_USER

**Summary:** Create payment intent from active cart

**Description:** REGISTERED_USER only. Amount is calculated from backend cart totals; frontend amount is never accepted.

**Request payload example:**

```json
{
  "cartId": "cmf0cartactive001",
  "paymentMethod": "STRIPE_CARD"
}
```

**Response example:**

```json
{
  "success": true,
  "data": {
    "paymentId": "payment_id",
    "stripePaymentIntentId": "pi_xxx",
    "clientSecret": "pi_xxx_secret_xxx",
    "publishableKey": "pk_live_or_test",
    "amount": 10999,
    "currency": "PKR"
  },
  "message": "Payment intent created successfully."
}
```

### POST /api/v1/customer/payments/confirm

**Allowed role/access:** REGISTERED_USER

**Summary:** Confirm Stripe payment

**Description:** REGISTERED_USER only. Retrieves Stripe PaymentIntent server-side before updating local payment status.

**Request payload example:**

```json
{
  "paymentId": "cmf0payment001",
  "stripePaymentIntentId": "pi_3Pxxxxxxxxxxxxxxxx"
}
```

**Response example:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```

### GET /api/v1/customer/payments/{id}

**Allowed role/access:** Authenticated

**Summary:** Fetch own payment details

**Parameters:**

- `id` (path, required)

**Request payload example:**

```text
None
```

**Response example:**

```json
{
  "success": true,
  "data": {
    "paymentId": "payment_id",
    "provider": "STRIPE",
    "stripePaymentIntentId": "pi_xxx",
    "amount": 109.99,
    "currency": "PKR",
    "status": "SUCCEEDED",
    "paymentMethod": "STRIPE_CARD",
    "failureReason": null
  },
  "message": "Payment fetched successfully."
}
```

### POST /api/v1/payments/stripe/webhook

**Allowed role/access:** PUBLIC

**Summary:** Stripe webhook endpoint

**Description:** Verifies Stripe-Signature using the configured webhook secret before processing events.

**Request payload example:**

```text
None
```

**Response example:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```

### POST /api/v1/customer/money-gifts

**Allowed role/access:** Authenticated

**Summary:** Send payment as gift

**Description:** Creates a customer-to-recipient money gift record and Stripe PaymentIntent for STRIPE_CARD.

**Request payload example:**

```json
{
  "amount": 100,
  "currency": "PKR",
  "recipientContactId": "cmf0contactmary001",
  "message": "Hope this helps. Enjoy your day!",
  "messageMediaUrls": [
    "https://cdn.yourdomain.com/gift-message-media/photo.png"
  ],
  "deliveryDate": "2026-12-24T00:00:00.000Z",
  "repeatAnnually": false,
  "paymentMethod": "STRIPE_CARD"
}
```

**Response example:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```

### GET /api/v1/customer/money-gifts

**Allowed role/access:** Authenticated

**Summary:** List own money gifts

**Request payload example:**

```text
None
```

**Response example:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```

### GET /api/v1/customer/money-gifts/{id}

**Allowed role/access:** Authenticated

**Summary:** Fetch own money gift details

**Parameters:**

- `id` (path, required)

**Request payload example:**

```text
None
```

**Response example:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```


## 06 Notifications

### GET /api/v1/notifications

**Allowed role/access:** Authenticated

**Summary:** List notifications

**Description:** JWT auth. Returns only notifications belonging to the logged-in account. Supports All, Unread, Birthdays, Deliveries, and New Contacts filters. No group gift notifications are supported.

**Parameters:**

- `page` (query, optional)
- `limit` (query, optional)
- `filter` (query, optional)
- `type` (query, optional)
- `isRead` (query, optional)
- `groupByDate` (query, optional)
- `sortOrder` (query, optional)

**Request payload example:**

```text
None
```

**Response example:**

```json
{
  "success": true,
  "data": [
    {
      "id": "notification_id",
      "title": "Payment successful",
      "message": "Your payment was completed successfully.",
      "type": "PAYMENT_SUCCEEDED",
      "isRead": false,
      "metadata": {
        "paymentId": "payment_id"
      },
      "createdAt": "2026-05-09T10:00:00.000Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "totalPages": 1
  },
  "message": "Notifications fetched successfully"
}
```

### GET /api/v1/notifications/summary

**Allowed role/access:** Authenticated

**Summary:** Fetch notification summary

**Description:** JWT auth. Counts only notifications belonging to the logged-in account.

**Request payload example:**

```text
None
```

**Response example:**

```json
{
  "success": true,
  "data": {
    "total": 12,
    "unread": 3,
    "byType": {
      "PAYMENT_SUCCEEDED": 2,
      "RECURRING_PAYMENT_CHARGE_FAILED": 1,
      "BROADCAST": 9
    }
  },
  "message": "Notification summary fetched successfully"
}
```

### GET /api/v1/notifications/preferences

**Allowed role/access:** Authenticated

**Summary:** Fetch notification preferences

**Description:** JWT auth. Preferences belong only to the logged-in account.

**Request payload example:**

```text
None
```

**Response example:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```

### PATCH /api/v1/notifications/preferences

**Allowed role/access:** Authenticated

**Summary:** Update notification preferences

**Description:** JWT auth. Push toggle does not delete device tokens. No group gift preference exists.

**Request payload example:**

```json
{
  "pushEnabled": true,
  "emailEnabled": true,
  "smsEnabled": false,
  "dealUpdatesEnabled": true,
  "birthdayRemindersEnabled": true,
  "deliveryUpdatesEnabled": true,
  "newContactAlertsEnabled": true
}
```

**Response example:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```

### PATCH /api/v1/notifications/read-all

**Allowed role/access:** Authenticated

**Summary:** Mark all own notifications as read

**Description:** JWT auth. Marks only notifications belonging to the logged-in account.

**Request payload example:**

```text
None
```

**Response example:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```

### PATCH /api/v1/notifications/{id}/read

**Allowed role/access:** Authenticated

**Summary:** Mark notification as read

**Description:** JWT auth. Notification must belong to the logged-in account.

**Parameters:**

- `id` (path, required)

**Request payload example:**

```text
None
```

**Response example:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```

### POST /api/v1/notifications/{id}/action

**Allowed role/access:** Authenticated

**Summary:** Process notification action

**Description:** JWT auth. Supports SEND_GIFT, REMIND_ME_LATER, VIEW_ORDER, VIEW_CONTACT. Group gift actions are not supported.

**Parameters:**

- `id` (path, required)

**Request payload example:**

```json
{
  "action": "SEND_GIFT"
}
```

**Response example:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```

### POST /api/v1/notifications/device-tokens

**Allowed role/access:** Authenticated

**Summary:** Save device token

**Description:** JWT auth. Token belongs only to logged-in account. Duplicate deviceId updates existing record.

**Request payload example:**

```json
{
  "token": "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]",
  "platform": "IOS",
  "deviceId": "ios-iphone-15-pro-device-id"
}
```

**Response example:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```

### DELETE /api/v1/notifications/device-tokens/{id}

**Allowed role/access:** Authenticated

**Summary:** Disable device token

**Description:** JWT auth. Users can disable only their own device tokens.

**Parameters:**

- `id` (path, required)

**Request payload example:**

```text
None
```

**Response example:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```


## 06 Broadcast Notifications

### POST /api/v1/broadcasts

**Allowed role/access:** Authenticated

**Summary:** POST /api/v1/broadcasts

**Request payload example:**

```json
{
  "title": "string",
  "message": "string",
  "imageUrl": "string",
  "ctaLabel": "string",
  "ctaUrl": "string",
  "channels": [],
  "priority": "string"
}
```

**Response example:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```

### GET /api/v1/broadcasts

**Allowed role/access:** Authenticated

**Summary:** GET /api/v1/broadcasts

**Parameters:**

- `page` (query, optional)
- `limit` (query, optional)
- `search` (query, optional)
- `status` (query, optional)
- `channel` (query, optional)
- `priority` (query, optional)
- `createdFrom` (query, optional)
- `createdTo` (query, optional)
- `scheduledFrom` (query, optional)
- `scheduledTo` (query, optional)
- `sortBy` (query, optional)
- `sortOrder` (query, optional)

**Request payload example:**

```text
None
```

**Response example:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```

### GET /api/v1/broadcasts/{id}

**Allowed role/access:** Authenticated

**Summary:** GET /api/v1/broadcasts/{id}

**Parameters:**

- `id` (path, required)

**Request payload example:**

```text
None
```

**Response example:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```

### PATCH /api/v1/broadcasts/{id}

**Allowed role/access:** Authenticated

**Summary:** PATCH /api/v1/broadcasts/{id}

**Parameters:**

- `id` (path, required)

**Request payload example:**

```json
{
  "title": "string",
  "message": "string",
  "imageUrl": "string",
  "ctaLabel": "string",
  "ctaUrl": "string",
  "channels": [],
  "priority": "string"
}
```

**Response example:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```

### PATCH /api/v1/broadcasts/{id}/targeting

**Allowed role/access:** Authenticated

**Summary:** PATCH /api/v1/broadcasts/{id}/targeting

**Parameters:**

- `id` (path, required)

**Request payload example:**

```json
{
  "mode": "string",
  "roles": [],
  "filters": "string"
}
```

**Response example:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```

### POST /api/v1/broadcasts/estimate-reach

**Allowed role/access:** Authenticated

**Summary:** POST /api/v1/broadcasts/estimate-reach

**Request payload example:**

```json
{
  "channels": [],
  "targeting": "string"
}
```

**Response example:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```

### PATCH /api/v1/broadcasts/{id}/schedule

**Allowed role/access:** Authenticated

**Summary:** PATCH /api/v1/broadcasts/{id}/schedule

**Parameters:**

- `id` (path, required)

**Request payload example:**

```json
{
  "sendMode": "string",
  "scheduledAt": "string",
  "timezone": "string",
  "isRecurring": true,
  "recurrence": "string"
}
```

**Response example:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```

### POST /api/v1/broadcasts/{id}/cancel

**Allowed role/access:** Authenticated

**Summary:** POST /api/v1/broadcasts/{id}/cancel

**Parameters:**

- `id` (path, required)

**Request payload example:**

```json
{
  "reason": "string"
}
```

**Response example:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```

### GET /api/v1/broadcasts/{id}/report

**Allowed role/access:** Authenticated

**Summary:** GET /api/v1/broadcasts/{id}/report

**Parameters:**

- `id` (path, required)

**Request payload example:**

```text
None
```

**Response example:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```

### GET /api/v1/broadcasts/{id}/recipients

**Allowed role/access:** Authenticated

**Summary:** GET /api/v1/broadcasts/{id}/recipients

**Parameters:**

- `id` (path, required)
- `page` (query, optional)
- `limit` (query, optional)
- `channel` (query, optional)
- `status` (query, optional)
- `search` (query, optional)

**Request payload example:**

```text
None
```

**Response example:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```


## 07 Plans & Coupons

### GET /api/v1/subscription-plans

**Allowed role/access:** Authenticated

**Summary:** GET /api/v1/subscription-plans

**Parameters:**

- `page` (query, optional)
- `limit` (query, optional)
- `search` (query, optional)
- `status` (query, optional)
- `visibility` (query, optional)
- `billingCycle` (query, optional)
- `sortBy` (query, optional)
- `sortOrder` (query, optional)

**Request payload example:**

```text
None
```

**Response example:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```

### POST /api/v1/subscription-plans

**Allowed role/access:** Authenticated

**Summary:** POST /api/v1/subscription-plans

**Request payload example:**

```json
{
  "name": "string",
  "description": "string",
  "monthlyPrice": 0,
  "yearlyPrice": 0,
  "currency": "USD",
  "visibility": "string",
  "status": "string",
  "isPopular": true,
  "features": "string",
  "limits": "string"
}
```

**Response example:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```

### GET /api/v1/subscription-plans/stats

**Allowed role/access:** Authenticated

**Summary:** GET /api/v1/subscription-plans/stats

**Request payload example:**

```text
None
```

**Response example:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```

### GET /api/v1/subscription-plans/{id}

**Allowed role/access:** Authenticated

**Summary:** GET /api/v1/subscription-plans/{id}

**Parameters:**

- `id` (path, required)

**Request payload example:**

```text
None
```

**Response example:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```

### PATCH /api/v1/subscription-plans/{id}

**Allowed role/access:** Authenticated

**Summary:** PATCH /api/v1/subscription-plans/{id}

**Parameters:**

- `id` (path, required)

**Request payload example:**

```json
{
  "name": "string",
  "description": "string",
  "monthlyPrice": 0,
  "yearlyPrice": 0,
  "currency": "string",
  "visibility": "string",
  "status": "string",
  "isPopular": true,
  "features": "string",
  "limits": "string"
}
```

**Response example:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```

### DELETE /api/v1/subscription-plans/{id}

**Allowed role/access:** Authenticated

**Summary:** DELETE /api/v1/subscription-plans/{id}

**Parameters:**

- `id` (path, required)

**Request payload example:**

```text
None
```

**Response example:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```

### PATCH /api/v1/subscription-plans/{id}/status

**Allowed role/access:** Authenticated

**Summary:** PATCH /api/v1/subscription-plans/{id}/status

**Parameters:**

- `id` (path, required)

**Request payload example:**

```json
{
  "status": "string",
  "reason": "string"
}
```

**Response example:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```

### PATCH /api/v1/subscription-plans/{id}/visibility

**Allowed role/access:** Authenticated

**Summary:** PATCH /api/v1/subscription-plans/{id}/visibility

**Parameters:**

- `id` (path, required)

**Request payload example:**

```json
{
  "visibility": "string"
}
```

**Response example:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```

### GET /api/v1/subscription-plans/{id}/analytics

**Allowed role/access:** Authenticated

**Summary:** GET /api/v1/subscription-plans/{id}/analytics

**Parameters:**

- `id` (path, required)

**Request payload example:**

```text
None
```

**Response example:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```

### GET /api/v1/plan-features/catalog

**Allowed role/access:** Authenticated

**Summary:** GET /api/v1/plan-features/catalog

**Request payload example:**

```text
None
```

**Response example:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```

### GET /api/v1/plan-features

**Allowed role/access:** Authenticated

**Summary:** GET /api/v1/plan-features

**Parameters:**

- `page` (query, optional)
- `limit` (query, optional)
- `search` (query, optional)
- `isActive` (query, optional)

**Request payload example:**

```text
None
```

**Response example:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```

### POST /api/v1/plan-features

**Allowed role/access:** Authenticated

**Summary:** POST /api/v1/plan-features

**Request payload example:**

```json
{
  "key": "string",
  "label": "string",
  "description": "string",
  "type": "string",
  "isActive": true,
  "sortOrder": 0
}
```

**Response example:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```

### GET /api/v1/plan-features/{id}

**Allowed role/access:** Authenticated

**Summary:** GET /api/v1/plan-features/{id}

**Parameters:**

- `id` (path, required)

**Request payload example:**

```text
None
```

**Response example:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```

### PATCH /api/v1/plan-features/{id}

**Allowed role/access:** Authenticated

**Summary:** PATCH /api/v1/plan-features/{id}

**Parameters:**

- `id` (path, required)

**Request payload example:**

```json
{
  "key": "string",
  "label": "string",
  "description": "string",
  "type": "string",
  "isActive": true,
  "sortOrder": 0
}
```

**Response example:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```

### DELETE /api/v1/plan-features/{id}

**Allowed role/access:** Authenticated

**Summary:** DELETE /api/v1/plan-features/{id}

**Parameters:**

- `id` (path, required)

**Request payload example:**

```text
None
```

**Response example:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```

### GET /api/v1/coupons

**Allowed role/access:** Authenticated

**Summary:** GET /api/v1/coupons

**Parameters:**

- `page` (query, optional)
- `limit` (query, optional)
- `search` (query, optional)
- `status` (query, optional)
- `planId` (query, optional)

**Request payload example:**

```text
None
```

**Response example:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```

### POST /api/v1/coupons

**Allowed role/access:** Authenticated

**Summary:** POST /api/v1/coupons

**Request payload example:**

```json
{
  "code": "string",
  "description": "string",
  "discountType": "string",
  "discountValue": 0,
  "planIds": [],
  "startsAt": "string",
  "expiresAt": "string",
  "maxRedemptions": 0,
  "isActive": true
}
```

**Response example:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```

### GET /api/v1/coupons/{id}

**Allowed role/access:** Authenticated

**Summary:** GET /api/v1/coupons/{id}

**Parameters:**

- `id` (path, required)

**Request payload example:**

```text
None
```

**Response example:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```

### PATCH /api/v1/coupons/{id}

**Allowed role/access:** Authenticated

**Summary:** PATCH /api/v1/coupons/{id}

**Parameters:**

- `id` (path, required)

**Request payload example:**

```json
{
  "code": "string",
  "description": "string",
  "discountType": "string",
  "discountValue": 0,
  "planIds": [],
  "startsAt": "string",
  "expiresAt": "string",
  "maxRedemptions": 0,
  "isActive": true
}
```

**Response example:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```

### DELETE /api/v1/coupons/{id}

**Allowed role/access:** Authenticated

**Summary:** DELETE /api/v1/coupons/{id}

**Parameters:**

- `id` (path, required)

**Request payload example:**

```text
None
```

**Response example:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```

### PATCH /api/v1/coupons/{id}/status

**Allowed role/access:** Authenticated

**Summary:** PATCH /api/v1/coupons/{id}/status

**Parameters:**

- `id` (path, required)

**Request payload example:**

```json
{
  "status": "string",
  "reason": "string"
}
```

**Response example:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```


## 07 Storage

### POST /api/v1/uploads/presigned-url

**Allowed role/access:** Authenticated

**Summary:** POST /api/v1/uploads/presigned-url

**Request payload example:**

```json
{
  "folder": "string",
  "fileName": "avatar.png",
  "contentType": "image/png",
  "sizeBytes": 1048576,
  "targetAccountId": "target_account_id",
  "giftId": "gift_id"
}
```

**Response example:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```

### POST /api/v1/uploads/complete

**Allowed role/access:** Authenticated

**Summary:** POST /api/v1/uploads/complete

**Request payload example:**

```json
{
  "uploadId": "string",
  "sizeBytes": 0
}
```

**Response example:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```

### GET /api/v1/uploads

**Allowed role/access:** Authenticated

**Summary:** GET /api/v1/uploads

**Parameters:**

- `page` (query, optional)
- `limit` (query, optional)
- `folder` (query, optional)
- `ownerId` (query, optional)

**Request payload example:**

```text
None
```

**Response example:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```

### GET /api/v1/uploads/{id}

**Allowed role/access:** Authenticated

**Summary:** GET /api/v1/uploads/{id}

**Parameters:**

- `id` (path, required)

**Request payload example:**

```text
None
```

**Response example:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```

### DELETE /api/v1/uploads/{id}

**Allowed role/access:** Authenticated

**Summary:** DELETE /api/v1/uploads/{id}

**Parameters:**

- `id` (path, required)

**Request payload example:**

```text
None
```

**Response example:**

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```
