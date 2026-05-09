# Gift App Backend API Record

Base URL: `/api/v1`

Auth header for protected APIs:

```txt
Authorization: Bearer <accessToken>
```

Generated from the NestJS Swagger document with controller auto-tags disabled, so each endpoint appears under one explicit Swagger tag only.

## Final Swagger Groups

- Customer Marketplace
- Customer Wishlist
- Customer Addresses
- Customer Contacts
- Customer Events
- Customer Event Reminder Settings
- Customer Cart
- Customer Orders
- Notifications
- Gift Categories
- Gift Management
- Provider Inventory
- Promotional Offers Management
- Provider Promotional Offers
- Payments

## API List

### Customer Marketplace

```txt
GET    /customer/home
GET    /customer/categories
GET    /customer/gifts
GET    /customer/gifts/discounted
GET    /customer/gifts/filter-options
GET    /customer/gifts/:id
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

Examples:

**POST /customer/addresses**

```json
{
  "label": "Home",
  "fullName": "Sarah Khan",
  "phone": "+923001234567",
  "line1": "House 12, Street 4, F-8/2",
  "line2": "Near Centaurus Mall",
  "city": "Islamabad",
  "state": "Islamabad Capital Territory",
  "country": "Pakistan"
}
```

**PATCH /customer/addresses/:id**

```json
{
  "label": "Home",
  "fullName": "Sarah Khan",
  "phone": "+923001234567",
  "line1": "House 12, Street 4, F-8/2",
  "line2": "Near Centaurus Mall",
  "city": "Islamabad",
  "state": "Islamabad Capital Territory",
  "country": "Pakistan"
}
```

### Customer Contacts

```txt
GET    /customer/contacts
POST   /customer/contacts
GET    /customer/contacts/:id
PATCH  /customer/contacts/:id
DELETE /customer/contacts/:id
```

Examples:

**POST /customer/contacts**

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

**PATCH /customer/contacts/:id**

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

### Customer Events

```txt
GET    /customer/events
POST   /customer/events
GET    /customer/events/calendar
GET    /customer/events/upcoming
GET    /customer/events/:id
PATCH  /customer/events/:id
DELETE /customer/events/:id
```

Examples:

**POST /customer/events**

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
  ]
}
```

