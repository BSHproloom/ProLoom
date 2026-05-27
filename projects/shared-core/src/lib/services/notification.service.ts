import { Injectable, inject } from '@angular/core';
import { Firestore, collection, addDoc, query, where, orderBy, onSnapshot, doc, updateDoc } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { Notification } from '../models/notification.model';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private firestore = inject(Firestore);

  /**
   * Send a new notification to a specific user or role
   */
  async sendNotification(notification: Notification): Promise<string> {
    try {
      const docRef = await addDoc(collection(this.firestore, 'notifications'), {
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
        collection(this.firestore, 'notifications'),
        where('recipient_email', '==', email),
        orderBy('timestamp', 'desc')
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const notifications: Notification[] = [];
        snapshot.forEach((doc) => {
          notifications.push({ id: doc.id, ...doc.data() } as Notification);
        });
        observer.next(notifications);
      }, (error) => {
        observer.error(error);
      });

      return () => unsubscribe();
    });
  }

  /**
   * Mark a notification as read
   */
  async markAsRead(notificationId: string): Promise<void> {
    const docRef = doc(this.firestore, 'notifications', notificationId);
    await updateDoc(docRef, { read_status: true });
  }
}
