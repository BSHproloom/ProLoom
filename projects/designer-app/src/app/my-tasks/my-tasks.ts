import { Component, OnDestroy, OnInit, inject, ViewChild, TemplateRef, HostListener, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatMenuModule } from '@angular/material/menu';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Carpet, CarpetService, ActivityLogService, NotificationService, User, SettingsService, MicrosoftGraphService, ProjectService } from 'shared-core';

interface TaskViewModel extends Carpet {
  timerDisplay: string;
  _interval?: any;
  selectedCompletionDate?: string;
  customCompletionDateStr?: string;
}

@Component({
  selector: 'app-my-tasks',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule, MatChipsModule, FormsModule, MatDialogModule, MatTooltipModule, MatMenuModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatProgressSpinnerModule, MatCheckboxModule],
  templateUrl: './my-tasks.html',
  styleUrl: './my-tasks.css',
})
export class MyTasks implements OnInit, OnDestroy {
  tasks: TaskViewModel[] = [];
  activeTasks: any[] = [];
  activeProjectGroups: any[] = [];
  selectedProjectGroup: any = null;
  selectedTask: any = null;
  
  private carpetService = inject(CarpetService);
  private activityLogService = inject(ActivityLogService);
  private notifService = inject(NotificationService);
  private settingsService = inject(SettingsService);
  private graphService = inject(MicrosoftGraphService);
  private projectService = inject(ProjectService);
  private cdr = inject(ChangeDetectorRef);
  dialog = inject(MatDialog);

  currentDesigner: User | null = null;
  appSettings: any = null;

  altPressed = false;
  
  @HostListener('window:keydown', ['$event'])
  onKeyDown(e: KeyboardEvent) { 
    if (e.key === 'Escape' && this.isSidePanelOpen) { this.closeSidePanel(); this.cdr.detectChanges(); }
    if (e.altKey && !this.altPressed) { 
      this.altPressed = true; 
      this.cdr.detectChanges(); 
    } 
  }
  
  @HostListener('window:keyup', ['$event'])
  onKeyUp(e: KeyboardEvent) { 
    if (!e.altKey && this.altPressed) { 
      this.altPressed = false; 
      this.cdr.detectChanges(); 
    } 
  }

  // Side Panel logic
  isSidePanelOpen = false;
  sidePanelMode: 'notes' | 'activity' = 'notes';
  sidePanelTask: any = null;
  localNotes = '';
  activityLogs: any[] = [];
  activityLoading = false;

  @ViewChild('uploadSubmitDialog') uploadSubmitDialog!: TemplateRef<any>;
  pendingUploadTask: any = null;
  isCreatingFolder = false;
  currentGraphFolderUrl = '';
  emailTemplate: any = {};
  emailBodyContent = '';

  ngOnInit() {
    const ls = localStorage.getItem('current_designer');
    if (ls) {
      this.currentDesigner = JSON.parse(ls);
    }
    
    this.settingsService.getSettings().subscribe(settings => {
      this.appSettings = settings;
    });

    if (this.currentDesigner) {
      this.carpetService.getCarpetsForDesigner(this.currentDesigner.name).subscribe(data => {
        if (this.tasks) {
          this.tasks.forEach(t => { if (t._interval) clearInterval(t._interval); });
        }
        this.tasks = data.map(c => ({
          ...c,
          timerDisplay: '00:00:00',
          selectedCompletionDate: 'today'
        })) as TaskViewModel[];
        this.sortAndSplitTasks();
        this.startTimers();
      });
    }
  }

  ngOnDestroy() {
    this.tasks.forEach(t => {
      if (t._interval) clearInterval(t._interval);
    });
  }

