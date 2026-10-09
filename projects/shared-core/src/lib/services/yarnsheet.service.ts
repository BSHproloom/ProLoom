import { Injectable } from '@angular/core';
import { collection, addDoc, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase.config';
import { Yarnsheet } from '../models/yarnsheet.model';
import { Observable, from } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class YarnsheetService {

  constructor() { }

  /**
   * Save a new yarnsheet
   */
  async saveYarnsheet(yarnsheet: Yarnsheet): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, 'yarnsheets'), yarnsheet);
      return docRef.id;
    } catch (error) {
      console.error('Error adding yarnsheet: ', error);
      throw error;
    }
  }

  /**
   * Get all yarnsheets for a specific carpet
   */
  getYarnsheetsForCarpet(carpetId: string): Observable<Yarnsheet[]> {
    return from((async () => {
      const q = query(collection(db, 'yarnsheets'), where("carpet_id", "==", carpetId));
      const querySnapshot = await getDocs(q);
      const sheets: Yarnsheet[] = [];
      querySnapshot.forEach((doc) => {
        sheets.push({ id: doc.id, ...doc.data() } as Yarnsheet);
      });
      return sheets;
    })());
  }
}
