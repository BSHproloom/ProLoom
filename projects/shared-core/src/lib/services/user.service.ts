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
  public currentUser$ = new BehaviorSubject<User | null>(null);
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
          role: data['role'],
          password: data['password'],
          fcmTokens: data['fcmTokens'] || [],
          allowedTabs: data['allowedTabs']
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

  async updateUserPassword(userId: string, password: string) {
    try {
      const { updateDoc, doc } = await import('firebase/firestore');
      await updateDoc(doc(db, 'users', userId), {
        password: password
      });
    } catch (error) {
      console.error('Error updating password:', error);
      throw error;
    }
  }

  async updateUserAllowedTabs(userId: string, tabs: string[]) {
    try {
      const { updateDoc, doc } = await import('firebase/firestore');
      await updateDoc(doc(db, 'users', userId), {
        allowedTabs: tabs
      });
    } catch (error) {
      console.error('Error updating allowed tabs:', error);
      throw error;
    }
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

  async saveFcmToken(userId: string, token: string) {
    try {
      const { doc, getDoc, updateDoc, arrayUnion } = await import('firebase/firestore');
      const userRef = doc(db, 'users', userId);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const tokens = userSnap.data()['fcmTokens'] || [];
        if (!tokens.includes(token)) {
          await updateDoc(userRef, {
            fcmTokens: arrayUnion(token)
          });
        }
      }
    } catch (error) {
      console.error('Error saving FCM token:', error);
    }
  }
}
