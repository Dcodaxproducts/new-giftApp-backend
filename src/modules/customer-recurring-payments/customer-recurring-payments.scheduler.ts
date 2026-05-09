import { Injectable } from '@nestjs/common';
import { CustomerRecurringPaymentsService } from './customer-recurring-payments.service';

@Injectable()
export class CustomerRecurringPaymentsScheduler {
  constructor(private readonly recurringPayments: CustomerRecurringPaymentsService) {}

  async processDueRecurringPayments(now = new Date()) {
    return this.recurringPayments.processDue(now);
  }
}
