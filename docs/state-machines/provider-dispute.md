# Provider Dispute State Machine

ProviderDisputeStatus: OPEN → EVIDENCE_PHASE/UNDER_REVIEW → RULING_PENDING/ESCALATED → RESOLVED/DENIED.

Invalid transitions return `INVALID_STATUS_TRANSITION` with current status, requested status, and allowed next statuses.
