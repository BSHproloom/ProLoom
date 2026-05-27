import { Component, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { Carpet } from 'shared-core';

interface TaskViewModel extends Carpet {
  timerDisplay: string;
  _interval?: any;
}

const MOCK_TASKS: TaskViewModel[] = [
  { id: 'SKU-001', project_fk: 'P-12601', composite_item_name: 'Lobby Main Rug', size: '10x15', quality: 'ht-850', no_of_rugs: 1, designer: 'Alice', yarn_sheet_status: 'Pending', status: 'In Progress', is_working: false, time_spent_seconds: 3600, timerDisplay: '01:00:00' },
  { id: 'SKU-002', project_fk: 'P-12601', composite_item_name: 'Lobby Corridor', size: '5x20', quality: 'ht-850', no_of_rugs: 4, designer: 'Alice', yarn_sheet_status: 'Ready', status: 'Revision Requested', is_working: false, time_spent_seconds: 1800, timerDisplay: '00:30:00' }
];

@Component({
  selector: 'app-my-tasks',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule, MatChipsModule],
  templateUrl: './my-tasks.html',
  styleUrl: './my-tasks.css',
})
export class MyTasks implements OnDestroy {
  tasks = MOCK_TASKS;

  ngOnDestroy() {
    this.tasks.forEach(t => {
      if (t._interval) clearInterval(t._interval);
    });
  }

  toggleTimer(task: TaskViewModel) {
    if (task.is_working) {
      // Stop
      task.is_working = false;
      if (task._interval) clearInterval(task._interval);
      task.status = 'In Progress'; // optionally ask to advance to 'Pending Approval'
    } else {
      // Start
      task.is_working = true;
      task.status = 'In Progress';
      task._interval = setInterval(() => {
        task.time_spent_seconds++;
        task.timerDisplay = this.formatTime(task.time_spent_seconds);
      }, 1000);
    }
  }

  formatTime(totalSeconds: number): string {
    const h = Math.floor(totalSeconds / 3600).toString().padStart(2, '0');
    const m = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, '0');
    const s = Math.floor(totalSeconds % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
  }

  advanceStatus(task: TaskViewModel) {
    if (task.status === 'In Progress') {
      task.status = 'Pending Approval';
      if (task.is_working) this.toggleTimer(task);
    } else if (task.status === 'Revision Requested') {
      task.status = 'In Progress';
    }
  }
}
