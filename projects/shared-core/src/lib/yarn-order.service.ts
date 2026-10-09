import { Injectable, NgZone, inject } from '@angular/core';
import { collection, doc, setDoc, updateDoc, deleteDoc, onSnapshot, query } from 'firebase/firestore';
import { Observable } from 'rxjs';
import { db } from './firebase.config';
import { YarnOrderRequest } from './models/yarn-order.model';

@Injectable({
  providedIn: 'root'
})
export class YarnOrderService {
  private zone = inject(NgZone);
  constructor() {}

  getYarnOrders(): Observable<YarnOrderRequest[]> {
    return new Observable<YarnOrderRequest[]>(observer => {
      const q = query(collection(db, 'yarn_orders'));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const orders: YarnOrderRequest[] = [];
        snapshot.forEach((docSnap) => {
          orders.push({ id: docSnap.id, ...docSnap.data() } as YarnOrderRequest);
        });
        this.zone.run(() => observer.next(orders));
      }, (error) => {
        this.zone.run(() => observer.error(error));
      });
      return () => unsubscribe();
    });
  }

  async addYarnOrder(order: Partial<YarnOrderRequest>) {
    const newDocRef = doc(collection(db, 'yarn_orders'));
    order.id = newDocRef.id;
    await setDoc(newDocRef, order);
    return newDocRef.id;
  }

  async updateYarnOrder(id: string, data: Partial<YarnOrderRequest>) {
    const docRef = doc(db, 'yarn_orders', id);
    await updateDoc(docRef, data);
  }

  async deleteYarnOrder(id: string) {
    const docRef = doc(db, 'yarn_orders', id);
    await deleteDoc(docRef);
  }
}
