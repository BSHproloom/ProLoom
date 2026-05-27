import { Injectable, inject, NgZone } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { collection, onSnapshot, addDoc, deleteDoc, doc, query } from 'firebase/firestore';
import { db } from '../firebase.config';
import { User } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private usersSubject = new BehaviorSubject<User[]>([]);
  public users$ = this.usersSubject.asObservable();
  private zone = inject(NgZone);

  constructor() {
    this.listenToFirestore();
  }

  private listenToFirestore() {
    const q = query(collection(db, 'users'));
    onSnapshot(q, (snapshot) => {
      const usersData: User[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        usersData.push({
          id: docSnap.id,
          name: data['name'],
          email: data['email'],
          role: data['role']
        });
      });
      
      // Sort alphabetically by name
      usersData.sort((a, b) => a.name.localeCompare(b.name));

      this.zone.run(() => {
        this.usersSubject.next(usersData);
      });
    }, (error) => {
      console.error("Error listening to users:", error);
    });
  }

  getUsers(): Observable<User[]> {
    return this.users$;
  }

  async addUser(user: User) {
    try {
      await addDoc(collection(db, 'users'), user);
    } catch (error) {
      console.error('Error adding user:', error);
      throw error;
    }
  }

  async deleteUser(userId: string) {
    try {
      await deleteDoc(doc(db, 'users', userId));
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  }
}
