# Payout State Machine

ProviderPayoutStatus: PENDING → PROCESSING/ON_HOLD/REJECTED/CANCELLED → COMPLETED/FAILED.

Invalid transitions return `INVALID_STATUS_TRANSITION` with current status, requested status, and allowed next statuses.
