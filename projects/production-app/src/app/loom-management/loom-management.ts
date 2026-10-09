import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { CarpetService, Carpet } from 'shared-core';

interface DayForecast {
  date: Date;
}

interface LoomRun {
  carpet: Carpet;
  leftPercentage: number;
  widthPercentage: number;
}

@Component({
  selector: 'app-loom-management',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule],
  templateUrl: './loom-management.html',
  styleUrl: './loom-management.css'
})
export class LoomManagement implements OnInit {
  private carpetService = inject(CarpetService);

  forecastDays: DayForecast[] = [];
  scheduledRuns: { [loomId: number]: LoomRun[] } = {};

  ngOnInit() {
    this.generateForecastDays();
    this.loadData();
  }

  generateForecastDays() {
    const today = new Date();
    today.setHours(0,0,0,0);
    this.forecastDays = [];
    for (let i = 0; i < 30; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      this.forecastDays.push({ date: d });
    }
  }

  formatDate(d: any) {
    if (!d) return '';
    const date = d.toDate ? d.toDate() : new Date(d);
    return date.toLocaleDateString();
  }

  loadData() {
    this.carpetService.getAllCarpets().subscribe(carpets => {
      this.buildLoomForecast(carpets);
    });
  }

  buildLoomForecast(carpets: Carpet[]) {
    this.scheduledRuns = {};
    for (let i = 1; i <= 12; i++) {
      this.scheduledRuns[i] = [];
    }

    const today = this.forecastDays[0].date.getTime();
    const msPerDay = 1000 * 60 * 60 * 24;
    const maxMs = 30 * msPerDay;

    const scheduledCarpets = carpets.filter(c => c.assigned_loom && c.loom_start_date && c.loom_end_date && c.status !== 'Ready for Delivery');
    
    for (const c of scheduledCarpets) {
      const loomId = c.assigned_loom!;
      let start = (c.loom_start_date.toDate ? c.loom_start_date.toDate() : new Date(c.loom_start_date)).getTime();
      let end = (c.loom_end_date.toDate ? c.loom_end_date.toDate() : new Date(c.loom_end_date)).getTime();

      if (start < today) {
        start = today;
      }

      if (end >= today && start <= today + maxMs) {
        const leftDays = (start - today) / msPerDay;
        const durationDays = (end - start) / msPerDay + 1;

        let leftPercentage = (leftDays / 30) * 100;
        let widthPercentage = (durationDays / 30) * 100;

        if (leftPercentage < 0) {
          widthPercentage += leftPercentage;
          leftPercentage = 0;
        }
        if (leftPercentage + widthPercentage > 100) {
          widthPercentage = 100 - leftPercentage;
        }

        if (widthPercentage > 0 && leftPercentage < 100) {
          this.scheduledRuns[loomId].push({
            carpet: c,
            leftPercentage,
            widthPercentage
          });
        }
      }
    }
  }

  getRunsForLoom(loomId: number) {
    return this.scheduledRuns[loomId] || [];
  }
}
