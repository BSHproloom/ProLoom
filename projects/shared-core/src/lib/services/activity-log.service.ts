import { Injectable, inject } from '@angular/core';
import { Firestore, collection, addDoc, query, where, orderBy, onSnapshot } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { ActivityLog } from '../models/activity-log.model';

@Injectable({
  providedIn: 'root'
})
export class ActivityLogService {
  private firestore = inject(Firestore);

  /**
   * Record a new activity log
   */
  async logActivity(log: ActivityLog): Promise<void> {
    try {
      await addDoc(collection(this.firestore, 'activity_logs'), log);
    } catch (error) {
      console.error('Error logging activity: ', error);
      throw error;
    }
  }

  getLogsForProject(projectId: string): Observable<ActivityLog[]> {
    return new Observable<ActivityLog[]>(observer => {
      const q = query(
        collection(this.firestore, 'activity_logs'),
        where('project_id', '==', projectId),
        orderBy('timestamp', 'desc')
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const logs: ActivityLog[] = [];
        snapshot.forEach((doc) => {
          logs.push({ id: doc.id, ...doc.data() } as ActivityLog);
        });
        observer.next(logs);
      }, (error) => {
        observer.error(error);
      });

      return () => unsubscribe();
    });
  }

  /**
   * Listen to activity logs for a specific carpet
   */
  getLogsForCarpet(carpetId: string): Observable<ActivityLog[]> {
    return new Observable<ActivityLog[]>(observer => {
      const q = query(
        collection(this.firestore, 'activity_logs'),
        where('carpet_id', '==', carpetId),
        orderBy('timestamp', 'asc') // chronological order
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const logs: ActivityLog[] = [];
        snapshot.forEach((doc) => {
          logs.push({ id: doc.id, ...doc.data() } as ActivityLog);
        });
        observer.next(logs);
      }, (error) => {
        observer.error(error);
      });

      return () => unsubscribe();
    });
  }
}