  sortAndSplitTasks() {
    this.activeTasks = this.tasks.filter(t => t.status !== 'Pending SC Review' && t.status !== 'Review Pending' && t.status !== 'Completed' && t.status !== 'Ready for Dispatch');
    
    const groups: any = {};
    for (const t of this.activeTasks) {
      if (!groups[t.project_fk]) {
        groups[t.project_fk] = { project: t.project || { id: t.project_fk }, tasks: [] };
        this.projectService.getProjectByIdAsync(t.project_fk).then(p => {
          if (p) {
            groups[t.project_fk].project = p;
            this.cdr.detectChanges();
          }
        });
      }
      groups[t.project_fk].tasks.push(t);
    }
    
    this.activeProjectGroups = Object.keys(groups).map(k => {
       return { project_id: k, project: groups[k].project, tasks: groups[k].tasks };
    });

    if (this.selectedTask) {
       this.selectedTask = this.activeTasks.find(t => t.id === this.selectedTask.id);
       if (!this.selectedTask) this.selectedProjectGroup = null;
    }
  }

  startTimers() {
    this.tasks.forEach(t => {
      if (t._interval) clearInterval(t._interval);
      if (t.is_working && t.start_time) {
        const updateTimer = () => {
          const st = t.start_time.toDate ? t.start_time.toDate() : new Date(t.start_time);
          const now = new Date();
          const diffSeconds = Math.floor((now.getTime() - st.getTime()) / 1000);
          const totalSeconds = (t.time_spent_seconds || 0) + diffSeconds;
          t.timerDisplay = this.formatTimer(totalSeconds);
          this.cdr.detectChanges();
        };
        updateTimer();
        t._interval = setInterval(updateTimer, 1000);
      } else {
        t.timerDisplay = this.formatTimer(t.time_spent_seconds || 0);
      }
    });
  }

  isAnyTaskWorking() { return this.tasks.some(t => t.is_working); }

  formatTimer(totalSeconds: number): string {
    const h = Math.floor(totalSeconds / 3600).toString().padStart(2, '0');
    const m = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, '0');
    const s = Math.floor(totalSeconds % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
  }

  openNotesPanel(task: any) {
    this.sidePanelTask = task;
    this.sidePanelMode = 'notes';
    this.localNotes = task.designer_remark || '';
    this.isSidePanelOpen = true;
  }

  async saveNotes() {
    if (this.sidePanelTask) {
      await this.carpetService.updateCarpet(this.sidePanelTask.id, { designer_remark: this.localNotes });
      this.closeSidePanel();
    }
  }

