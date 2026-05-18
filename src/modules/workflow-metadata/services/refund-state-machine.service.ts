import { Injectable } from '@nestjs/common';
import { RefundRequestStatus } from '@prisma/client';
import { BaseStateMachineService, StateMachineDefinition } from './base-state-machine.service';
@Injectable()
export class RefundStateMachineService extends BaseStateMachineService<RefundRequestStatus> { definition(): StateMachineDefinition<RefundRequestStatus> { return { name: 'refund', persistedEnum: 'RefundRequestStatus', terminalStates: [RefundRequestStatus.REFUNDED, RefundRequestStatus.REJECTED, RefundRequestStatus.FAILED], transitions: { REQUESTED: [RefundRequestStatus.APPROVED, RefundRequestStatus.REJECTED], APPROVED: [RefundRequestStatus.REFUND_PROCESSING, RefundRequestStatus.REFUNDED, RefundRequestStatus.FAILED], REFUND_PROCESSING: [RefundRequestStatus.REFUNDED, RefundRequestStatus.FAILED], REFUNDED: [], REJECTED: [], FAILED: [] } }; } }
