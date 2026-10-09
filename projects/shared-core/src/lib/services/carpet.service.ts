import { Injectable, inject, NgZone } from '@angular/core';
import { collection, onSnapshot, query, where, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase.config';
import { Observable } from 'rxjs';
import { Carpet } from '../models/carpet.model';

@Injectable({
  providedIn: 'root'
})
export class CarpetService {
  private zone = inject(NgZone);

  /**
   * Listen to all carpets for a specific designer
   */
  getCarpetsForDesigner(designerName: string): Observable<Carpet[]> {
    return new Observable<Carpet[]>(observer => {
      const q = query(
        collection(db, 'carpets'),
        where('designer', '==', designerName)
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const carpets: Carpet[] = [];
        snapshot.forEach((docSnap) => {
          carpets.push({ id: docSnap.id, ...docSnap.data() } as Carpet);
        });
        this.zone.run(() => observer.next(carpets));
      }, (error) => {
        this.zone.run(() => observer.error(error));
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
        collection(db, 'carpets'),
        where('project_fk', '==', projectId)
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const carpets: Carpet[] = [];
        snapshot.forEach((docSnap) => {
          carpets.push({ id: docSnap.id, ...docSnap.data() } as Carpet);
        });
        this.zone.run(() => observer.next(carpets));
      }, (error) => {
        this.zone.run(() => observer.error(error));
      });

      return () => unsubscribe();
    });
  }

  /**
   * Listen to all carpets globally (for Admin queues)
   */
  getAllCarpets(): Observable<Carpet[]> {
    return new Observable<Carpet[]>(observer => {
      const q = query(collection(db, 'carpets'));

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const carpets: Carpet[] = [];
        snapshot.forEach((docSnap) => {
          carpets.push({ id: docSnap.id, ...docSnap.data() } as Carpet);
        });
        this.zone.run(() => observer.next(carpets));
      }, (error) => {
        this.zone.run(() => observer.error(error));
      });

      return () => unsubscribe();
    });
  }

  /**
   * Update carpet data
   */
  async updateCarpet(carpetId: string, data: Partial<Carpet>): Promise<void> {
    try {
      if (data.status) {
        data.status_updated_at = new Date();
      }
      const docRef = doc(db, 'carpets', carpetId);
      await updateDoc(docRef, data);
    } catch (error) {
      console.error('Error updating carpet: ', error);
      throw error;
    }
  }

  /**
   * Add new carpet
   */
  async addCarpet(carpetData: any): Promise<string> {
    const { getDocs, collection, doc, setDoc } = await import('firebase/firestore');
    let nextSkuNum = 1;
    const carpetsSnap = await getDocs(collection(db, 'carpets'));
    let maxNum = 0;
    carpetsSnap.forEach(cDoc => {
      const id = cDoc.id;
      if (id.startsWith('BSH_CC_')) {
        const numPart = id.split('_')[2];
        if (numPart) {
          const num = parseInt(numPart, 10);
          if (!isNaN(num) && num > maxNum) {
            maxNum = num;
          }
        }
      }
    });
    nextSkuNum = maxNum + 1;
    const skuId = `BSH_CC_${nextSkuNum.toString().padStart(5, '0')}`;
    
    const newCarpet = {
      ...carpetData,
      composite_item_name: carpetData.name || carpetData.composite_item_name,
      no_of_rugs: carpetData.quantity || carpetData.no_of_rugs,
      yarn_sheet_status: 'Pending',
      status: carpetData.status || 'Need to Assign',
      is_working: carpetData.is_working || false,
      time_spent_seconds: carpetData.time_spent_seconds || 0,
      designer_readiness_date: null,
      start_time: null
    };
    
    // Explicitly use the provided ID if present, otherwise use the generated SKU
    const finalId = carpetData.id || skuId;


    await setDoc(doc(db, 'carpets', finalId), newCarpet);
  return finalId;
  }

  /**
   * Get single carpet by ID
   */
  async getCarpetById(carpetId: string): Promise<Carpet | null> {
    const { doc, getDoc } = await import('firebase/firestore');
    const docRef = doc(db, 'carpets', carpetId);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return { id: snap.id, ...snap.data() } as Carpet;
    }
    return null;
  }
}
