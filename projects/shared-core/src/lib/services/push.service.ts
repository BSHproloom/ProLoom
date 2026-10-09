import { Injectable, inject } from '@angular/core';
import { collection, addDoc, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase.config';
import { NotificationService } from './notification.service';

@Injectable({
  providedIn: 'root'
})
export class PushService {
  private notificationService = inject(NotificationService);
  private PUSH_MONTHLY_LIMIT = 1900000; // Safeguard before 2M free tier

  async sendPushNotification(fcmTokens: string[], title: string, body: string, data?: any) {
    if (!fcmTokens || fcmTokens.length === 0) return;

    try {
      // 1. Check current month's usage
      const now = new Date();
      const currentMonthYear = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      
      const statsRef = doc(db, 'system_stats', 'monthly_usage');
      const statsSnap = await getDoc(statsRef);
      
      let pushCount = 0;
      if (statsSnap.exists()) {
        const stats = statsSnap.data();
        if (stats['month_year'] === currentMonthYear) {
          pushCount = stats['push_count'] || 0;
        }
      }

      // 2. Strict Limit Check
      if (pushCount + fcmTokens.length >= this.PUSH_MONTHLY_LIMIT) {
        // We are dangerously close to the limit. Stop pushing.
        console.warn(`[BILLING SAFEGUARD] Push limit reached (${pushCount}/${this.PUSH_MONTHLY_LIMIT}). Push aborted.`);
        
        // Notify the current user via the bell UI
        await this.notificationService.sendNotification({
          recipient_email: 'all', // Ideally target the admin or current user
          recipient_role: 'Admin',
          message: 'Free tier will exceed in next notification so service temporarily stopped.',
          read_status: false,
          timestamp: new Date()
        });

        // Also we can just alert them right in the browser
        alert('WARNING: Free tier will exceed in next notification so service temporarily stopped.');
        return;
      }

      // 3. Write to push_requests to trigger Cloud Function
      await addDoc(collection(db, 'push_requests'), {
        tokens: fcmTokens,
        title,
        body,
        data: data || {},
        timestamp: new Date()
      });

      console.log('Push request queued successfully.');

    } catch (error) {
      console.error('Error queuing push API', error);
    }
  }
}
