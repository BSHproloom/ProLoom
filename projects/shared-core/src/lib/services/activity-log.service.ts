import { Injectable, inject, NgZone } from '@angular/core';
import { collection, addDoc, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase.config';
import { Observable } from 'rxjs';
import { ActivityLog } from '../models/activity-log.model';

@Injectable({
  providedIn: 'root'
})
export class ActivityLogService {
  private zone = inject(NgZone);

  /**
   * Record a new activity log
   */
  async logActivity(log: ActivityLog): Promise<void> {
    try {
      await addDoc(collection(db, 'activity_logs'), log);
    } catch (error) {
      console.error('Error logging activity: ', error);
      throw error;
    }
  }

  getLogsForProject(projectId: string): Observable<ActivityLog[]> {
    return new Observable<ActivityLog[]>(observer => {
      const q = query(
        collection(db, 'activity_logs'),
        where('project_id', '==', projectId),
        orderBy('timestamp', 'desc')
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const logs: ActivityLog[] = [];
        snapshot.forEach((docSnap) => {
          logs.push({ id: docSnap.id, ...docSnap.data() } as ActivityLog);
        });
        this.zone.run(() => observer.next(logs));
      }, (error) => {
        this.zone.run(() => observer.error(error));
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
        collection(db, 'activity_logs'),
        where('carpet_id', '==', carpetId),
        orderBy('timestamp', 'asc') // chronological order
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const logs: ActivityLog[] = [];
        snapshot.forEach((docSnap) => {
          logs.push({ id: docSnap.id, ...docSnap.data() } as ActivityLog);
        });
        this.zone.run(() => observer.next(logs));
      }, (error) => {
        this.zone.run(() => observer.error(error));
      });

      return () => unsubscribe();
    });
  }

  getAllLogs(): Observable<ActivityLog[]> {
    return new Observable<ActivityLog[]>(observer => {
      const q = query(
        collection(db, 'activity_logs'),
        orderBy('timestamp', 'desc')
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const logs: ActivityLog[] = [];
        snapshot.forEach((docSnap) => {
          logs.push({ id: docSnap.id, ...docSnap.data() } as ActivityLog);
        });
        this.zone.run(() => observer.next(logs));
      }, (error) => {
        this.zone.run(() => observer.error(error));
      });

      return () => unsubscribe();
    });
  }
}
