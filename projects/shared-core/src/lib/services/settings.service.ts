import { Injectable } from '@angular/core';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { Observable, from } from 'rxjs';
import { db } from '../firebase.config';

export interface EmailTemplate {
  subject: string;
  body: string;
  to: string;
  cc: string;
}

export interface AppSettings {
  masterOneDrivePath: string;
  sharepointSiteUrl: string;
  scEmail: string;
  factoryEmail: string;
  emailTemplates: {
    [scenario: string]: EmailTemplate;
  };
}

@Injectable({
  providedIn: 'root'
})
export class SettingsService {

  constructor() { }

  getSettings(): Observable<AppSettings> {
    return new Observable<AppSettings>(observer => {
      const settingsDoc = doc(db, 'settings', 'global');
      
      // First ensure the document exists
      getDoc(settingsDoc).then(snap => {
        if (!snap.exists()) {
          return setDoc(settingsDoc, this.getDefaultSettings());
        }
        return Promise.resolve();
      }).then(() => {
        // Then start listening to it
        import('firebase/firestore').then(({ onSnapshot }) => {
          const unsubscribe = onSnapshot(settingsDoc, (docSnap) => {
            if (docSnap.exists()) {
              observer.next({ ...this.getDefaultSettings(), ...docSnap.data() } as AppSettings);
            }
          }, (error) => observer.error(error));
          
          return () => unsubscribe();
        });
      }).catch(err => observer.error(err));
    });
  }

  async updateSettings(settings: AppSettings): Promise<void> {
    const settingsDoc = doc(db, 'settings', 'global');
    await setDoc(settingsDoc, settings, { merge: true });
  }

  getDefaultSettings(): AppSettings {
    const defaultTemplate = {
      subject: 'ProLoom: [Project_Name] - [Carpet_Name]',
      body: 'Hello,\n\nPlease find the updates for [Project_Name] (SKU: [SKU]).\n\nLink: [Folder_Link]\n\nNotes:\n[Notes]\n\nThanks.',
      to: '',
      cc: ''
    };

    return {
      masterOneDrivePath: 'ProLoom_Workspace',
      sharepointSiteUrl: '',
      scEmail: '',
      factoryEmail: '',
      emailTemplates: {
        'designer_artwork_submission': { ...defaultTemplate, subject: 'Artwork Submitted: [Project_Name] - [Carpet_Name]' },
        'designer_revision_submission': { ...defaultTemplate, subject: 'Revision Submitted: [Project_Name] - [Carpet_Name]' },
        'designer_sample_submission': { ...defaultTemplate, subject: 'Sample Submitted: [Project_Name] - [Carpet_Name]' },
        'designer_prod_submission': { ...defaultTemplate, subject: 'Production File Submitted: [Project_Name] - [Carpet_Name]' },
        'admin_artwork_assignment': { ...defaultTemplate, subject: 'New Artwork Assigned: [Project_Name] - [Carpet_Name]' },
        'admin_revision_request': { ...defaultTemplate, subject: 'Revision Requested: [Project_Name] - [Carpet_Name]' },
        'admin_sample_request': { ...defaultTemplate, subject: 'Sample File Requested: [Project_Name] - [Carpet_Name]' },
        'admin_prod_request': { ...defaultTemplate, subject: 'Production File Fix Requested: [Project_Name] - [Carpet_Name]' },
        'admin_factory_submission': { ...defaultTemplate, subject: 'Final Production File: [Project_Name] - [Carpet_Name]' }
      }
    };
  }
}
