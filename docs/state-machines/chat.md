# Chat State Machine

Chat lifecycle: CREATED → DELIVERED → READ, with moderation FLAGGED/HIDDEN side path.

Invalid transitions return `INVALID_STATUS_TRANSITION` with current status, requested status, and allowed next statuses.