**PATCH /customer/events/:id**

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
  ]
}
```

### Customer Event Reminder Settings

```txt
GET    /customer/events/:id/reminder-settings
PATCH  /customer/events/:id/reminder-settings
```

Examples:

**PATCH /customer/events/:id/reminder-settings**

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

### Customer Cart

```txt
GET    /customer/cart
POST   /customer/cart/items
PATCH  /customer/cart/items/:id
DELETE /customer/cart/items/:id
DELETE /customer/cart
```

Examples:

**POST /customer/cart/items**

```json
{
  "giftId": "cmf0giftroses001",
  "variantId": "cmf0variant50ml001",
  "quantity": 1,
  "deliveryOption": "SAME_DAY",
  "recipientContactId": "cmf0contactmary001",
  "recipientName": "Sarah Khan",
  "recipientPhone": "+923001234567",
  "recipientAddressId": "cmf0addresshome001",
  "eventId": "cmf0eventbirthday001",
  "giftMessage": "Hope you love this special surprise!",
  "messageMediaUrls": [
    "https://cdn.yourdomain.com/gift-message-media/photo.png"
  ],
  "scheduledDeliveryAt": "2026-12-24T10:00:00.000Z"
}
```

**PATCH /customer/cart/items/:id**

```json
{
  "variantId": "cmf0variant100ml001",
  "quantity": 2,
  "deliveryOption": "SCHEDULED",
  "recipientContactId": "cmf0contactmary001",
  "recipientName": "Sarah Khan",
  "recipientPhone": "+923001234567",
  "recipientAddressId": "cmf0addresshome001",
  "eventId": "cmf0eventbirthday001",
  "giftMessage": "Updated gift note.",
  "messageMediaUrls": [
    "https://cdn.yourdomain.com/gift-message-media/video.mp4"
  ],
  "scheduledDeliveryAt": "2026-12-25T10:00:00.000Z"
}
```

### Customer Orders

```txt
POST   /customer/orders
GET    /customer/orders
GET    /customer/orders/:id
```

Examples:

**POST /customer/orders**

```json
{
  "deliveryAddressId": "cmf0addresshome001",
  "paymentMethod": "COD"
}
```

### Notifications

```txt
GET    /broadcasts
POST   /broadcasts
POST   /broadcasts/estimate-reach
GET    /notifications
POST   /notifications/device-tokens
GET    /notifications/preferences
PATCH  /notifications/preferences
PATCH  /notifications/read-all
GET    /notifications/summary
GET    /broadcasts/:id
PATCH  /broadcasts/:id
POST   /broadcasts/:id/cancel
GET    /broadcasts/:id/recipients
GET    /broadcasts/:id/report
PATCH  /broadcasts/:id/schedule
PATCH  /broadcasts/:id/targeting
POST   /notifications/:id/action
PATCH  /notifications/:id/read
DELETE /notifications/device-tokens/:id
```

Examples:

**POST /broadcasts**

```json
{
  "channels": [
    "EMAIL"
  ],
  "priority": "LOW"
}
```

**POST /broadcasts/estimate-reach**

```json
{
  "channels": [
    "EMAIL"
  ],
  "targeting": {
    "mode": "ALL_USERS",
    "roles": [
      "ADMIN"
    ],
    "filters": {
      "onlyVerifiedEmails": true,
      "excludeUnsubscribed": true,
      "excludeSuspended": true
    }
  }
}
```

**POST /notifications/device-tokens**

```json
{
  "token": "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]",
  "platform": "IOS",
  "deviceId": "ios-iphone-15-pro-device-id"
}
```

**PATCH /notifications/preferences**

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

**PATCH /broadcasts/:id**

```json
{
  "channels": [
    "EMAIL"
  ],
  "priority": "LOW"
}
```

**PATCH /broadcasts/:id/schedule**

```json
{
  "sendMode": "NOW",
  "isRecurring": true,
  "recurrence": {}
}
```

**PATCH /broadcasts/:id/targeting**

```json
{
  "mode": "ALL_USERS",
  "roles": [
    "ADMIN"
  ],
  "filters": {
    "onlyVerifiedEmails": true,
    "excludeUnsubscribed": true,
    "excludeSuspended": true
  }
}
```

**POST /notifications/:id/action**

```json
{
  "action": "SEND_GIFT"
}
```

### Gift Categories

```txt
GET    /gift-categories
POST   /gift-categories
GET    /gift-categories/lookup
GET    /gift-categories/stats
GET    /gift-categories/:id
PATCH  /gift-categories/:id
DELETE /gift-categories/:id
```

Examples:

**POST /gift-categories**

```json
{
  "name": "Perfumes",
  "description": "Premium fragrance gifts.",
  "iconKey": "perfume",
  "backgroundColor": "#E9D5FF",
  "imageUrl": "https://<YOUR_PUBLIC_BUCKET_OR_CDN_URL>/gift-category-images/perfumes.png",
  "sortOrder": 1,
  "isActive": true
}
```

**PATCH /gift-categories/:id**

```json
{
  "backgroundColor": "#F3E8FF",
  "imageUrl": "https://<YOUR_PUBLIC_BUCKET_OR_CDN_URL>/gift-category-images/perfumes.png",
  "isActive": true
}
```

### Gift Management

```txt
GET    /gifts
POST   /gifts
GET    /gifts/export
GET    /gifts/stats
GET    /gifts/:id
PATCH  /gifts/:id
DELETE /gifts/:id
PATCH  /gifts/:id/status
```

Examples:

**POST /gifts**

```json
{
  "price": 99.5,
  "currency": "USD",
  "stockQuantity": 99.5,
  "imageUrls": [
    null
  ],
  "isPublished": true,
  "isFeatured": true,
  "tags": [
    null
  ],
  "moderationStatus": "PENDING"
}
```

**PATCH /gifts/:id**

```json
{
  "price": 99.5,
  "currency": "USD",
  "stockQuantity": 99.5,
  "imageUrls": [
    null
  ],
  "isPublished": true,
  "isFeatured": true,
  "tags": [
    null
  ]
}
```

**PATCH /gifts/:id/status**

```json
{
  "status": "ACTIVE"
}
```

### Provider Inventory

```txt
GET    /provider/inventory
POST   /provider/inventory
GET    /provider/inventory/lookup
GET    /provider/inventory/stats
GET    /provider/inventory/:id
PATCH  /provider/inventory/:id
DELETE /provider/inventory/:id
PATCH  /provider/inventory/:id/availability
```

Examples:

**POST /provider/inventory**

```json
{
  "price": 99.5,
  "stockQuantity": 99.5,
  "imageUrls": [
    null
  ],
  "isAvailable": true
}
```

**PATCH /provider/inventory/:id**

```json
{
  "price": 99.5,
  "stockQuantity": 99.5,
  "imageUrls": [
    null
  ],
  "isAvailable": true
}
```

**PATCH /provider/inventory/:id/availability**

```json
{
  "isAvailable": true
}
```

### Promotional Offers Management

```txt
GET    /promotional-offers
POST   /promotional-offers
GET    /promotional-offers/export
GET    /promotional-offers/stats
GET    /promotional-offers/:id
PATCH  /promotional-offers/:id
DELETE /promotional-offers/:id
PATCH  /promotional-offers/:id/approve
PATCH  /promotional-offers/:id/reject
PATCH  /promotional-offers/:id/status
```

Examples:

**POST /promotional-offers**

```json
{
  "discountType": "PERCENTAGE",
  "discountValue": 99.5,
  "isActive": true,
  "approvalStatus": "PENDING"
}
```

**PATCH /promotional-offers/:id**

```json
{
  "discountType": "PERCENTAGE",
  "discountValue": 99.5,
  "isActive": true
}
```

**PATCH /promotional-offers/:id/approve**

```json
{
  "notifyProvider": true
}
```

**PATCH /promotional-offers/:id/reject**

```json
{
  "reason": "INVALID_DISCOUNT",
  "notifyProvider": true
}
```

**PATCH /promotional-offers/:id/status**

```json
{
  "isActive": true
}
```

### Provider Promotional Offers

```txt
GET    /provider/offers
POST   /provider/offers
GET    /provider/offers/:id
PATCH  /provider/offers/:id
DELETE /provider/offers/:id
PATCH  /provider/offers/:id/status
```

Examples:

**POST /provider/offers**

```json
{
  "discountType": "PERCENTAGE",
  "discountValue": 99.5,
  "isActive": true
}
```

**PATCH /provider/offers/:id**

```json
{
  "discountType": "PERCENTAGE",
  "discountValue": 99.5,
  "isActive": true
}
```

**PATCH /provider/offers/:id/status**

```json
{
  "isActive": true
}
```

### Payments

_No endpoints registered yet._

### Admin Roles / RBAC

```txt
GET    /admin-roles
POST   /admin-roles
GET    /permissions/catalog
GET    /admin-roles/:id
PATCH  /admin-roles/:id
DELETE /admin-roles/:id
PATCH  /admin-roles/:id/permissions
```

Examples:

**POST /admin-roles**

```json
{
  "permissions": {}
}
```

**PATCH /admin-roles/:id**

```json
{
  "isActive": true
}
```

**PATCH /admin-roles/:id/permissions**

```json
{
  "permissions": {}
}
```

### Admin Staff Management

```txt
GET    /admins
POST   /admins
GET    /admins/:id
PATCH  /admins/:id
PATCH  /admins/:id/active-status
PATCH  /admins/:id/password
```

Examples:

**POST /admins**

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

**PATCH /admins/:id**

```json
{
  "isActive": true
}
```

**PATCH /admins/:id/active-status**

```json
{
  "isActive": true
}
```

**PATCH /admins/:id/password**

```json
{
  "generateTemporaryPassword": true,
  "mustChangePassword": true,
  "sendEmail": true
}
```

### Audit Logs

```txt
GET    /audit-logs
GET    /audit-logs/export
GET    /audit-logs/:id
```

### Auth

```txt
DELETE /auth/account
POST   /auth/cancel-deletion
PATCH  /auth/change-password
POST   /auth/forgot-password
POST   /auth/guest/session
POST   /auth/login
POST   /auth/logout
GET    /auth/me
POST   /auth/providers/register
POST   /auth/refresh
POST   /auth/resend-otp
POST   /auth/reset-password
POST   /auth/users/register
POST   /auth/verify-email
POST   /auth/verify-reset-otp
```

Examples:

**POST /auth/forgot-password**

```json
{
  "email": "user@example.com"
}
```

**POST /auth/guest/session**

```json
{
  "capabilities": [
    null
  ]
}
```

**POST /auth/providers/register**

```json
{
  "fulfillmentMethods": [
    "PICKUP"
  ],
  "autoAcceptOrders": true
}
```

**POST /auth/reset-password**

```json
{
  "email": "user@example.com",
  "otp": "334018",
  "newPassword": "NewPassword@123"
}
```

**POST /auth/verify-reset-otp**

```json
{
  "email": "user@example.com",
  "otp": "334018"
}
```

### Coupons

```txt
GET    /coupons
POST   /coupons
GET    /coupons/:id
PATCH  /coupons/:id
DELETE /coupons/:id
PATCH  /coupons/:id/status
```

Examples:

**POST /coupons**

```json
{
  "discountType": "PERCENTAGE",
  "discountValue": 99.5,
  "planIds": [
    null
  ],
  "maxRedemptions": 99.5,
  "isActive": true
}
```

**PATCH /coupons/:id**

```json
{
  "discountType": "PERCENTAGE",
  "discountValue": 99.5,
  "planIds": [
    null
  ],
  "maxRedemptions": 99.5,
  "isActive": true
}
```

**PATCH /coupons/:id/status**

```json
{
  "status": "ACTIVE"
}
```

### Gift Moderation

```txt
GET    /gift-moderation
PATCH  /gift-moderation/:id/approve
PATCH  /gift-moderation/:id/flag
PATCH  /gift-moderation/:id/reject
```

Examples:

**PATCH /gift-moderation/:id/approve**

```json
{
  "publishNow": true,
  "notifyProvider": true
}
```

**PATCH /gift-moderation/:id/flag**

```json
{
  "reason": "NEEDS_MANUAL_REVIEW"
}
```

**PATCH /gift-moderation/:id/reject**

```json
{
  "reason": "INCOMPLETE_INFORMATION",
  "notifyProvider": true
}
```

### Login Attempts

```txt
GET    /login-attempts
GET    /login-attempts/export
GET    /login-attempts/stats
```

### Provider Management

```txt
GET    /provider-business-categories
POST   /provider-business-categories
GET    /providers
POST   /providers
GET    /providers/export
GET    /providers/lookup
GET    /providers/stats
GET    /provider-business-categories/:id
PATCH  /provider-business-categories/:id
DELETE /provider-business-categories/:id
GET    /providers/:id
PATCH  /providers/:id
GET    /providers/:id/activity
PATCH  /providers/:id/approve
GET    /providers/:id/items
POST   /providers/:id/message
PATCH  /providers/:id/reject
PATCH  /providers/:id/status
POST   /providers/:id/suspend
POST   /providers/:id/unsuspend
```

Examples:

**POST /provider-business-categories**

```json
{
  "sortOrder": 99.5,
  "isActive": true
}
```

**POST /providers**

```json
{
  "businessName": "Gifts & Blooms Co. Ltd",
  "email": "contact@giftsandblooms.com",
  "phone": "+15551234567",
  "serviceArea": "New York, USA",
  "headquarters": "New York, USA",
  "documentUrls": [
    null
  ],
  "generateTemporaryPassword": true,
  "mustChangePassword": true
}
```

**PATCH /provider-business-categories/:id**

```json
{
  "sortOrder": 99.5,
  "isActive": true
}
```

**PATCH /providers/:id**

```json
{
  "businessName": "Gifts & Blooms Co. Ltd",
  "phone": "+15551234567",
  "serviceArea": "New York, USA",
  "headquarters": "New York, USA",
  "avatarUrl": "https://<YOUR_PUBLIC_BUCKET_OR_CDN_URL>/provider-logos/logo.png",
  "documentUrls": [
    null
  ]
}
```

**PATCH /providers/:id/approve**

```json
{
  "comment": "Documents verified successfully.",
  "notifyProvider": true
}
```

**POST /providers/:id/message**

```json
{
  "subject": "Account update",
  "message": "Please update your business documents.",
  "channel": "EMAIL"
}
```

**PATCH /providers/:id/reject**

```json
{
  "reason": "INCOMPLETE_DOCUMENTS",
  "comment": "Business license document is missing.",
  "notifyProvider": true
}
```

**PATCH /providers/:id/status**

```json
{
  "status": "ACTIVE",
  "reason": "POLICY_VIOLATION",
  "comment": "Provider violated platform policy.",
  "notifyProvider": true
}
```

**POST /providers/:id/suspend**

```json
{
  "status": "ACTIVE",
  "reason": "POLICY_VIOLATION",
  "comment": "Provider violated platform policy.",
  "notifyProvider": true
}
```

**POST /providers/:id/unsuspend**

```json
{
  "status": "ACTIVE",
  "reason": "POLICY_VIOLATION",
  "comment": "Provider violated platform policy.",
  "notifyProvider": true
}
```

### Storage

```txt
GET    /uploads
POST   /uploads/complete
POST   /uploads/presigned-url
GET    /uploads/:id
DELETE /uploads/:id
```

Examples:

**POST /uploads/complete**

```json
{
  "sizeBytes": 99.5
}
```

**POST /uploads/presigned-url**

```json
{
  "folder": "admin-avatars",
  "fileName": "avatar.png",
  "contentType": "image/png",
  "sizeBytes": 1048576,
  "targetAccountId": "target_account_id",
  "giftId": "gift_id"
}
```

### Subscription Plans

```txt
GET    /plan-features
POST   /plan-features
GET    /plan-features/catalog
GET    /subscription-plans
POST   /subscription-plans
GET    /subscription-plans/stats
GET    /plan-features/:id
PATCH  /plan-features/:id
DELETE /plan-features/:id
GET    /subscription-plans/:id
PATCH  /subscription-plans/:id
DELETE /subscription-plans/:id
GET    /subscription-plans/:id/analytics
PATCH  /subscription-plans/:id/status
PATCH  /subscription-plans/:id/visibility
```

Examples:

**POST /plan-features**

```json
{
  "type": "BOOLEAN",
  "isActive": true,
  "sortOrder": 99.5
}
```

**POST /subscription-plans**

```json
{
  "monthlyPrice": 99.5,
  "yearlyPrice": 99.5,
  "currency": "USD",
  "visibility": "PUBLIC",
  "status": "ACTIVE",
  "isPopular": true,
  "features": {},
  "limits": {
    "maxGiftsPerMonth": 99.5,
    "maxGroupGiftingEvents": 99.5,
    "maxTeamMembers": 99.5,
    "storageGb": 99.5
  }
}
```

**PATCH /plan-features/:id**

```json
{
  "type": "BOOLEAN",
  "isActive": true,
  "sortOrder": 99.5
}
```

**PATCH /subscription-plans/:id**

```json
{
  "monthlyPrice": 99.5,
  "yearlyPrice": 99.5,
  "visibility": "PUBLIC",
  "status": "ACTIVE",
  "isPopular": true,
  "features": {},
  "limits": {
    "maxGiftsPerMonth": 99.5,
    "maxGroupGiftingEvents": 99.5,
    "maxTeamMembers": 99.5,
    "storageGb": 99.5
  }
}
```

**PATCH /subscription-plans/:id/status**

```json
{
  "status": "ACTIVE"
}
```

**PATCH /subscription-plans/:id/visibility**

```json
{
  "visibility": "PUBLIC"
}
```

### User Management

```txt
GET    /users
GET    /users/export
GET    /users/:id
PATCH  /users/:id
GET    /users/:id/activity
POST   /users/:id/reset-password
GET    /users/:id/stats
PATCH  /users/:id/status
POST   /users/:id/suspend
POST   /users/:id/unsuspend
```

Examples:

**PATCH /users/:id**

```json
{
  "firstName": "Alex",
  "lastName": "Johnson",
  "phone": "+15552345678",
  "avatarUrl": "https://<YOUR_PUBLIC_BUCKET_OR_CDN_URL>/user-avatars/avatar.jpg",
  "location": "New York, USA"
}
```

**POST /users/:id/reset-password**

```json
{
  "sendEmail": true
}
```

**PATCH /users/:id/status**

```json
{
  "status": "ACTIVE",
  "reason": "POLICY_VIOLATION",
  "comment": "Suspicious activity detected on this account.",
  "notifyUser": true
}
```

**POST /users/:id/suspend**

```json
{
  "reason": "POLICY_VIOLATION",
  "comment": "Suspicious account activity.",
  "notifyUser": true
}
```

**POST /users/:id/unsuspend**

```json
{
  "comment": "Account reviewed and restored.",
  "notifyUser": true
}
```
