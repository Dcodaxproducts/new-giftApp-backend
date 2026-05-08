# Gift App Backend API Record

Base URL: `/api/v1`

Auth header for protected APIs:

```txt
Authorization: Bearer <accessToken>
```

Canonical Super Admin seeded in database:

```txt
email: giftapp.superadmin@yopmail.com
password: Admin@123456
```

Note: `GET /admins` lists only users with role `ADMIN`; it does not include `SUPER_ADMIN` users.

---

## API List

### Auth

```txt
POST   /auth/users/register
POST   /auth/providers/register
POST   /auth/guest/session
POST   /auth/login
POST   /auth/refresh
POST   /auth/logout
POST   /auth/verify-email
POST   /auth/resend-otp
POST   /auth/forgot-password
POST   /auth/verify-reset-otp
POST   /auth/reset-password
PATCH  /auth/change-password
GET    /auth/me
DELETE /auth/account
POST   /auth/cancel-deletion
```

### Admin Management

```txt
POST   /admins
GET    /admins
GET    /admins/:id
PATCH  /admins/:id
PATCH  /admins/:id/active-status
PATCH  /admins/:id/password
```

### Admin Roles / Permissions

```txt
GET    /admin-roles
POST   /admin-roles
GET    /admin-roles/:id
PATCH  /admin-roles/:id
DELETE /admin-roles/:id
PATCH  /admin-roles/:id/permissions
GET    /permissions/catalog
```

### Providers

```txt
GET    /providers/export
GET    /providers/stats
GET    /providers
GET    /providers/lookup
POST   /providers
GET    /providers/:id
PATCH  /providers/:id
PATCH  /providers/:id/approve
PATCH  /providers/:id/reject
PATCH  /providers/:id/status
POST   /providers/:id/suspend
POST   /providers/:id/unsuspend
GET    /providers/:id/items
GET    /providers/:id/activity
POST   /providers/:id/message
```

### Provider Business Categories

```txt
GET    /provider-business-categories
POST   /provider-business-categories
GET    /provider-business-categories/:id
PATCH  /provider-business-categories/:id
DELETE /provider-business-categories/:id
```

### Provider Inventory

```txt
GET    /provider/inventory
GET    /provider/inventory/stats
GET    /provider/inventory/lookup
POST   /provider/inventory
GET    /provider/inventory/:id
PATCH  /provider/inventory/:id
PATCH  /provider/inventory/:id/availability
DELETE /provider/inventory/:id
```

### Gift Categories

```txt
POST   /gift-categories
GET    /gift-categories
GET    /gift-categories/lookup
GET    /gift-categories/stats
GET    /gift-categories/:id
PATCH  /gift-categories/:id
DELETE /gift-categories/:id
```

### Gifts

```txt
POST   /gifts
GET    /gifts
GET    /gifts/stats
GET    /gifts/export
GET    /gifts/:id
PATCH  /gifts/:id
PATCH  /gifts/:id/status
DELETE /gifts/:id
```

### Gift Moderation

```txt
GET    /gift-moderation
PATCH  /gift-moderation/:id/approve
PATCH  /gift-moderation/:id/reject
PATCH  /gift-moderation/:id/flag
```

### Promotional Offers — Admin

```txt
GET    /promotional-offers/stats
GET    /promotional-offers/export
GET    /promotional-offers
POST   /promotional-offers
GET    /promotional-offers/:id
PATCH  /promotional-offers/:id
PATCH  /promotional-offers/:id/approve
PATCH  /promotional-offers/:id/reject
PATCH  /promotional-offers/:id/status
DELETE /promotional-offers/:id
```

### Promotional Offers — Provider

```txt
GET    /provider/offers
POST   /provider/offers
GET    /provider/offers/:id
PATCH  /provider/offers/:id
PATCH  /provider/offers/:id/status
DELETE /provider/offers/:id
```

### Customer Marketplace

```txt
GET    /customer/home
GET    /customer/categories
GET    /customer/gifts
GET    /customer/gifts/discounted
GET    /customer/gifts/filter-options
GET    /customer/gifts/:id
```

### Customer Contacts

```txt
GET    /customer/contacts
POST   /customer/contacts
GET    /customer/contacts/:id
PATCH  /customer/contacts/:id
DELETE /customer/contacts/:id
```

### Customer Events

