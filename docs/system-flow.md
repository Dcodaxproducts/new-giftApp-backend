# System Flow Metadata

This document summarizes the platform-level workflows exposed by `GET /api/v1/admin/workflows/app-flow`.

1. Super Admin config → provider onboarding → provider approval
2. Provider inventory/offers → marketplace visibility
3. Customer/guest marketplace browsing
4. Customer contacts/events → cart → payment intent → payment confirmation → order
5. Order split → provider sub-orders → provider accept/reject/status/fulfill → parent order sync
6. Customer/provider chat → notification fallback → support escalation
7. Refund request → provider/admin decision → refund ledger
8. Dispute → evidence → decision → refund/financial adjustment
9. Provider earnings → payout request → admin approve/hold/reject → payout completion
10. Broadcast creation → scheduling → delivery → report
11. Notification creation → socket/push/email delivery → read/action
12. Upload presigned URL → completion → usage validation

Transition rules are centralized in `src/modules/workflow-metadata/services/*state-machine.service.ts`.
