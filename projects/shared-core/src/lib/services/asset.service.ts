import { Injectable, inject, NgZone } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { doc, collection, onSnapshot, deleteDoc, setDoc, query, orderBy } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '../firebase.config';
import { Asset } from '../models/asset.model';

@Injectable({
  providedIn: 'root'
})
export class AssetService {
  private assetsSubject = new BehaviorSubject<Asset[]>([]);
  public assets$ = this.assetsSubject.asObservable();
  private zone = inject(NgZone);

  constructor() {
    this.listenToAssets();
  }

  private listenToAssets() {
    const q = query(collection(db, 'assets'), orderBy('uploadedAt', 'desc'));
    onSnapshot(q, (snapshot) => {
      const data: Asset[] = [];
      snapshot.forEach(d => {
        data.push({ id: d.id, ...d.data() } as Asset);
      });
      this.zone.run(() => this.assetsSubject.next(data));
    });
  }

  async uploadAsset(file: File, onProgress?: (progress: number) => void): Promise<Asset> {
    const storageRef = ref(storage, `assets/${file.name}`);
    const uploadTask = uploadBytesResumable(storageRef, file);

    return new Promise((resolve, reject) => {
      uploadTask.on('state_changed', 
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          if (onProgress) onProgress(progress);
        }, 
        (error) => reject(error), 
        async () => {
          const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
          const asset: Asset = {
            id: doc(collection(db, 'assets')).id,
            name: file.name,
            downloadUrl,
            size: file.size,
            uploadedAt: new Date()
          };
          await setDoc(doc(db, 'assets', asset.id), asset);
          resolve(asset);
        }
      );
    });
  }

  async deleteAsset(asset: Asset) {
    try {
      const storageRef = ref(storage, `assets/${asset.name}`);
      await deleteObject(storageRef);
    } catch (e) {
      console.warn('Storage file might not exist', e);
    }
    await deleteDoc(doc(db, 'assets', asset.id));
  }
}
