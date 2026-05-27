import { Injectable, inject, NgZone } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { collection, onSnapshot, addDoc, query, orderBy, deleteDoc, getDocs } from 'firebase/firestore';
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
          width: data['width'],
          height: data['height'],
          carpet_quality: data['carpet_quality'],
          no_of_rugs: data['no_of_rugs'],
          type_of_carpet: data['type_of_carpet'],
          timeline_weeks: data['timeline_weeks'],
          client_commitment_date: data['client_commitment_date']?.toDate() || null,
          client_expectation: data['client_expectation'] || '',
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

  async addProject(projectData: any) {
    const newId = `P-${Math.floor(Math.random() * 90000) + 10000}`;
    const newProject = {
      ...projectData,
      id: newId,
      overall_status: 'Active',
      aggregatedStatus: 'Pending Artwork',
      sales_order: 'Pending'
    };
    
    // Firestore won't take JS Date objects directly in addDoc if they aren't handled properly, but modern modular SDK usually converts Dates to Timestamps automatically.
    try {
      await addDoc(collection(db, 'projects'), newProject);
      console.log('Project added to Firestore:', newId);
      
      // Auto-generate some default carpets for this project
      const c1 = {
        project_fk: newId, composite_item_name: 'Lobby Rug', size: '10x15', quality: 'ht-850', no_of_rugs: 1, 
        designer: '', yarn_sheet_status: 'Pending', status: 'Need to Assign', is_working: false, 
        time_spent_seconds: 0, designer_readiness_date: null, start_time: null
      };
      const c2 = {
        project_fk: newId, composite_item_name: 'Corridor', size: '5x20', quality: 'ht-850', no_of_rugs: 4, 
        designer: '', yarn_sheet_status: 'Pending', status: 'Need to Assign', is_working: false, 
        time_spent_seconds: 0, designer_readiness_date: null, start_time: null
      };
      
      await addDoc(collection(db, 'carpets'), c1);
      await addDoc(collection(db, 'carpets'), c2);
      
    } catch (error) {
      console.error('Error adding project to Firestore:', error);
      alert('Failed to save to cloud. Check console.');
      throw error;
    }
  }

  async clearAllData() {
    const q = query(collection(db, 'projects'));
    const snapshot = await getDocs(q);
    const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
    await Promise.all(deletePromises);
    console.log('All project data cleared from Firestore.');
  }
}
