import { Injectable, inject, NgZone } from '@angular/core';
import { collection, onSnapshot, query, doc, updateDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase.config';
import { Observable } from 'rxjs';
import { Sample } from '../models/sample.model';

@Injectable({
  providedIn: 'root'
})
export class SampleService {
  private zone = inject(NgZone);

  getSamples(): Observable<Sample[]> {
    return new Observable<Sample[]>(observer => {
      const q = query(collection(db, 'samples'));

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const samples: Sample[] = [];
        snapshot.forEach((docSnap) => {
          samples.push({ id: docSnap.id, ...docSnap.data() } as Sample);
        });
        this.zone.run(() => observer.next(samples));
      }, (error) => {
        this.zone.run(() => observer.error(error));
      });

      return () => unsubscribe();
    });
  }

  async addSample(sample: Omit<Sample, 'id'>): Promise<void> {
    const { getDocs, collection } = await import('firebase/firestore');
    const snap = await getDocs(collection(db, 'samples'));
    let maxId = 0;
    snap.forEach(d => {
      const parts = d.id.split('-');
      if (parts.length > 1) {
        const num = parseInt(parts[1], 10);
        if (!isNaN(num) && num > maxId) {
          maxId = num;
        }
      }
    });
    
    const newId = `SMP-${(maxId + 1).toString().padStart(4, '0')}`;
    await setDoc(doc(db, 'samples', newId), {
      ...sample
    });
  }

  async updateStatus(sampleId: string, status: string): Promise<void> {
    const docRef = doc(db, 'samples', sampleId);
    await updateDoc(docRef, { status });
  }

  async updateCompletionDate(sampleId: string, date: string): Promise<void> {
    const docRef = doc(db, 'samples', sampleId);
    await updateDoc(docRef, { completion_date: date });
  }

  async updateSample(sampleId: string, data: Partial<Sample>): Promise<void> {
    const docRef = doc(db, 'samples', sampleId);
    await updateDoc(docRef, data);
  }
}
