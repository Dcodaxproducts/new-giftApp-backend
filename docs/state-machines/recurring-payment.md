# Recurring Payment State Machine

CustomerRecurringPaymentStatus: ACTIVE ↔ PAUSED, then CANCELLED/EXPIRED/FAILED terminal-style outcomes.

Invalid transitions return `INVALID_STATUS_TRANSITION` with current status, requested status, and allowed next statuses.
