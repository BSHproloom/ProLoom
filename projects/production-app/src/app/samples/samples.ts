import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SampleService, Sample, NotificationService } from 'shared-core';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { ProjectService, CarpetService, Project, Carpet } from 'shared-core';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

@Component({
  selector: 'app-production-samples',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatTableModule, MatButtonModule, MatIconModule, MatMenuModule],
  template: `
    <div class="p-6">
      <div class="flex items-center justify-between mb-6">
        <h1 class="text-2xl font-bold text-gray-800">Sample Requests</h1>
      </div>

      <mat-card class="aesthetic-card">
        <div class="overflow-x-auto">
          <table mat-table [dataSource]="samples" class="w-full whitespace-nowrap">
            
            <ng-container matColumnDef="id">
              <th mat-header-cell *matHeaderCellDef> Sample ID </th>
              <td mat-cell *matCellDef="let element"> <span class="font-medium text-blue-600">{{element.id}}</span> </td>
            </ng-container>

            <ng-container matColumnDef="carpet_fk">
              <th mat-header-cell *matHeaderCellDef> Carpet SKU </th>
              <td mat-cell *matCellDef="let element"> {{element.carpet_fk}} </td>
            </ng-container>

            <ng-container matColumnDef="sample_type">
              <th mat-header-cell *matHeaderCellDef> Type </th>
              <td mat-cell *matCellDef="let element"> {{element.sample_type}} </td>
            </ng-container>

            <ng-container matColumnDef="sample_size">
              <th mat-header-cell *matHeaderCellDef> Size </th>
              <td mat-cell *matCellDef="let element"> {{element.sample_size || '-'}} </td>
            </ng-container>

            <ng-container matColumnDef="sample_material">
              <th mat-header-cell *matHeaderCellDef> Material </th>
              <td mat-cell *matCellDef="let element"> {{element.sample_material || '-'}} </td>
            </ng-container>

            <ng-container matColumnDef="sample_construction">
              <th mat-header-cell *matHeaderCellDef> Construction </th>
              <td mat-cell *matCellDef="let element"> {{element.sample_construction || '-'}} </td>
            </ng-container>

            <ng-container matColumnDef="completion_date">
              <th mat-header-cell *matHeaderCellDef> Completion Date </th>
              <td mat-cell *matCellDef="let element">
                <span *ngIf="element.completion_date" class="font-medium text-gray-700">{{element.completion_date | date}}</span>
                <span *ngIf="!element.completion_date" class="text-gray-400 italic">Not set</span>
              </td>
            </ng-container>

            <ng-container matColumnDef="status">
              <th mat-header-cell *matHeaderCellDef> Status </th>
              <td mat-cell *matCellDef="let element">
                <span class="px-3 py-1 rounded-full text-xs font-semibold shadow-sm border"
                  [ngClass]="{
                    'bg-yellow-50 text-yellow-700 border-yellow-200': element.status === 'Pending',
                    'bg-blue-50 text-blue-700 border-blue-200': element.status === 'In Progress',
                    'bg-red-50 text-red-700 border-red-200': element.status === 'Revision Requested',
                    'bg-green-50 text-green-700 border-green-200': element.status === 'Approved' || element.status === 'Completed'
                  }">
                  {{element.status}}
                </span>
              </td>
            </ng-container>

            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef> Actions </th>
              <td mat-cell *matCellDef="let element">
                <button mat-icon-button [matMenuTriggerFor]="menu" color="primary">
                  <mat-icon>more_vert</mat-icon>
                </button>
                <mat-menu #menu="matMenu">
                  <button mat-menu-item (click)="setCompletionDate(element)">
                    <mat-icon color="primary">event</mat-icon>
                    <span>Set Completion Date</span>
                  </button>
                  <button mat-menu-item (click)="printSampleRequest(element)">
                    <mat-icon color="primary">print</mat-icon>
                    <span>Print Sample Request</span>
                  </button>
                  <button mat-menu-item (click)="updateStatus(element, 'In Progress')" [disabled]="element.status === 'In Progress'">
                    <mat-icon color="primary">engineering</mat-icon>
                    <span>Mark In Progress</span>
                  </button>
                  <button mat-menu-item (click)="updateStatus(element, 'Completed')" [disabled]="element.status === 'Completed'">
                    <mat-icon color="accent">check_circle</mat-icon>
                    <span>Mark Completed</span>
                  </button>
                </mat-menu>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns;" class="hover:bg-gray-50 transition-colors duration-150"></tr>
          </table>
        </div>
      </mat-card>
    </div>
  `,
  styles: [`
    .aesthetic-card {
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 4px 20px rgba(0,0,0,0.05);
      border: 1px solid rgba(0,0,0,0.05);
    }
    th.mat-header-cell {
      font-weight: 600;
      color: #4b5563;
      font-size: 13px;
      letter-spacing: 0.5px;
      text-transform: uppercase;
    }
  `]
})
export class ProductionSamples implements OnInit {
  private sampleService = inject(SampleService);
  private notificationService = inject(NotificationService);
  private projectService = inject(ProjectService);
  private carpetService = inject(CarpetService);

  samples: Sample[] = [];
  allCarpets: Carpet[] = [];
  allProjects: Project[] = [];
  displayedColumns: string[] = ['id', 'carpet_fk', 'sample_type', 'sample_size', 'sample_material', 'sample_construction', 'completion_date', 'status', 'actions'];

  ngOnInit() {
    this.sampleService.getSamples().subscribe(s => {
      this.samples = s;
    });
    this.carpetService.getAllCarpets().subscribe(c => {
      this.allCarpets = c;
    });
    this.projectService.getProjects().subscribe(p => {
      this.allProjects = p;
    });
  }

