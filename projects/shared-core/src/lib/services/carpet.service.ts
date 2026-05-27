import { Injectable, inject } from '@angular/core';
import { Firestore, collection, onSnapshot, query, where, doc, updateDoc } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { Carpet } from '../models/carpet.model';

@Injectable({
  providedIn: 'root'
})
export class CarpetService {
  private firestore = inject(Firestore);

  /**
   * Listen to all carpets for a specific designer
   */
  getCarpetsForDesigner(designerName: string): Observable<Carpet[]> {
    return new Observable<Carpet[]>(observer => {
      const q = query(
        collection(this.firestore, 'carpets'),
        where('designer', '==', designerName)
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const carpets: Carpet[] = [];
        snapshot.forEach((doc) => {
          carpets.push({ id: doc.id, ...doc.data() } as Carpet);
        });
        observer.next(carpets);
      }, (error) => {
        observer.error(error);
      });

      return () => unsubscribe();
    });
  }

  /**
   * Listen to all carpets for a specific project
   */
  getCarpetsForProject(projectId: string): Observable<Carpet[]> {
    return new Observable<Carpet[]>(observer => {
      const q = query(
        collection(this.firestore, 'carpets'),
        where('project_fk', '==', projectId)
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const carpets: Carpet[] = [];
        snapshot.forEach((doc) => {
          carpets.push({ id: doc.id, ...doc.data() } as Carpet);
        });
        observer.next(carpets);
      }, (error) => {
        observer.error(error);
      });

      return () => unsubscribe();
    });
  }

  /**
   * Listen to all carpets globally (for Admin queues)
   */
  getAllCarpets(): Observable<Carpet[]> {
    return new Observable<Carpet[]>(observer => {
      const q = query(collection(this.firestore, 'carpets'));

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const carpets: Carpet[] = [];
        snapshot.forEach((doc) => {
          carpets.push({ id: doc.id, ...doc.data() } as Carpet);
        });
        observer.next(carpets);
      }, (error) => {
        observer.error(error);
      });

      return () => unsubscribe();
    });
  }

  /**
   * Update carpet data
   */
  async updateCarpet(carpetId: string, data: Partial<Carpet>): Promise<void> {
    try {
      const docRef = doc(this.firestore, 'carpets', carpetId);
      await updateDoc(docRef, data);
    } catch (error) {
      console.error('Error updating carpet: ', error);
      throw error;
    }
  }
}
