import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { MatTabsModule } from '@angular/material/tabs';
import { Carpet, CarpetService, ProjectService, Project } from 'shared-core';
import * as ExcelJS from 'exceljs';
// @ts-ignore
import { saveAs } from 'file-saver';

interface AdminReportTask extends Carpet {
  projectName?: string;
  clientName?: string;
  amName?: string;
}

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatTableModule, MatSelectModule, MatButtonModule, MatIconModule, FormsModule, MatTabsModule],
  templateUrl: './reports.html',
  styleUrl: './reports.css',
})
export class Reports implements OnInit {
  private carpetService = inject(CarpetService);
  private projectService = inject(ProjectService);
  private cdr = inject(ChangeDetectorRef);
  
  allTasks: AdminReportTask[] = [];
  displayedTasks: AdminReportTask[] = [];
  rowSpans: any = {};
  projects: Project[] = [];
  
  months = ['All', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  selectedMonth = 'All';
  
  workTypes = ['All', 'Artwork', 'Artwork revision', 'Sample', 'Production files'];
  selectedWorkType = 'All';
  
  displayedColumns: string[] = ['clientName', 'projectCombo', 'amName', 'typeOfWork', 'dateAssigned', 'dateStarted', 'dateFinished', 'designerName'];

  async ngOnInit() {
    await this.loadData();
  }

  async loadData() {
    this.projectService.getProjects().subscribe(projects => {
      this.projects = projects;
      this.carpetService.getAllCarpets().subscribe(tasks => {
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
        if (this.selectedWorkType === 'Artwork' && !task.type_of_work) workMatch = true;
      }
      
      return monthMatch && workMatch;
    });
    this.computeRowSpans();
    this.cdr.detectChanges();
  }

  formatDate(ts: any): string {
    if (!ts) return '-';
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleDateString();
  }

  async exportToExcel() {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Daily Report');

    worksheet.columns = [
      { header: 'Client Name', key: 'client', width: 20 },
      { header: 'Project ID_Project Name', key: 'project', width: 35 },
      { header: 'AM', key: 'am', width: 20 },
      { header: 'Type of work', key: 'type', width: 20 },
      { header: 'Date assigned', key: 'assigned', width: 15 },
      { header: 'Date Started', key: 'started', width: 15 },
      { header: 'Date Finished', key: 'finished', width: 15 },
      { header: 'Designer', key: 'designer', width: 20 }
    ];

    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0E0E0' } };

    for (const t of this.displayedTasks) {
      worksheet.addRow({
        client: t.clientName || 'N/A',
        project: `${t.project_fk}_${t.projectName || 'N/A'}`,
        am: t.amName || 'N/A',
        type: t.type_of_work || 'Artwork',
        assigned: this.formatDate(t.assigned_date),
        started: this.formatDate(t.start_time),
        finished: this.formatDate(t.status_updated_at),
        designer: t.designer || 'Unassigned'
      });
    }

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, `Admin_Daily_Report_${new Date().getTime()}.xlsx`);
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

  