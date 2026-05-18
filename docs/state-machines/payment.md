# Payment State Machine

PaymentStatus: PENDING → PROCESSING → SUCCEEDED/FAILED/CANCELLED → REFUNDED. External SUCCESS maps to SUCCEEDED.

Invalid transitions return `INVALID_STATUS_TRANSITION` with current status, requested status, and allowed next statuses.
