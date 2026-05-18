# Dispute State Machine

DisputeStatus: OPEN → IN_REVIEW/ESCALATED → RESOLVED/REJECTED/APPROVED.

Invalid transitions return `INVALID_STATUS_TRANSITION` with current status, requested status, and allowed next statuses.
