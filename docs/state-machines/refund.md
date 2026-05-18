# Refund State Machine

RefundRequestStatus: REQUESTED → APPROVED/REJECTED → REFUND_PROCESSING → REFUNDED/FAILED.

Invalid transitions return `INVALID_STATUS_TRANSITION` with current status, requested status, and allowed next statuses.
