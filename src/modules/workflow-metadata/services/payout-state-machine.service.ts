import { Injectable } from '@nestjs/common';
import { ProviderPayoutStatus } from '@prisma/client';
import { BaseStateMachineService, StateMachineDefinition } from './base-state-machine.service';
@Injectable()
export class PayoutStateMachineService extends BaseStateMachineService<ProviderPayoutStatus> { definition(): StateMachineDefinition<ProviderPayoutStatus> { return { name: 'payout', persistedEnum: 'ProviderPayoutStatus', terminalStates: [ProviderPayoutStatus.COMPLETED, ProviderPayoutStatus.FAILED, ProviderPayoutStatus.CANCELLED, ProviderPayoutStatus.REJECTED], transitions: { PENDING: [ProviderPayoutStatus.PROCESSING, ProviderPayoutStatus.ON_HOLD, ProviderPayoutStatus.REJECTED, ProviderPayoutStatus.CANCELLED], ON_HOLD: [ProviderPayoutStatus.PROCESSING, ProviderPayoutStatus.REJECTED, ProviderPayoutStatus.CANCELLED], PROCESSING: [ProviderPayoutStatus.COMPLETED, ProviderPayoutStatus.FAILED, ProviderPayoutStatus.ON_HOLD], COMPLETED: [], FAILED: [], CANCELLED: [], REJECTED: [] } }; } }
