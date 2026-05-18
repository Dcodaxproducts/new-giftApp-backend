# Customer Order State Machine

OrderStatus: PENDING → CONFIRMED → PROCESSING/PARTIAL → SHIPPED/READY_FOR_PICKUP/OUT_FOR_DELIVERY → DELIVERED → COMPLETED. Terminal: COMPLETED, CANCELLED, FAILED.

Invalid transitions return `INVALID_STATUS_TRANSITION` with current status, requested status, and allowed next statuses.
