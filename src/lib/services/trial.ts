import { SubscriptionStatus } from '@/generated/prisma';
import { db } from '../db';

/**
 * Check if a user's trial has expired and auto-expire it in the database.
 * Returns the (possibly updated) subscription status.
 */
export async function checkAndExpireTrial(
  userId: string,
  currentStatus: SubscriptionStatus,
  trialEndsAt: Date | null
): Promise<SubscriptionStatus> {
  if (currentStatus === 'TRIAL' && trialEndsAt && new Date(trialEndsAt) <= new Date()) {
    await db.user.update({
      where: { id: userId },
      data: { subscriptionStatus: 'EXPIRED' },
    });
    return 'EXPIRED';
  }
  return currentStatus;
}