  openActivityPanel(task: any) {
    this.sidePanelTask = task;
    this.sidePanelMode = 'activity';
    this.isSidePanelOpen = true;
    this.activityLoading = true;
    this.activityLogs = [];
    
    this.activityLogService.getLogsForCarpet(task.id).subscribe(logs => {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - 30);
      const filtered = logs.filter(l => {
        const d = l.timestamp.toDate ? l.timestamp.toDate() : new Date(l.timestamp);
        return d >= cutoff;
      });
      this.activityLogs = filtered.sort((a, b) => {
        const dA = a.timestamp.toDate ? a.timestamp.toDate() : new Date(a.timestamp);
        const dB = b.timestamp.toDate ? b.timestamp.toDate() : new Date(b.timestamp);
        return dB.getTime() - dA.getTime();
      });
      this.activityLoading = false;
      this.cdr.detectChanges();
    });
  }

  closeSidePanel() {
    this.isSidePanelOpen = false;
  }

  formatActivityDate(ts: any) {
    if (!ts) return '';
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleString();
  }

  
  isOverdue(task: TaskViewModel): boolean {
    if (!task.designer_readiness_date) return false;
    const est = task.designer_readiness_date.toDate ? task.designer_readiness_date.toDate() : new Date(task.designer_readiness_date);
    return new Date() > est;
  }

  async pauseWork(task: TaskViewModel) {
    if (!task.is_working) return;
    task.is_working = false;
    if (task._interval) { clearInterval(task._interval); task._interval = null; }
    
    let newTotal = task.time_spent_seconds || 0;
    if (task.start_time) {
      const st = task.start_time.toDate ? task.start_time.toDate() : new Date(task.start_time);
      const diffSeconds = Math.floor((new Date().getTime() - st.getTime()) / 1000);
      newTotal += diffSeconds;
    }

    await this.carpetService.updateCarpet(task.id, {
      is_working: false,
      time_spent_seconds: newTotal,
      start_time: null
    });
    
    await this.activityLogService.logActivity({
      carpet_id: task.id, project_id: task.project_fk, user_name: this.currentDesigner!.name,
      action: 'Paused Work', comment: '', timestamp: new Date()
    });
    this.startTimers();
  }

  async startWork(task: TaskViewModel) {
    let d = new Date();
    if (task.selectedCompletionDate === 'tomorrow') {
      d.setDate(d.getDate() + 1);
    } else if (task.selectedCompletionDate === 'custom' && task.customCompletionDateStr) {
      d = new Date(task.customCompletionDateStr);
    }
    d.setHours(18, 0, 0, 0);

    task.designer_readiness_date = d.toISOString();
    task.is_working = true;
    const startTime = new Date();
    task.start_time = startTime;
    
    // Auto-pause others
    for (const t of this.tasks) {
      if (t.id !== task.id && t.is_working) {
        t.is_working = false;
        if (t._interval) clearInterval(t._interval);
        t._interval = null;
        
        const st = t.start_time?.toDate ? t.start_time.toDate() : new Date(t.start_time || new Date());
        const now = new Date();
        const diffSeconds = Math.floor((now.getTime() - st.getTime()) / 1000);
        const newTotal = (t.time_spent_seconds || 0) + diffSeconds;

        await this.carpetService.updateCarpet(t.id, {
          is_working: false, time_spent_seconds: newTotal, start_time: null
        });
      }
    }

    await this.carpetService.updateCarpet(task.id, {
      designer_readiness_date: task.designer_readiness_date,
      is_working: true, start_time: startTime,
      status: task.status === 'Assigned' ? 'In Progress' : task.status
    });

    await this.activityLogService.logActivity({
      carpet_id: task.id, project_id: task.project_fk, user_name: this.currentDesigner!.name,
      action: 'Started Work', comment: 'Expected finish date: ' + d.toLocaleDateString(), timestamp: new Date()
    });
    
    this.startTimers();
  }

  
  selectAllTasks(event: any) {
    if (this.selectedProjectGroup) {
      this.selectedProjectGroup.tasks.forEach((t: any) => t.selectedToSubmit = event.target.checked);
    }
  }

  submitSelectedTasks() {
    if (!this.selectedProjectGroup) return;
    const selected = this.selectedProjectGroup.tasks.filter((t: any) => t.selectedToSubmit);
    if (selected.length === 0) return;

    this.pendingUploadTask = selected; // Array instead of single object
    
    // Use the first task to figure out template and folders (they belong to same project)
    const firstTask = selected[0];
    this.currentGraphFolderUrl = firstTask.designer_folder_link || firstTask.folder_link || '';
    
    let scenario = 'designer_artwork_submission';
    if (firstTask.type_of_work === 'Sample') scenario = 'designer_sample_submission';
    
    let template = this.appSettings?.emailTemplates?.[scenario] || this.settingsService.getDefaultSettings().emailTemplates['designer_artwork_submission'];
    this.emailTemplate = { ...template };
    this.emailTemplate.to = this.appSettings?.scEmail || '';
    
    let b = this.emailTemplate.body.replace(/\\n/g, '\n');
    b = b.replace(/\[Project_Name\]/gi, firstTask.project?.project_name || '');
    
    // List all selected carpets
    let carpetList = selected.map((t: any) => `- ${t.id} : ${t.composite_item_name}`).join('\n');
    b = b.replace(/\[Carpet_Name\]/gi, 'Multiple Carpets:\n' + carpetList);
    b = b.replace(/\[SKU\]/gi, 'Multiple SKUs');
    b = b.replace(/\[Designer_Name\]/gi, this.currentDesigner?.name || '');
    
    if (this.currentGraphFolderUrl) {
       b += '\n\nSharePoint Folder: ' + this.currentGraphFolderUrl;
    }
    this.emailBodyContent = b;
    
    let s = this.emailTemplate.subject;
    s = s.replace(/\[Project_Name\]/gi, firstTask.project?.project_name || '');
    s = s.replace(/\[Carpet_Name\]/gi, `${selected.length} Carpets`);
    s = s.replace(/\[SKU\]/gi, 'Multiple SKUs');
    s = s.replace(/\[Designer_Name\]/gi, this.currentDesigner?.name || '');
    this.emailTemplate.subject = s;

    this.dialog.open(this.uploadSubmitDialog, { width: '950px', maxWidth: '95vw', disableClose: true });
  }

