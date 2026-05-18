import { Module } from '@nestjs/common';
import { WorkflowMetadataController } from './controllers/workflow-metadata.controller';
import { DisputeStateMachineService } from './services/dispute-state-machine.service';
import { OrderStateMachineService } from './services/order-state-machine.service';
import { PaymentStateMachineService } from './services/payment-state-machine.service';
import { PayoutStateMachineService } from './services/payout-state-machine.service';
import { ProviderOrderStateMachineService } from './services/provider-order-state-machine.service';
import { RefundStateMachineService } from './services/refund-state-machine.service';
import { WorkflowMetadataService } from './services/workflow-metadata.service';
@Module({ controllers: [WorkflowMetadataController], providers: [WorkflowMetadataService, OrderStateMachineService, ProviderOrderStateMachineService, PaymentStateMachineService, RefundStateMachineService, PayoutStateMachineService, DisputeStateMachineService], exports: [OrderStateMachineService, ProviderOrderStateMachineService, PaymentStateMachineService, RefundStateMachineService, PayoutStateMachineService, DisputeStateMachineService] })
export class WorkflowMetadataModule {}