  async setCompletionDate(sample: Sample) {
    const dateStr = prompt('Enter completion date (YYYY-MM-DD):', sample.completion_date || new Date().toISOString().split('T')[0]);
    if (dateStr) {
      try {
        await this.sampleService.updateCompletionDate(sample.id, dateStr);
        await this.notificationService.sendNotification({
          recipient_email: '',
          recipient_role: 'Account Manager',
          message: `Completion date set to ${dateStr} for ${sample.carpet_fk} sample.`,
          read_status: false,
          timestamp: new Date()
        });
        alert('Completion date updated and AM notified.');
      } catch (e) {
        console.error(e);
        alert('Failed to update completion date.');
      }
    }
  }

  async updateStatus(sample: Sample, status: string) {
    try {
      await this.sampleService.updateStatus(sample.id, status);
      await this.notificationService.sendNotification({
        recipient_email: '',
        recipient_role: 'Account Manager',
        message: `Sample ${sample.id} is now ${status}.`,
        read_status: false,
        timestamp: new Date()
      });
      alert('Status updated!');
    } catch (e) {
      console.error(e);
      alert('Failed to update status.');
    }
  }

  async printSampleRequest(sample: Sample) {
    let carpet = this.allCarpets.find(c => c.id === sample.carpet_fk);
    if (!carpet) {
      // Try to fetch it directly from the database if not yet loaded in allCarpets
      carpet = await this.carpetService.getCarpetById(sample.carpet_fk) as Carpet;
      if (!carpet) {
        alert('Carpet details not found. Make sure the carpet exists in the database.');
        return;
      }
    }
    
    let project = this.allProjects.find(p => p.id === carpet!.project_fk);
    if (!project) {
      project = await this.projectService.getProjectByIdAsync(carpet.project_fk) as Project;
    }

    const doc = new jsPDF();
    const today = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

    // --- HEADER ---
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.text('BSH', 15, 20);
    doc.text('Walls &', 15, 28);
    doc.text('Floors', 15, 36);

    doc.setFontSize(24);
    doc.text('Sample Request Form', 105, 28, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text('Suite 801 | The Exchange Tower', 195, 20, { align: 'right' });
    doc.text('Business Bay | Dubai | UAE', 195, 25, { align: 'right' });
    doc.text('VAT No. 100291554200003', 195, 30, { align: 'right' });

    // Divider line
    doc.setLineWidth(1);
    doc.line(15, 42, 195, 42);

    // --- TOP TABLE ---
    autoTable(doc, {
      startY: 48,
      theme: 'plain',
      styles: {
        lineColor: [0, 0, 0],
        lineWidth: 0.1,
        fontSize: 10,
        textColor: [0, 0, 0],
        cellPadding: 4,
      },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 40 },
        1: { cellWidth: 50 },
        2: { fontStyle: 'bold', cellWidth: 35 },
        3: { cellWidth: 45 },
      },
      body: [
        ['Company Name', `: ${project?.client_name || ''}`, 'Date', `: ${today}`],
        ['Project Name', `: ${project?.project_name || ''}`, 'Sample Ref No', `: ${carpet.id || ''}`],
        ['Project Status', ': In Production', 'AM', `: ${project?.am || ''}`],
        ['Client Expectation', ': ', '', ''], // We merge cells below
      ],
      didParseCell: (data) => {
        if (data.row.index === 3 && data.column.index === 1) {
          data.cell.colSpan = 3;
        }
      }
    });

    // --- BOTTOM TABLE ---
    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY,
      theme: 'plain',
      styles: {
        lineColor: [0, 0, 0],
        lineWidth: 0.1,
        fontSize: 10,
        textColor: [0, 0, 0],
        cellPadding: 4,
      },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 50 },
        1: { cellWidth: 100 },
        2: { cellWidth: 30, halign: 'center' },
      },
      body: [
        [
          { content: '', colSpan: 2, styles: { lineWidth: 0 } }, 
          { content: 'QC', styles: { fontStyle: 'bold', halign: 'center', lineWidth: 0.1 } }
        ],
        ['Quality', { content: sample.sample_construction || carpet.quality || '', styles: { textColor: [255, 0, 0], fontStyle: 'bold' } }, ''],
        ['Yarn Compositions', sample.sample_material || carpet.material || 'Wool', ''],
        ['Construction', sample.sample_construction || carpet.quality || 'One Level Cut Pile', ''],
        ['Finished Pile Height', '', ''],
        ['Sample Sizes :', sample.sample_size || carpet.size || '', ''],
        ['No. of Sample/s', '1', ''],
        ['Carving', '', ''],
        ['Colors', { content: 'BSH 501', styles: { textColor: [255, 0, 0], fontStyle: 'bold' } }, ''],
        ['Important Instructions:', { content: sample.sample_instructions || carpet.sample_instructions || '', colSpan: 2, styles: { minCellHeight: 30 } }]
      ],
      didParseCell: (data) => {
        // Adjust top border of first row to match the image
        if (data.row.index === 0 && data.column.index !== 2) {
          data.cell.styles.lineWidth = 0;
          data.cell.styles.lineColor = [255,255,255];
        }
      }
    });

    // --- FOOTER ---
    const finalY = (doc as any).lastAutoTable.finalY + 30;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Created By : ___________________', 15, finalY);
    doc.text('Received by : ___________________', 120, finalY);

    doc.save(`Sample_Request_${sample.id}.pdf`);
  }
}