```txt
GET    /customer/events
POST   /customer/events
GET    /customer/events/calendar
GET    /customer/events/upcoming
GET    /customer/events/:id
PATCH  /customer/events/:id
DELETE /customer/events/:id
GET    /customer/events/:id/reminder-settings
PATCH  /customer/events/:id/reminder-settings
```

### Customer Wishlist

```txt
GET    /customer/wishlist
POST   /customer/wishlist/:giftId
DELETE /customer/wishlist/:giftId
```

### Customer Addresses

```txt
GET    /customer/addresses
POST   /customer/addresses
GET    /customer/addresses/:id
PATCH  /customer/addresses/:id
DELETE /customer/addresses/:id
PATCH  /customer/addresses/:id/default
```

### Customer Reminders

```txt
GET    /customer/reminders
POST   /customer/reminders
GET    /customer/reminders/:id
PATCH  /customer/reminders/:id
DELETE /customer/reminders/:id
```

### Customer Cart

```txt
GET    /customer/cart
POST   /customer/cart/items
PATCH  /customer/cart/items/:id
DELETE /customer/cart/items/:id
DELETE /customer/cart
```

### Customer Orders

```txt
POST   /customer/orders
GET    /customer/orders
GET    /customer/orders/:id
```

### Broadcasts

```txt
POST   /broadcasts
GET    /broadcasts
GET    /broadcasts/:id
PATCH  /broadcasts/:id
PATCH  /broadcasts/:id/targeting
POST   /broadcasts/estimate-reach
PATCH  /broadcasts/:id/schedule
POST   /broadcasts/:id/cancel
GET    /broadcasts/:id/report
GET    /broadcasts/:id/recipients
```

### Notifications

```txt
GET    /notifications
GET    /notifications/summary
GET    /notifications/preferences
PATCH  /notifications/preferences
PATCH  /notifications/:id/read
PATCH  /notifications/read-all
POST   /notifications/:id/action
POST   /notifications/device-tokens
DELETE /notifications/device-tokens/:id
```

### Storage / Uploads

```txt
POST   /uploads/presigned-url
POST   /uploads/complete
GET    /uploads
GET    /uploads/:id
DELETE /uploads/:id
```

### Subscription Plans

```txt
GET    /subscription-plans
GET    /subscription-plans/stats
POST   /subscription-plans
GET    /subscription-plans/:id
PATCH  /subscription-plans/:id
PATCH  /subscription-plans/:id/status
PATCH  /subscription-plans/:id/visibility
DELETE /subscription-plans/:id
GET    /subscription-plans/:id/analytics
```

### Plan Features

```txt
GET    /plan-features/catalog
GET    /plan-features
POST   /plan-features
GET    /plan-features/:id
PATCH  /plan-features/:id
DELETE /plan-features/:id
```

### Coupons

```txt
GET    /coupons
POST   /coupons
GET    /coupons/:id
PATCH  /coupons/:id
PATCH  /coupons/:id/status
DELETE /coupons/:id
```

### Audit Logs

```txt
GET    /audit-logs/export
GET    /audit-logs
GET    /audit-logs/:id
```

### Login Attempts

```txt
GET    /login-attempts/stats
GET    /login-attempts/export
GET    /login-attempts
```

---

# POST API Payloads

## Auth

### POST /auth/users/register

```json
{
  "email": "customer@example.com",
  "password": "Password@123",
  "firstName": "Sarah",
  "lastName": "Khan",
  "phone": "+15550000000"
}
```

### POST /auth/providers/register

```json
{
  "email": "provider@example.com",
  "password": "Password@123",
  "firstName": "Ali",
  "lastName": "Raza",
  "phone": "+15550000001",
  "businessName": "Premium Gifts Co",
  "businessCategoryId": "provider_business_category_id",
  "taxId": "TAX-12345",
  "businessAddress": "123 Gift Street",
  "fulfillmentMethods": ["PICKUP", "DELIVERY"],
  "autoAcceptOrders": false
}
```

### POST /auth/guest/session

```json
{
  "capabilities": ["browse_gifts", "view_categories"]
}
```

### POST /auth/login

```json
{
  "email": "giftapp.superadmin@yopmail.com",
  "password": "Admin@123456"
}
```

### POST /auth/refresh

```json
{
  "refreshToken": "refresh_token_here"
}
```

### POST /auth/logout

No body.

