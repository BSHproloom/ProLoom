import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { CarpetService, ActivityLogService, UserService, Carpet, ActivityLog } from 'shared-core';
import { forkJoin } from 'rxjs';

interface DayForecast {
  date: Date;
}

interface LoomRun {
  carpet: Carpet;
  leftPercentage: number;
  widthPercentage: number;
}

@Component({
  selector: 'app-ceo-dashboard',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule, MatTableModule],
  templateUrl: './ceo-dashboard.html',
  styleUrl: './ceo-dashboard.css'
})
export class CeoDashboard implements OnInit {
  private carpetService = inject(CarpetService);
  private activityService = inject(ActivityLogService);
  private userService = inject(UserService);

  designBacklogCount = 0;
  pendingClientCount = 0;

  forecastDays: DayForecast[] = [];
  scheduledRuns: { [loomId: number]: LoomRun[] } = {};

  designerStats: { name: string; completed: number }[] = [];
  amStats: { name: string; avgDays: number }[] = [];

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

  bottleneckCarpets: { carpet: Carpet; daysStuck: number }[] = [];

  loadData() {
    this.carpetService.getAllCarpets().subscribe(carpets => {
      // 1. Bottlenecks
      const designBacklog = carpets.filter(c => ['Need to Assign', 'Assigned', 'In Progress'].includes(c.status));
      const pendingClient = carpets.filter(c => ['Sent to AM', 'On Hold - Client Decision'].includes(c.status));
      
      this.designBacklogCount = designBacklog.length;
      this.pendingClientCount = pendingClient.length;

      // Calculate days stuck
      const now = new Date().getTime();
      this.bottleneckCarpets = [...designBacklog, ...pendingClient].map(c => {
        const updateTime = c.status_updated_at ? (c.status_updated_at.toDate ? c.status_updated_at.toDate().getTime() : new Date(c.status_updated_at).getTime()) : now;
        const daysStuck = Math.floor((now - updateTime) / (1000 * 60 * 60 * 24));
        return { carpet: c, daysStuck };
      }).filter(b => b.daysStuck > 2) // Only show if stuck for more than 2 days
      .sort((a, b) => b.daysStuck - a.daysStuck);

      // 2. Loom Forecast
      this.buildLoomForecast(carpets);

      // 3. Team Performance (Needs Activity Logs)
      this.buildTeamPerformance(carpets);
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

      // Ensure start is at least today for visualization
      if (start < today) {
        start = today;
      }

      if (end >= today && start <= today + maxMs) {
        const leftDays = (start - today) / msPerDay;
        const durationDays = (end - start) / msPerDay + 1; // +1 to include end day

        let leftPercentage = (leftDays / 30) * 100;
        let widthPercentage = (durationDays / 30) * 100;

        // Clamp
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

  buildTeamPerformance(carpets: Carpet[]) {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Designer Stats: Count how many carpets are in "Pending SC Review" or "Approved" where they are the designer
    const designerMap = new Map<string, number>();
    for (const c of carpets) {
      if ((c.status === 'Pending SC Review' || c.status === 'Approved' || c.status === 'Sent to AM' || c.status === 'Assigned to Production') && c.designer) {
        // Just rough estimate if they recently worked on it
        // To be accurate, we should look at logs, but for simplicity, count their active finished work
        designerMap.set(c.designer, (designerMap.get(c.designer) || 0) + 1);
      }
    }
    
    this.designerStats = Array.from(designerMap.entries()).map(([name, completed]) => ({ name, completed }));
    this.designerStats.sort((a,b) => b.completed - a.completed);

    // AM Stats: Calculate average time from "Sent to AM" to "Approved"
    this.activityService.getAllLogs().subscribe(logs => {
      // Group by carpet
      const amLogsMap = new Map<string, { amName: string, sentTime: number, approveTime: number }>();
      
      for (const log of logs) {
        const time = (log.timestamp.toDate ? log.timestamp.toDate() : new Date(log.timestamp)).getTime();
        if (time < thirtyDaysAgo.getTime()) continue; // Only last 30 days
        
        if (!amLogsMap.has(log.carpet_id)) {
          amLogsMap.set(log.carpet_id, { amName: '', sentTime: 0, approveTime: 0 });
        }
        const state = amLogsMap.get(log.carpet_id)!;

        if (log.action === 'Sent to AM') {
          state.sentTime = time;
          state.amName = log.user_name; // Assuming the person who receives it? Or the user_name here is the SC?
          // Actually, the AM name isn't directly on the carpet unless we grab it from Project.
        } else if (log.action === 'Approved' && state.sentTime > 0) {
          state.approveTime = time;
          state.amName = log.user_name; // The person who clicked approve is the AM
        }
      }

      const amPerformance = new Map<string, { totalDays: number, count: number }>();

      amLogsMap.forEach(state => {
        if (state.sentTime > 0 && state.approveTime > 0) {
          const days = (state.approveTime - state.sentTime) / (1000 * 60 * 60 * 24);
          if (state.amName) {
            const perf = amPerformance.get(state.amName) || { totalDays: 0, count: 0 };
            perf.totalDays += days;
            perf.count += 1;
            amPerformance.set(state.amName, perf);
          }
        }
      });

      this.amStats = Array.from(amPerformance.entries()).map(([name, perf]) => ({
        name,
        avgDays: perf.totalDays / perf.count
      }));
      this.amStats.sort((a,b) => a.avgDays - b.avgDays); // Lower is better
    });
  }
}
