import { Injectable } from '@nestjs/common';
import { PaymentStatus } from '@prisma/client';
import { BaseStateMachineService, StateMachineDefinition } from './base-state-machine.service';
@Injectable()
export class PaymentStateMachineService extends BaseStateMachineService<PaymentStatus> { definition(): StateMachineDefinition<PaymentStatus> { return { name: 'payment', persistedEnum: 'PaymentStatus', aliases: { SUCCESS: PaymentStatus.SUCCEEDED }, externalAliases: { SUCCESS: 'SUCCEEDED', stripe_succeeded: 'SUCCEEDED' }, terminalStates: [PaymentStatus.SUCCEEDED, PaymentStatus.FAILED, PaymentStatus.CANCELLED, PaymentStatus.REFUNDED], transitions: { PENDING: [PaymentStatus.PROCESSING, PaymentStatus.CANCELLED, PaymentStatus.FAILED], PROCESSING: [PaymentStatus.SUCCEEDED, PaymentStatus.FAILED, PaymentStatus.CANCELLED], SUCCEEDED: [PaymentStatus.REFUNDED], FAILED: [], CANCELLED: [], REFUNDED: [] } }; } }