### POST /auth/verify-email

```json
{
  "otp": "123456"
}
```

### POST /auth/resend-otp

No body.

### POST /auth/forgot-password

```json
{
  "email": "user@example.com"
}
```

Success message: `Password reset OTP has been sent to your email.`

Unknown email message: `No account found with this email address.`

Email failure message: `Unable to send password reset email. Please try again later.`

### POST /auth/verify-reset-otp

```json
{
  "email": "user@example.com",
  "otp": "334018"
}
```

Returns only: `OTP verified successfully.` It does not return a reset token.

### POST /auth/reset-password

```json
{
  "email": "user@example.com",
  "otp": "334018",
  "newPassword": "NewPassword@123"
}
```

Success message: `Password has been reset successfully.`

Failure messages include:

```txt
Invalid or expired OTP.
No account found with this email address.
New password does not meet security requirements.
```

### POST /auth/cancel-deletion

No body.

## Admin Management

### POST /admins

Creates an `ADMIN` staff user under `SUPER_ADMIN`. `roleId` means **AdminRole.id** only. This endpoint never creates `SUPER_ADMIN`, `REGISTERED_USER`, `PROVIDER`, or `GUEST_USER` accounts, and the backend always stores `User.role = ADMIN`.

```json
{
  "email": "staff@example.com",
  "temporaryPassword": "Temp@123456",
  "generateTemporaryPassword": false,
  "mustChangePassword": true,
  "firstName": "Operations",
  "lastName": "Staff",
  "phone": "+15550000002",
  "title": "Operations Manager",
  "roleId": "admin_role_id",
  "avatarUrl": "https://cdn.yourdomain.com/admin-avatars/staff.png",
  "isActive": true,
  "sendInviteEmail": true
}
```

Response highlights:
- `role` = `ADMIN`
- `roleId` = selected `AdminRole.id`
- `inviteEmailSent` reports email delivery success/failure

## Admin Roles

Admin Roles / RBAC manages permission roles for `ADMIN` staff users only. `SUPER_ADMIN` has full immutable access and does not depend on AdminRole permissions.

### POST /admin-roles

```json
{
  "name": "Gift Manager",
  "description": "Can manage gifts and categories.",
  "permissions": {
    "gifts": ["read", "create", "update"],
    "giftCategories": ["read", "create", "update"]
  },
  "isActive": true
}
```

Rules:
- Custom AdminRole permissions are assigned from the backend-supported permission catalog only.
- `SUPER_ADMIN` bypasses admin permission checks and does not rely on `roleId`.
- The system `SUPER_ADMIN` role is read-only and cannot be modified or deleted.
- Disabled AdminRoles immediately block assigned `ADMIN` users from protected admin APIs.
- Custom AdminRoles cannot be deleted while staff users are assigned.

### GET /permissions/catalog

Read-only list of backend-supported permission keys that can be assigned to admin roles. No create/update/delete endpoints exist for the permission catalog.

## Providers

### POST /providers

```json
{
  "email": "provider@example.com",
  "password": "Provider@123456",
  "firstName": "Ali",
  "lastName": "Raza",
  "phone": "+15550000001",
  "businessName": "Premium Gifts Co",
  "businessCategoryId": "provider_business_category_id",
  "taxId": "TAX-12345",
  "businessAddress": "123 Gift Street",
  "serviceArea": "London",
  "fulfillmentMethods": ["PICKUP", "DELIVERY"],
  "autoAcceptOrders": false,
  "documents": [
    {
      "name": "Trade License",
      "url": "https://cdn.yourdomain.com/provider-documents/license.pdf"
    }
  ]
}
```

### POST /providers/:id/suspend

```json
{
  "status": "SUSPENDED",
  "reason": "POLICY_VIOLATION",
  "comment": "Provider documents require review.",
  "notifyProvider": true
}
```

### POST /providers/:id/unsuspend

```json
{
  "comment": "Documents verified.",
  "notifyProvider": true
}
```

### POST /providers/:id/message

```json
{
  "subject": "Document update required",
  "message": "Please upload your renewed business license.",
  "channels": ["EMAIL"]
}
```

## Provider Business Categories

### POST /provider-business-categories

```json
{
  "name": "Florists",
  "description": "Flower and bouquet providers.",
  "iconKey": "flowers",
  "sortOrder": 1,
  "isActive": true
}
```

