import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { Carpet, CarpetService, ProjectService, Project, User } from 'shared-core';
import * as ExcelJS from 'exceljs';
// @ts-ignore
import { saveAs } from 'file-saver';

interface ReportTask extends Carpet {
  projectName?: string;
  clientName?: string;
  amName?: string;
}

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatTableModule, MatSelectModule, MatButtonModule, MatIconModule, FormsModule],
  templateUrl: './reports.html',
  styleUrl: './reports.css',
})
export class Reports implements OnInit {
  private carpetService = inject(CarpetService);
  private projectService = inject(ProjectService);
  private cdr = inject(ChangeDetectorRef);
  
  allTasks: ReportTask[] = [];
  displayedTasks: ReportTask[] = [];
  rowSpans: any = {};
  projects: Project[] = [];
  
  currentDesigner: User | null = null;
  
  months = ['All', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  selectedMonth = 'All';
  
  workTypes = ['All', 'Artwork', 'Artwork revision', 'Sample', 'Production files'];
  selectedWorkType = 'All';
  
  displayedColumns: string[] = ['projectId', 'sku', 'carpetArea', 'size', 'typeOfWork', 'hoursWorked', 'dateAssigned', 'dateStarted', 'dateFinished', 'status'];

  async ngOnInit() {
    const ls = localStorage.getItem('current_designer');
    if (ls) {
      this.currentDesigner = JSON.parse(ls);
      if (this.currentDesigner) {
        await this.loadData();
      }
    }
  }

  async loadData() {
    this.projectService.getProjects().subscribe(projects => {
      this.projects = projects;
      this.carpetService.getCarpetsForDesigner(this.currentDesigner!.name).subscribe(tasks => {
        this.allTasks = tasks.map(t => {
          const proj = this.projects.find(p => p.id === t.project_fk);
          return {
            ...t,
            projectName: proj?.project_name,
            clientName: proj?.client_name,
            amName: proj?.am
          };
        });
        this.applyFilters();
      });
    });
  }

  applyFilters() {
    this.displayedTasks = this.allTasks.filter(task => {
      let monthMatch = true;
      if (this.selectedMonth !== 'All') {
        const d = task.assigned_date ? (task.assigned_date.toDate ? task.assigned_date.toDate() : new Date(task.assigned_date)) : null;
        if (d) {
          const monthName = d.toLocaleString('default', { month: 'long' });
          monthMatch = monthName === this.selectedMonth;
        } else {
          monthMatch = false;
        }
      }
      
      let workMatch = true;
      if (this.selectedWorkType !== 'All') {
        workMatch = (task.type_of_work || '').toLowerCase() === this.selectedWorkType.toLowerCase();
        if (this.selectedWorkType === 'Artwork' && !task.type_of_work) workMatch = true; // default
      }
      
      return monthMatch && workMatch;
    });
    this.cdr.detectChanges();
  }

  formatDate(ts: any): string {
    if (!ts) return '-';
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleDateString();
  }

  formatHours(seconds: number | undefined): string {
    if (!seconds) return '0h 0m';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${h}h ${m}m`;
  }

  mapStatus(task: any): string {
    if (task.status === 'Completed' || task.status === 'Ready for Dispatch' || task.status === 'Approved') return 'Completed';
    return 'In Progress';
  }

  async exportToExcel() {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Designer Report');

    worksheet.columns = [
      { header: 'Project ID', key: 'project', width: 15 },
      { header: 'SKU_Area', key: 'sku_area', width: 35 },
      { header: 'Type of work', key: 'type', width: 20 },
      { header: 'Date assigned', key: 'assigned', width: 15 },
      { header: 'Date Started', key: 'started', width: 15 },
      { header: 'Hours worked', key: 'hours', width: 15 },
      { header: 'Date Finished', key: 'finished', width: 15 },
      { header: 'Status', key: 'status', width: 15 }
    ];

    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0E0E0' } };

    for (const t of this.displayedTasks) {
      worksheet.addRow({
        project: t.project_fk,
        sku: t.id,
        area: t.composite_item_name,
        size: t.size,
        type: t.type_of_work || 'Artwork',
        hours: this.formatHours(t.time_spent_seconds),
        assigned: this.formatDate(t.assigned_date),
        started: this.formatDate(t.start_time),
        finished: this.formatDate(t.status_updated_at),
        status: this.mapStatus(t)
      });
    }

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, `Designer_Report_${this.currentDesigner!.name}_${new Date().getTime()}.xlsx`);
  }

  computeRowSpans() {
    this.rowSpans = {};
    for (let i = 0; i < this.displayedTasks.length; i++) {
      const projId = this.displayedTasks[i].project_fk;
      if (i === 0 || this.displayedTasks[i-1].project_fk !== projId) {
        let span = 1;
        for (let j = i + 1; j < this.displayedTasks.length; j++) {
          if (this.displayedTasks[j].project_fk === projId) span++;
          else break;
        }
        this.rowSpans[i] = span;
      } else {
        this.rowSpans[i] = 0;
      }
    }
  }
}

  