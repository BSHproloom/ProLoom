import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

interface KPI {
  title: string;
  value: number;
  icon: string;
  isAlert: boolean;
  alertMessage: string;
}

interface LoomSchedule {
  loomId: number;
  days: { date: number; status: 'busy' | 'free' | 'maintenance' }[];
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard implements OnInit {
  kpis: KPI[] = [
    { title: 'Design Queue', value: 12, icon: 'assignment_late', isAlert: true, alertMessage: '5 items unassigned > 1 day' },
    { title: 'In Design', value: 8, icon: 'brush', isAlert: false, alertMessage: 'All within 3 days SLA' },
    { title: 'Client Approvals', value: 3, icon: 'fact_check', isAlert: true, alertMessage: '1 item waiting > 5 days' },
    { title: 'Production Queue', value: 15, icon: 'precision_manufacturing', isAlert: false, alertMessage: 'Flowing smoothly' }
  ];

  loomSchedules: LoomSchedule[] = [];
  dates: number[] = [];

  ngOnInit() {
    this.generateMockLoomData();
  }

  generateMockLoomData() {
    for (let i = 1; i <= 30; i++) {
      this.dates.push(i);
    }

    for (let i = 1; i <= 12; i++) {
      const days = [];
      for (let j = 1; j <= 30; j++) {
        const rand = Math.random();
        let status: 'busy' | 'free' | 'maintenance' = 'free';
        if (rand > 0.4) status = 'busy';
        if (rand > 0.9) status = 'maintenance';
        days.push({ date: j, status });
      }
      this.loomSchedules.push({ loomId: i, days });
    }
  }
}