## Provider Inventory

### POST /provider/inventory

```json
{
  "name": "Rose Bouquet",
  "description": "Fresh red roses.",
  "shortDescription": "Premium rose bouquet.",
  "categoryId": "gift_category_id",
  "price": 49.99,
  "currency": "USD",
  "stockQuantity": 20,
  "sku": "ROSE-BOUQUET-001",
  "imageUrls": ["https://cdn.yourdomain.com/gift-images/rose-bouquet.png"],
  "isPublished": true,
  "tags": ["flowers", "romantic"]
}
```

## Gift Categories

### POST /gift-categories

```json
{
  "name": "Perfumes",
  "description": "Premium fragrance gifts.",
  "iconKey": "perfume",
  "backgroundColor": "#E9D5FF",
  "imageUrl": "https://cdn.yourdomain.com/gift-category-images/perfumes.png",
  "sortOrder": 1,
  "isActive": true
}
```

Backward-compatible old field:

```json
{
  "name": "Perfumes",
  "color": "#E9D5FF"
}
```

## Gifts

### POST /gifts

```json
{
  "name": "Luxury Perfume",
  "description": "Long-lasting premium fragrance.",
  "shortDescription": "Premium fragrance gift.",
  "categoryId": "gift_category_id",
  "providerId": "provider_id",
  "price": 99.99,
  "currency": "USD",
  "stockQuantity": 50,
  "sku": "PERFUME-001",
  "imageUrls": ["https://cdn.yourdomain.com/gift-images/perfume.png"],
  "isPublished": true,
  "isFeatured": false,
  "tags": ["perfume", "luxury"],
  "moderationStatus": "APPROVED"
}
```

## Promotional Offers

### POST /promotional-offers

```json
{
  "providerId": "provider_id",
  "itemId": "gift_id",
  "title": "20% Off Perfumes",
  "description": "Limited-time discount on selected perfumes.",
  "discountType": "PERCENTAGE",
  "discountValue": 20,
  "startDate": "2026-05-10T00:00:00.000Z",
  "endDate": "2026-05-20T23:59:59.000Z",
  "eligibilityRules": "Valid while stock lasts.",
  "isActive": true,
  "approvalStatus": "APPROVED"
}
```

### POST /provider/offers

```json
{
  "itemId": "gift_id",
  "title": "10 USD Off",
  "description": "Flat discount on this item.",
  "discountType": "FIXED_AMOUNT",
  "discountValue": 10,
  "startDate": "2026-05-10T00:00:00.000Z",
  "endDate": "2026-05-20T23:59:59.000Z",
  "eligibilityRules": "One use per customer.",
  "isActive": true
}
```

## Customer Wishlist

### POST /customer/wishlist/:giftId

No body.

## Customer Addresses

### POST /customer/addresses

```json
{
  "label": "Home",
  "fullName": "Sarah Khan",
  "phone": "+15550000000",
  "line1": "221B Baker Street",
  "line2": "Apartment 4",
  "city": "London",
  "state": "Greater London",
  "country": "United Kingdom",
  "postalCode": "NW1 6XE",
  "latitude": 51.5237,
  "longitude": -0.1585,
  "deliveryInstructions": "Leave at reception.",
  "isDefault": true
}
```

## Customer Reminders

### POST /customer/reminders

```json
{
  "title": "Mom birthday",
  "recipientName": "Mom",
  "eventType": "BIRTHDAY",
  "reminderDate": "2026-06-01T09:00:00.000Z",
  "notes": "Buy flowers and perfume.",
  "isActive": true
}
```

Allowed eventType: `BIRTHDAY | ANNIVERSARY | HOLIDAY | CUSTOM`

## Customer Cart

### POST /customer/cart/items

```json
{
  "giftId": "gift_id",
  "quantity": 1,
  "deliveryOption": "SAME_DAY",
  "recipientName": "Sarah",
  "recipientPhone": "+15550000000",
  "recipientAddressId": "address_id",
  "giftMessage": "Happy Birthday!",
  "scheduledDeliveryAt": null
}
```

Allowed deliveryOption: `SAME_DAY | NEXT_DAY | SCHEDULED`

## Customer Orders

### POST /customer/orders

```json
{
  "deliveryAddressId": "address_id",
  "paymentMethod": "COD"
}
```

Allowed paymentMethod: `COD | PLACEHOLDER`

