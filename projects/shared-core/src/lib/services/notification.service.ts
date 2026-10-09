import { Injectable, inject, NgZone } from '@angular/core';
import { collection, addDoc, query, where, orderBy, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase.config';
import { Observable } from 'rxjs';
import { Notification } from '../models/notification.model';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private zone = inject(NgZone);

  /**
   * Send a new notification to a specific user or role
   */
  async sendNotification(notification: Notification): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, 'notifications'), {
        ...notification,
        timestamp: new Date()
      });
      return docRef.id;
    } catch (e) {
      console.error('Error adding notification: ', e);
      throw e;
    }
  }

  /**
   * Listen to notifications for a specific email
   */
  getUserNotifications(email: string): Observable<Notification[]> {
    return new Observable<Notification[]>(observer => {
      const q = query(
        collection(db, 'notifications'),
        where('recipient_email', '==', email),
        orderBy('timestamp', 'desc')
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const notifications: Notification[] = [];
        snapshot.forEach((docSnap) => {
          notifications.push({ id: docSnap.id, ...docSnap.data() } as Notification);
        });
        this.zone.run(() => observer.next(notifications));
      }, (error) => {
        this.zone.run(() => observer.error(error));
      });

      return () => unsubscribe();
    });
  }

  /**
   * Listen to notifications for a specific role
   */
  getRoleNotifications(role: string): Observable<Notification[]> {
    return new Observable<Notification[]>(observer => {
      const q = query(
        collection(db, 'notifications'),
        where('recipient_role', '==', role),
        orderBy('timestamp', 'desc')
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const notifications: Notification[] = [];
        snapshot.forEach((docSnap) => {
          notifications.push({ id: docSnap.id, ...docSnap.data() } as Notification);
        });
        this.zone.run(() => observer.next(notifications));
      }, (error) => {
        this.zone.run(() => observer.error(error));
      });

      return () => unsubscribe();
    });
  }

  /**
   * Mark a notification as read
   */
  async markAsRead(notificationId: string): Promise<void> {
    const docRef = doc(db, 'notifications', notificationId);
    await updateDoc(docRef, { read_status: true });
  }
}
