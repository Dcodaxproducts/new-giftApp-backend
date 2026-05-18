# Notification State Machine

Notification lifecycle: CREATED → socket/push/email delivery attempts → READ or FAILED.

Invalid transitions return `INVALID_STATUS_TRANSITION` with current status, requested status, and allowed next statuses.