## Broadcasts

### POST /broadcasts

```json
{
  "title": "Mother's Day Gifts",
  "message": "Explore curated gifts for Mother's Day.",
  "imageUrl": "https://cdn.yourdomain.com/broadcast-images/mothers-day.png",
  "ctaLabel": "Shop Now",
  "ctaUrl": "https://app.giftapp.com/gifts",
  "channels": ["EMAIL", "PUSH", "IN_APP"],
  "priority": "NORMAL"
}
```

### POST /broadcasts/estimate-reach

```json
{
  "channels": ["EMAIL", "PUSH", "IN_APP"],
  "targeting": {
    "mode": "SPECIFIC_ROLES",
    "roles": ["REGISTERED_USER"],
    "filters": {
      "location": "London",
      "onlyVerifiedEmails": true,
      "excludeUnsubscribed": true,
      "excludeSuspended": true
    }
  }
}
```

### POST /broadcasts/:id/cancel

```json
{
  "reason": "Campaign postponed."
}
```

## Notifications

### POST /notifications/:id/action

```json
{
  "action": "SEND_GIFT"
}
```

Allowed actions: `SEND_GIFT | REMIND_ME_LATER | VIEW_ORDER | VIEW_CONTACT`.

### PATCH /notifications/preferences

```json
{
  "pushEnabled": true,
  "dealUpdatesEnabled": true,
  "birthdayRemindersEnabled": true,
  "deliveryUpdatesEnabled": true,
  "newContactAlertsEnabled": true
}
```

Filters supported by `GET /notifications`: `ALL | UNREAD | BIRTHDAYS | DELIVERIES | NEW_CONTACTS`.

Notification types: `BIRTHDAY_REMINDER | GIFT_DELIVERED | NEW_CONTACT_AVAILABLE | PROMOTIONAL | BROADCAST | SYSTEM | SECURITY | ORDER`.

## Notifications

### POST /notifications/device-tokens

```json
{
  "token": "device_push_token_here",
  "platform": "IOS",
  "deviceId": "device_id_123"
}
```

Allowed platform: `IOS | ANDROID | WEB`

## Storage / Uploads

### POST /uploads/presigned-url

```json
{
  "folder": "gift-category-images",
  "fileName": "perfumes.png",
  "contentType": "image/png",
  "sizeBytes": 1048576,
  "targetAccountId": "account_id",
  "giftId": "gift_id"
}
```

Allowed folders: `admin-avatars`, `user-avatars`, `provider-logos`, `provider-documents`, `provider-item-images`, `gift-images`, `gift-category-images`, `customer-contact-avatars`, `broadcast-images`.

For `gift-category-images`: `image/jpeg | image/png | image/webp`, max 5MB.

### POST /uploads/complete

```json
{
  "uploadId": "upload_id",
  "sizeBytes": 1048576
}
```

## Subscription Plans

### POST /subscription-plans

```json
{
  "name": "Premium Provider",
  "description": "Best plan for growing providers.",
  "monthlyPrice": 29.99,
  "yearlyPrice": 299.99,
  "currency": "USD",
  "billingCycle": "MONTHLY",
  "features": {
    "maxItems": 100,
    "featuredPlacement": true
  },
  "limits": {
    "maxItems": 100,
    "maxOffers": 20,
    "maxStorageMb": 1024
  },
  "status": "ACTIVE",
  "visibility": "PUBLIC",
  "trialDays": 14,
  "sortOrder": 1
}
```

## Plan Features

### POST /plan-features

```json
{
  "key": "featuredPlacement",
  "label": "Featured Placement",
  "description": "Allows provider gifts to appear in featured sections.",
  "type": "BOOLEAN",
  "isActive": true,
  "sortOrder": 1
}
```

Allowed type: `BOOLEAN | NUMBER | TEXT`

## Coupons

### POST /coupons

```json
{
  "code": "WELCOME20",
  "description": "20% off first subscription.",
  "discountType": "PERCENTAGE",
  "discountValue": 20,
  "planIds": ["subscription_plan_id"],
  "startsAt": "2026-05-10T00:00:00.000Z",
  "expiresAt": "2026-06-10T00:00:00.000Z",
  "maxRedemptions": 100,
  "isActive": true
}
```

Allowed discountType: `PERCENTAGE | FIXED_AMOUNT`
