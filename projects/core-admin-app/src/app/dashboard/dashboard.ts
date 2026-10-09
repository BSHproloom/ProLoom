import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { CarpetService, Carpet } from 'shared-core';

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
    { title: 'Unassigned', value: 0, icon: 'assignment_late', isAlert: false, alertMessage: '' },
    { title: 'In Design / Revision', value: 0, icon: 'brush', isAlert: false, alertMessage: '' },
    { title: 'Pending Admin Review', value: 0, icon: 'fact_check', isAlert: false, alertMessage: '' },
    { title: 'Approved (Sent to AM)', value: 0, icon: 'check_circle', isAlert: false, alertMessage: '' }
  ];

  loomSchedules: LoomSchedule[] = [];
  dates: number[] = [];

  private carpetService = inject(CarpetService);

  ngOnInit() {
    this.generateMockLoomData();
    
    this.carpetService.getAllCarpets().subscribe(carpets => {
      const unassigned = carpets.filter(c => c.status === 'Need to Assign').length;
      const inDesign = carpets.filter(c => ['Assigned', 'In Progress', 'Revision Needed', 'Revision Requested'].includes(c.status)).length;
      const pendingReview = carpets.filter(c => c.status === 'Review Pending').length;
      const approved = carpets.filter(c => c.status === 'Sent to AM' || c.status === 'Approved').length;

      this.kpis = [
        { 
          title: 'Unassigned', 
          value: unassigned, 
          icon: 'assignment_late', 
          isAlert: unassigned > 0, 
          alertMessage: unassigned > 0 ? `${unassigned} items need assignment` : 'All assigned' 
        },
        { 
          title: 'In Design / Revision', 
          value: inDesign, 
          icon: 'brush', 
          isAlert: false, 
          alertMessage: `${inDesign} items currently with designers` 
        },
        { 
          title: 'Pending Admin Review', 
          value: pendingReview, 
          icon: 'fact_check', 
          isAlert: pendingReview > 0, 
          alertMessage: pendingReview > 0 ? `${pendingReview} items waiting for your review` : 'Nothing to review' 
        },
        { 
          title: 'Approved (Sent to AM)', 
          value: approved, 
          icon: 'check_circle', 
          isAlert: false, 
          alertMessage: `Total approved artworks` 
        }
      ];
    });
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
