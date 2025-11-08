import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { SubscriptionsService } from './subscriptions.service';

@Injectable()
export class SubscriptionExpirationCron {
  constructor(private subscriptionsService: SubscriptionsService) {}

  /**
   * Check for expired subscriptions every hour
   * Runs at the start of every hour (e.g., 1:00, 2:00, 3:00, etc.)
   */
  @Cron(CronExpression.EVERY_HOUR)
  async handleExpiredSubscriptions() {
    try {
      const result = await this.subscriptionsService.checkAndUpdateExpiredSubscriptions();
      console.log(`[Subscription Expiration Check] Checked ${result.checked} subscriptions, expired ${result.expired}`);
    } catch (error) {
      console.error('[Subscription Expiration Check] Error:', error);
    }
  }
}