submitTask(task: any) {
    this.pendingUploadTask = task;
    this.currentGraphFolderUrl = task.designer_folder_link || task.folder_link || '';
    this.isCreatingFolder = false;
    
    let scenario = 'designer_artwork_submission';
    if (task.status === 'Revision Requested') scenario = 'designer_revision_submission';
    else if (task.type_of_work === 'Sample') scenario = 'designer_sample_submission';
    else if (task.type_of_work === 'Production files') scenario = 'designer_prod_submission';
    
    let template = this.appSettings?.emailTemplates?.[scenario];
    if (!template) {
       template = this.settingsService.getDefaultSettings().emailTemplates['designer_artwork_submission'];
    }
    this.emailTemplate = { ...template };
    this.emailTemplate.to = this.appSettings?.scEmail || '';
    
    let b = this.emailTemplate.body;
    b = b.replace(/\\n/g, '\n');
    b = b.replace(/\[Project_Name\]/gi, task.project?.project_name || '');
    b = b.replace(/\[Carpet_Name\]/gi, task.composite_item_name || '');
    b = b.replace(/\[SKU\]/gi, task.id || '');
    b = b.replace(/\[Designer_Name\]/gi, this.currentDesigner?.name || '');
    
    if (this.currentGraphFolderUrl) {
       b += '\n\nSharePoint Folder: ' + this.currentGraphFolderUrl;
    }
    
    this.emailBodyContent = b;
    
    let s = this.emailTemplate.subject;
    s = s.replace(/\[Project_Name\]/gi, task.project?.project_name || '');
    s = s.replace(/\[Carpet_Name\]/gi, task.composite_item_name || '');
    s = s.replace(/\[SKU\]/gi, task.id || '');
    s = s.replace(/\[Designer_Name\]/gi, this.currentDesigner?.name || '');
    this.emailTemplate.subject = s;

    this.dialog.open(this.uploadSubmitDialog, { width: '950px', maxWidth: '95vw', disableClose: true });
  }

  async confirmUploadSubmit() {
    if (!this.pendingUploadTask) return;
    const tasksToSubmit = Array.isArray(this.pendingUploadTask) ? this.pendingUploadTask : [this.pendingUploadTask];
    
    if (tasksToSubmit[0]['isSubmitting']) return;
    tasksToSubmit.forEach((t: any) => t['isSubmitting'] = true);

    try {
      for (const task of tasksToSubmit) {
        let newTotal = task.time_spent_seconds || 0;
        if (task.is_working && task.start_time) {
          const st = task.start_time.toDate ? task.start_time.toDate() : new Date(task.start_time);
          const now = new Date();
          const diffSeconds = Math.floor((now.getTime() - st.getTime()) / 1000);
          newTotal += diffSeconds;
        }

        let newStatus = 'Pending SC Review';
        if (task.status === 'Revision Requested' || task.status === 'Revision Needed') newStatus = 'Review Pending';
        else if (task.type_of_work === 'Sample') newStatus = 'Review Pending';

        await this.carpetService.updateCarpet(task.id, {
          status: newStatus,
          is_working: false,
          time_spent_seconds: newTotal,
          start_time: null,
          status_updated_at: new Date()
        });

        await this.activityLogService.logActivity({
          carpet_id: task.id,
          project_id: task.project_fk,
          user_name: this.currentDesigner!.name,
          action: 'Submitted for Review',
          comment: 'Artwork submitted for review.',
          timestamp: new Date()
        });
      }

      const finalBodyHtml = this.emailBodyContent.replace(/\n/g, '<br>');
      const { firstValueFrom } = await import('rxjs');
      await firstValueFrom(this.graphService.sendEmail([this.emailTemplate.to], this.emailTemplate.subject, finalBodyHtml, true));

      this.dialog.closeAll();
      this.pendingUploadTask = null;
    } catch(e) {
      console.error(e);
    } finally {
      tasksToSubmit.forEach((t: any) => t['isSubmitting'] = false);
    }
  }
}
