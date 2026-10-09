import { Injectable, inject, NgZone } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { doc, collection, onSnapshot, addDoc, query, orderBy, deleteDoc, getDocs, where } from 'firebase/firestore';
import { db } from '../firebase.config';
import { Project } from '../models/project.model';

export interface ProjectViewModel extends Project {
  aggregatedStatus: string;
}

@Injectable({
  providedIn: 'root'
})
export class ProjectService {
  private projectsSubject = new BehaviorSubject<ProjectViewModel[]>([]);
  public projects$ = this.projectsSubject.asObservable();
  private zone = inject(NgZone);

  constructor() {
    this.listenToFirestore();
  }

  private listenToFirestore() {
    const q = query(collection(db, 'projects'));
    onSnapshot(q, (snapshot) => {
      const projectsData: ProjectViewModel[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        projectsData.push({
          id: data['id'] || doc.id,
          client_name: data['client_name'],
          project_name: data['project_name'],
          carpet_quality: data['carpet_quality'],
          no_of_rugs: data['no_of_rugs'],
          type_of_carpet: data['type_of_carpet'],
          timeline_weeks: data['timeline_weeks'],
          client_commitment_date: data['client_commitment_date']?.toDate() || null,
          client_expectation_date: data['client_expectation_date']?.toDate() || null,
          skip_artwork: data['skip_artwork'] || false,
          sales_order: data['sales_order'] || 'Pending',
          am: data['am'] || 'Unassigned',
          overall_status: data['overall_status'] || 'Active',
          artwork_approval_deadline: data['artwork_approval_deadline']?.toDate() || null,
          aggregatedStatus: data['aggregatedStatus'] || 'Pending Artwork'
        });
      });
      
      // Sort in-memory to put newest first (or we could use orderBy('createdAt', 'desc') in query)
      projectsData.sort((a, b) => {
        return b.id.localeCompare(a.id); 
      });

      this.zone.run(() => {
        this.projectsSubject.next(projectsData);
      });
    }, (error) => {
      console.error("Error listening to projects:", error);
    });
  }

  getProjects(): Observable<ProjectViewModel[]> {
    return this.projects$;
  }

  getProjectById(projectId: string): Observable<ProjectViewModel | undefined> {
    return new Observable<ProjectViewModel | undefined>(observer => {
      const docRef = doc(db, 'projects', projectId);
      
      const unsubscribe = onSnapshot(docRef, (docSnap: any) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          const project: ProjectViewModel = {
            id: data['id'] || docSnap.id,
            client_name: data['client_name'],
            project_name: data['project_name'],
            carpet_quality: data['carpet_quality'],
            no_of_rugs: data['no_of_rugs'],
            type_of_carpet: data['type_of_carpet'],
            timeline_weeks: data['timeline_weeks'],
            client_commitment_date: data['client_commitment_date']?.toDate() || null,
            client_expectation_date: data['client_expectation_date']?.toDate() || null,
            skip_artwork: data['skip_artwork'] || false,
            sales_order: data['sales_order'] || 'Pending',
            am: data['am'] || 'Unassigned',
            overall_status: data['overall_status'] || 'Active',
            artwork_approval_deadline: data['artwork_approval_deadline']?.toDate() || null,
            aggregatedStatus: data['aggregatedStatus'] || 'Pending Artwork'
          };
          this.zone.run(() => observer.next(project));
        } else {
          this.zone.run(() => observer.next(undefined));
        }
      }, (error: any) => {
        this.zone.run(() => observer.error(error));
      });

      return () => unsubscribe();
    });
  }

  async getNextSkuNumber(): Promise<number> {
    const { getDocs, collection } = await import('firebase/firestore');
    let maxNum = 0;
    const carpetsSnap = await getDocs(collection(db, 'carpets'));
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
    return maxNum + 1;
  }

  async addProject(projectData: any, carpetsData: any[] = []) {
    const { setDoc, doc } = await import('firebase/firestore');
    const newId = projectData.project_id || `P-${Math.floor(Math.random() * 90000) + 10000}`;
    const newProject = {
      ...projectData,
      id: newId,
      overall_status: 'Active',
      aggregatedStatus: 'Pending Artwork',
      sales_order: projectData.sales_order || 'Pending'
    };
    
    try {
      await setDoc(doc(db, 'projects', newId), newProject);
      console.log('Project added to Firestore:', newId);
      
      // Determine next SKU number
      let nextSkuNum = await this.getNextSkuNumber();

      const generatedCarpets = [];

      // Generate the requested carpets
      for (const c of carpetsData) {
        const skuId = `BSH_CC_${nextSkuNum.toString().padStart(5, '0')}`;
        nextSkuNum++;

        const newCarpet = {
          project_fk: newId,
          composite_item_name: c.name,
          size: c.size,
          width: c.width,
          height: c.height,
          area: c.area,
          quality: c.quality,
          material: c.material || '',
          carpet_type: c.carpet_type || 'Rug',
          dimensions_from: c.dimensions_from || '',
          taher_details: c.taher_details || '',
          no_of_rugs: c.quantity,
          designer: '',
          yarn_sheet_status: 'Pending',
          status: 'Need to Assign',
          is_working: false,
          time_spent_seconds: 0,
          designer_readiness_date: null,
          start_time: null,
          requested_delivery: c.requested_delivery || null
        };
        await setDoc(doc(db, 'carpets', skuId), newCarpet);
        generatedCarpets.push({ skuId, ...newCarpet });
      }
      
      return { projectId: newId, carpets: generatedCarpets };
      
    } catch (error) {
      console.error('Error adding project to Firestore:', error);
      alert('Failed to save to cloud. Check console.');
      throw error;
    }
  }

    async clearAllData() {
    const qProjects = query(collection(db, 'projects'));
    const snapshotProjects = await getDocs(qProjects);
    const deleteProjects = snapshotProjects.docs.map(doc => deleteDoc(doc.ref));
    
    const qCarpets = query(collection(db, 'carpets'));
    const snapshotCarpets = await getDocs(qCarpets);
    const deleteCarpets = snapshotCarpets.docs.map(doc => deleteDoc(doc.ref));

    const qSamples = query(collection(db, 'samples'));
    const snapshotSamples = await getDocs(qSamples);
    const deleteSamples = snapshotSamples.docs.map(doc => deleteDoc(doc.ref));

    const qActivities = query(collection(db, 'activity_logs'));
    const snapshotActivities = await getDocs(qActivities);
    const deleteActivities = snapshotActivities.docs.map(doc => deleteDoc(doc.ref));

    const qTimeLogs = query(collection(db, 'time_logs'));
    const snapshotTimeLogs = await getDocs(qTimeLogs);
    const deleteTimeLogs = snapshotTimeLogs.docs.map(doc => deleteDoc(doc.ref));

    await Promise.all([...deleteProjects, ...deleteCarpets, ...deleteSamples, ...deleteActivities, ...deleteTimeLogs]);
    console.log('All project, carpet, sample, activity_logs, and time_logs cleared from Firestore.');
  }

  async deleteProject(projectId: string) {
    const { doc } = await import('firebase/firestore');
    // Delete the project
    const docRef = doc(db, 'projects', projectId);
    await deleteDoc(docRef);

    // Delete associated carpets
    const q = query(collection(db, 'carpets'), where('project_fk', '==', projectId));
    const snapshot = await getDocs(q);
    const deletePromises = snapshot.docs.map(carpetDoc => deleteDoc(carpetDoc.ref));
    await Promise.all(deletePromises);
  }

  async getProjectByIdAsync(projectId: string): Promise<Project | null> {
    const { doc, getDoc } = await import('firebase/firestore');
    const docRef = doc(db, 'projects', projectId);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return { id: snap.id, ...snap.data() } as Project;
    }
    return null;
  }

  async updateProject(projectId: string, data: Partial<ProjectViewModel>) {
    const { doc, updateDoc } = await import('firebase/firestore');
    const docRef = doc(db, 'projects', projectId);
    await updateDoc(docRef, data as any);
  }
}

