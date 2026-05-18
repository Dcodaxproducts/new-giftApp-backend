# Broadcast State Machine

BroadcastStatus: DRAFT → SCHEDULED/PROCESSING → SENT/FAILED, with cancellation before send.

Invalid transitions return `INVALID_STATUS_TRANSITION` with current status, requested status, and allowed next statuses.
