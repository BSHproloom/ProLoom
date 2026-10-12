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
    const { collection, getDocs, deleteDoc } = await import('firebase/firestore');
    const collectionsToClear = ['projects', 'carpets', 'samples', 'activity_logs', 'time_logs', 'yarn_orders', 'notifications'];
    const deletePromises: Promise<void>[] = [];
    for (const colName of collectionsToClear) {
      const snap = await getDocs(collection(db, colName));
      snap.docs.forEach(d => deletePromises.push(deleteDoc(d.ref)));
    }
    await Promise.all(deletePromises);
    console.log('All collections cleared from Firestore.');
  }

  async clearAllActivityLogs(): Promise<number> {
    const { collection, getDocs, deleteDoc } = await import('firebase/firestore');
    const snap = await getDocs(collection(db, 'activity_logs'));
    const deletePromises = snap.docs.map(d => deleteDoc(d.ref));
    await Promise.all(deletePromises);
    return snap.docs.length;
  }

  async cleanOrphanLogs(): Promise<number> {
    const { collection, getDocs, deleteDoc } = await import('firebase/firestore');
    const [projectsSnap, carpetsSnap, logsSnap] = await Promise.all([
      getDocs(collection(db, 'projects')),
      getDocs(collection(db, 'carpets')),
      getDocs(collection(db, 'activity_logs'))
    ]);

    const projectIds = new Set(projectsSnap.docs.map(d => d.id));
    const carpetIds = new Set(carpetsSnap.docs.map(d => d.id));

    let deletedCount = 0;
    const deletePromises: Promise<void>[] = [];

    logsSnap.docs.forEach(docSnap => {
      const data = docSnap.data();
      const projId = data['project_id'];
      const carpId = data['carpet_id'];

      const projectExists = projId && projectIds.has(projId);
      const carpetExists = carpId && carpetIds.has(carpId);

      if (!projectExists && !carpetExists) {
        deletePromises.push(deleteDoc(docSnap.ref));
        deletedCount++;
      }
    });

    await Promise.all(deletePromises);
    return deletedCount;
  }

  async deleteProject(projectId: string) {
    const { doc, query, collection, where, getDocs, deleteDoc } = await import('firebase/firestore');
    
    // 1. Get associated carpets
    const qCarpets = query(collection(db, 'carpets'), where('project_fk', '==', projectId));
    const carpetsSnap = await getDocs(qCarpets);
    const carpetIds = carpetsSnap.docs.map(d => d.id);

    // 2. Delete carpets
    const deleteCarpets = carpetsSnap.docs.map(d => deleteDoc(d.ref));

    // 3. Delete activity_logs for this project ID
    const qActProj = query(collection(db, 'activity_logs'), where('project_id', '==', projectId));
    const snapActProj = await getDocs(qActProj);
    const deleteActProj = snapActProj.docs.map(d => deleteDoc(d.ref));

    // 4. Delete activity_logs for each associated carpet ID
    const deleteActCarpets: Promise<void>[] = [];
    for (const cId of carpetIds) {
      const qActCarpet = query(collection(db, 'activity_logs'), where('carpet_id', '==', cId));
      const snapActCarpet = await getDocs(qActCarpet);
      snapActCarpet.docs.forEach(d => deleteActCarpets.push(deleteDoc(d.ref)));
    }

    // 5. Delete time_logs
    const qTime = query(collection(db, 'time_logs'), where('project_id', '==', projectId));
    const snapTime = await getDocs(qTime);
    const deleteTime = snapTime.docs.map(d => deleteDoc(d.ref));

    // 6. Delete samples
    const qSamples = query(collection(db, 'samples'), where('project_id', '==', projectId));
    const snapSamples = await getDocs(qSamples);
    const deleteSamples = snapSamples.docs.map(d => deleteDoc(d.ref));

    // 7. Delete the project document
    const deleteProj = deleteDoc(doc(db, 'projects', projectId));

    await Promise.all([
      deleteProj,
      ...deleteCarpets,
      ...deleteActProj,
      ...deleteActCarpets,
      ...deleteTime,
      ...deleteSamples
    ]);
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

