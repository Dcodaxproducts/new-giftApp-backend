# Upload State Machine

UploadedFileStatus: PENDING → COMPLETED/FAILED/DELETED; COMPLETED can be DELETED by hard-delete upload flow.

Invalid transitions return `INVALID_STATUS_TRANSITION` with current status, requested status, and allowed next statuses.
