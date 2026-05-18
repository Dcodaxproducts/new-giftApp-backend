# Real-Time Notification Events

Namespace: `/notifications` (Socket.IO).

## Auth
Pass JWT as `auth.token = "Bearer <accessToken>"` or `Authorization: Bearer <accessToken>`.

## Client → Server
- `notification.read` `{ notificationId }`

## Server → Client
- `notification.received`
- `notification.read`
- `notification.updated`
- `notification.delivery.failed`
- `broadcast.delivery.progress`
- `broadcast.delivery.completed`
- `broadcast.delivery.failed`

## Notes
- Notifications are persisted before socket emission.
- Socket payload metadata is sanitized before delivery.
- Push/email failures must not roll back the business operation.
- REST notification APIs remain the source of truth for notification center history, preferences, read state, device tokens, and summaries.
