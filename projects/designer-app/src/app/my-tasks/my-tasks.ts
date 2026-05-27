import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { FormsModule } from '@angular/forms';
import { Carpet, CarpetService, ActivityLogService, NotificationService, User } from 'shared-core';

interface TaskViewModel extends Carpet {
  timerDisplay: string;
  _interval?: any;
}

@Component({
  selector: 'app-my-tasks',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule, MatChipsModule, FormsModule],
  templateUrl: './my-tasks.html',
  styleUrl: './my-tasks.css',
})
export class MyTasks implements OnInit, OnDestroy {
  tasks: TaskViewModel[] = [];
  
  private carpetService = inject(CarpetService);
  private activityLogService = inject(ActivityLogService);
  private notifService = inject(NotificationService);
  
  currentDesigner: User | null = null;
  private sub: any;

  ngOnInit() {
    const ls = localStorage.getItem('current_designer');
    if (ls) {
      this.currentDesigner = JSON.parse(ls);
      if (this.currentDesigner) {
        this.loadTasks();
      }
    }
  }

  loadTasks() {
    this.sub = this.carpetService.getCarpetsForDesigner(this.currentDesigner!.name).subscribe(carpets => {
      // Merge with existing state so we don't lose running timers
      const newTasks: TaskViewModel[] = [];
      carpets.forEach(c => {
        const existing = this.tasks.find(t => t.id === c.id);
        if (existing) {
          // keep timer state if running
          newTasks.push({ ...c, timerDisplay: existing.timerDisplay, _interval: existing._interval });
        } else {
          newTasks.push({ ...c, timerDisplay: this.formatTime(c.time_spent_seconds || 0) });
          // If the DB says it's working, maybe we resume timer locally
          if (c.is_working && c.start_time) {
            this.resumeTimer(newTasks[newTasks.length - 1]);
          }
        }
      });
      this.tasks = newTasks;
    });
  }

  ngOnDestroy() {
    if (this.sub) this.sub.unsubscribe();
    this.tasks.forEach(t => {
      if (t._interval) clearInterval(t._interval);
    });
  }

  resumeTimer(task: TaskViewModel) {
    if (task._interval) return;
    const start = task.start_time.toDate ? task.start_time.toDate() : new Date(task.start_time);
    const now = new Date();
    const diffSeconds = Math.floor((now.getTime() - start.getTime()) / 1000);
    const initialSpent = (task.time_spent_seconds || 0) + diffSeconds;
    
    let currentSpent = initialSpent;
    task.timerDisplay = this.formatTime(currentSpent);
    
    task._interval = setInterval(() => {
      currentSpent++;
      task.timerDisplay = this.formatTime(currentSpent);
    }, 1000);
  }

  async toggleTimer(task: TaskViewModel) {
    if (task.is_working) {
      // PAUSE
      clearInterval(task._interval);
      task._interval = null;
      
      const start = task.start_time.toDate ? task.start_time.toDate() : new Date(task.start_time);
      const now = new Date();
      const diffSeconds = Math.floor((now.getTime() - start.getTime()) / 1000);
      const newTotal = (task.time_spent_seconds || 0) + diffSeconds;

      await this.carpetService.updateCarpet(task.id, {
        is_working: false,
        time_spent_seconds: newTotal,
        start_time: null
      });

      await this.activityLogService.logActivity({
        carpet_id: task.id,
        project_id: task.project_fk,
        user_name: this.currentDesigner!.name,
        action: 'Paused',
        comment: 'Paused working on artwork.',
        time_spent_seconds: diffSeconds,
        timestamp: new Date()
      });

    } else {
      // START
      // Auto-pause any other active task
      for (const t of this.tasks) {
        if (t.id !== task.id && t.is_working) {
          await this.toggleTimer(t); // Pause it
        }
      }

      task.is_working = true;
      const startTime = new Date();
      
      await this.carpetService.updateCarpet(task.id, {
        is_working: true,
        start_time: startTime,
        status: task.status === 'Assigned' ? 'In Progress' : task.status
      });

      await this.activityLogService.logActivity({
        carpet_id: task.id,
        project_id: task.project_fk,
        user_name: this.currentDesigner!.name,
        action: 'Started',
        comment: 'Started working on artwork.',
        timestamp: startTime
      });
      
      this.resumeTimer(task);
    }
  }

  formatTime(totalSeconds: number): string {
    if (!totalSeconds) return '00:00:00';
    const h = Math.floor(totalSeconds / 3600).toString().padStart(2, '0');
    const m = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, '0');
    const s = Math.floor(totalSeconds % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
  }

  formatDate(d: any): string {
    if (!d) return '';
    const date = d.toDate ? d.toDate() : new Date(d);
    return date.toLocaleDateString();
  }

  async saveDate(task: TaskViewModel) {
    if (task.designer_readiness_date) {
      await this.carpetService.updateCarpet(task.id, {
        designer_readiness_date: new Date(task.designer_readiness_date)
      });
    }
  }

  async advanceStatus(task: TaskViewModel) {
    if (task.is_working) {
      await this.toggleTimer(task); // Pause before submitting
    }

    if (task.status === 'In Progress' || task.status === 'Revision Requested') {
      await this.carpetService.updateCarpet(task.id, {
        status: 'Review Pending'
      });

      await this.activityLogService.logActivity({
        carpet_id: task.id,
        project_id: task.project_fk,
        user_name: this.currentDesigner!.name,
        action: 'Submitted for Review',
        comment: 'Artwork submitted for Sales Coordinator review.',
        timestamp: new Date()
      });

      // Send Notif to SC (Admin)
      await this.notifService.sendNotification({
        recipient_email: 'admin@proloom.com',
        recipient_role: 'Admin',
        message: `${this.currentDesigner!.name} has submitted artwork for Carpet ${task.composite_item_name} in Project ${task.project_fk} for review.`,
        read_status: false,
        timestamp: new Date()
      });
    }
  }
}
