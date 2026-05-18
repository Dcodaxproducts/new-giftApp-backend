# Provider Order State Machine

ProviderOrderStatus: PENDING → ACCEPTED → PROCESSING → PACKED → READY_FOR_PICKUP/SHIPPED → OUT_FOR_DELIVERY → DELIVERED → COMPLETED. External READY_TO_FULFILL is an alias of READY_FOR_PICKUP.

Invalid transitions return `INVALID_STATUS_TRANSITION` with current status, requested status, and allowed next statuses.
