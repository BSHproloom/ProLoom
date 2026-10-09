import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProjectService, CarpetService, Project, Carpet, UserService, ActivityLogService, NotificationService, PushService, User } from 'shared-core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { SelectionModel } from '@angular/cdk/collections';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

import { MatMenuModule } from '@angular/material/menu';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { SampleService } from 'shared-core';

interface ProjectSamples {
  project: Project;
  carpets: Carpet[];
}

@Component({
  selector: 'app-samples',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule, MatExpansionModule, MatButtonModule, MatTableModule, MatCheckboxModule, MatMenuModule, MatFormFieldModule, MatInputModule, FormsModule],
  templateUrl: './samples.html',
  styleUrl: './samples.css'
})
export class Samples implements OnInit {
  private projectService = inject(ProjectService);
  private carpetService = inject(CarpetService);
  private userService = inject(UserService);
  private activityLogService = inject(ActivityLogService);
  private notifService = inject(NotificationService);
  private pushService = inject(PushService);
  private sampleService = inject(SampleService);

  pendingProjectGroups: { project: Project; carpets: Carpet[] }[] = [];
  readyProjectGroups: { project: Project; carpets: Carpet[] }[] = [];
  activeWorkGroups: { project: Project; carpets: Carpet[] }[] = [];
  pendingCount = 0;
  readyCount = 0;
  activeCount = 0;

  allProjects: Project[] = [];
  designers: User[] = [];
  productionSamples: any[] = [];
  loading = true;
  allCarpetsList: Carpet[] = [];

  selection = new SelectionModel<Carpet>(true, []);

  ngOnInit() {
    this.userService.getUsers().subscribe(users => {
      this.designers = users.filter(u => u.role === 'Designer');
    });

    this.sampleService.getSamples().subscribe(samples => {
      this.productionSamples = samples;
    });

    this.projectService.getProjects().subscribe(projects => {
      this.allProjects = projects;
      this.carpetService.getAllCarpets().subscribe(carpets => {
        this.allCarpetsList = carpets;
        const sampleCarpets = carpets.filter(c => 
          c.status === 'Sent to AM' || 
          c.status === 'Approved' || 
          c.status === 'Sample Requested' ||
          (c.type_of_work === 'Sample' && (c.status === 'Review Pending' || c.status === 'Pending SC Review' || c.status === 'In Progress' || c.status === 'Assigned' || c.status === 'Revision Needed' || c.status === 'Revision Requested'))
        );

        const pendingGroups: { [key: string]: { project: Project; carpets: Carpet[] } } = {};
        const readyGroups: { [key: string]: { project: Project; carpets: Carpet[] } } = {};
        const activeGroups: { [key: string]: { project: Project; carpets: Carpet[] } } = {};

        this.pendingCount = 0;
        this.readyCount = 0;
        this.activeCount = 0;

        sampleCarpets.forEach(c => {
          if (c.status === 'Review Pending' || c.status === 'Pending SC Review') {
            if (!pendingGroups[c.project_fk]) {
              const p = projects.find(proj => proj.id === c.project_fk);
              if (p) pendingGroups[c.project_fk] = { project: p, carpets: [] };
            }
            if (pendingGroups[c.project_fk]) {
              pendingGroups[c.project_fk].carpets.push(c);
              this.pendingCount++;
            }
          } else if (c.status === 'In Progress' || c.status === 'Assigned' || c.status === 'Revision Needed' || c.status === 'Revision Requested') {
            if (!activeGroups[c.project_fk]) {
              const p = projects.find(proj => proj.id === c.project_fk);
              if (p) activeGroups[c.project_fk] = { project: p, carpets: [] };
            }
            if (activeGroups[c.project_fk]) {
              activeGroups[c.project_fk].carpets.push(c);
              this.activeCount++;
            }
          } else {
            if (!readyGroups[c.project_fk]) {
              const p = projects.find(proj => proj.id === c.project_fk);
              if (p) readyGroups[c.project_fk] = { project: p, carpets: [] };
            }
            if (readyGroups[c.project_fk]) {
              readyGroups[c.project_fk].carpets.push(c);
              this.readyCount++;
            }
          }
        });

        this.pendingProjectGroups = Object.values(pendingGroups);
        this.readyProjectGroups = Object.values(readyGroups);
        this.activeWorkGroups = Object.values(activeGroups);
        this.loading = false;
      });
    });
  }

  isAllSelected(group: { carpets: Carpet[] }) {
    const numSelected = group.carpets.filter(c => this.selection.isSelected(c)).length;
    const numRows = group.carpets.length;
    return numSelected === numRows && numRows > 0;
  }

  hasSelected(group: { carpets: Carpet[] }) {
    return group.carpets.some(c => this.selection.isSelected(c));
  }

  toggleAll(group: { carpets: Carpet[] }) {
    if (this.isAllSelected(group)) {
      group.carpets.forEach(c => this.selection.deselect(c));
    } else {
      group.carpets.forEach(c => this.selection.select(c));
    }
  }

  getProjectForCarpet(carpet: Carpet): Project | undefined {
    return this.allProjects.find(p => p.id === carpet.project_fk);
  }

  getProjectName(carpet: Carpet): string {
    return this.getProjectForCarpet(carpet)?.project_name || 'Unknown Project';
  }

  async approve(carpet: Carpet) {
    await this.carpetService.updateCarpet(carpet.id, { 
      status: 'Sample Approved',
      review_comments: '',
      status_updated_at: new Date()
    });

    try {
      await this.sampleService.addSample({
        carpet_fk: carpet.id,
        sample_type: carpet.sample_construction || carpet.quality || 'Sample',
        status: 'Pending',
        sample_size: carpet.sample_size || '',
        sample_material: carpet.sample_material || '',
        sample_construction: carpet.sample_construction || '',
        sample_instructions: carpet.sample_instructions || ''
      });
    } catch (e) {
      console.error('Error auto-sending sample to production:', e);
    }
    
    await this.activityLogService.logActivity({
      carpet_id: carpet.id,
      project_id: carpet.project_fk,
      user_name: 'Admin',
      action: 'Sample Approved & Sent to Production',
      comment: 'Sample submitted by designer was approved and automatically sent to production.',
      timestamp: new Date()
    });
  }

  async revise(carpet: Carpet) {
    const comment = window.prompt("Enter revision comment:", carpet.review_comments || "Please revise the sample details.");
    if (comment === null) return; // cancelled

    await this.carpetService.updateCarpet(carpet.id, { 
      status: 'Revision Needed',
      review_comments: comment,
      yarn_sheet_updated: false 
    });
    
    await this.activityLogService.logActivity({
      carpet_id: carpet.id,
      project_id: carpet.project_fk,
      user_name: 'Admin',
      action: 'Revision Requested',
      comment: comment,
      timestamp: new Date()
    });

    const d = this.designers.find(x => x.name === carpet.designer);
    if (d) {
      await this.notifService.sendNotification({
        recipient_email: d.email,
        message: `Revision requested for ${carpet.composite_item_name} (${carpet.id}): ${comment}`,
        read_status: false,
        timestamp: new Date()
      });

      if (d.fcmTokens && d.fcmTokens.length > 0) {
        this.pushService.sendPushNotification(
          d.fcmTokens,
          'Artwork Revision Requested',
          `Revision requested for ${carpet.composite_item_name} (${carpet.id})`
        );
      }
    }
  }

  generateIndividualSampleRequest(carpet: Carpet) {
    this.printCarpets([carpet]);
  }

  async sendToProduction(carpet: Carpet) {
    if (confirm(`Send sample ${carpet.id} to Production?`)) {
      await this.sampleService.addSample({
        carpet_fk: carpet.id,
        sample_type: carpet.sample_construction || carpet.quality || 'Sample',
        status: 'Pending',
        sample_size: carpet.sample_size || '',
        sample_material: carpet.sample_material || '',
        sample_construction: carpet.sample_construction || '',
        sample_instructions: carpet.sample_instructions || ''
      });

      await this.activityLogService.logActivity({
        carpet_id: carpet.id,
        project_id: carpet.project_fk,
        user_name: 'Admin',
        action: 'Sent to Production',
        comment: `Sample request sent to production tool.`,
        timestamp: new Date()
      });

      // Notify Production
      await this.notifService.sendNotification({
        recipient_role: 'Production',
        recipient_email: '',
        message: `New sample request sent to Production for ${carpet.composite_item_name}.`,
        read_status: false,
        timestamp: new Date()
      });

      this.userService.getUsers().subscribe(users => {
        const prodUsers = users.filter(u => u.role === 'Production');
        const tokens: string[] = [];
        prodUsers.forEach(u => {
          if (u.fcmTokens) tokens.push(...u.fcmTokens);
        });
        if (tokens.length > 0) {
          this.pushService.sendPushNotification(
            tokens,
            'New Sample Production Request',
            `New sample request sent to Production for ${carpet.composite_item_name}.`
          );
        }
      });

      alert(`Sample request sent to production successfully.`);
    }
  }

  printProductionSample(sample: any) {
    const carpet = this.allCarpetsList.find(c => c.id === sample.carpet_fk);
    if (carpet) {
      this.printCarpets([carpet]);
    } else {
      alert('Could not find corresponding carpet details for this sample.');
    }
  }

  printSelectedGroup(group: { carpets: Carpet[] }) {
    const selectedCarpets = group.carpets.filter(c => this.selection.isSelected(c));
    this.printCarpets(selectedCarpets);
  }

  printCarpets(carpets: Carpet[]) {
    if (carpets.length === 0) {
      alert('Please select at least one carpet to generate a sample request.');
      return;
    }
    
    const doc = new jsPDF();
    const today = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

    let isFirstPage = true;

    carpets.forEach((carpet, index) => {
      if (!isFirstPage) {
        doc.addPage();
      }
      isFirstPage = false;

      const project = this.getProjectForCarpet(carpet);

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
        margin: { left: 15, right: 15 },
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

      // --- MIDDLE TABLE ---
      autoTable(doc, {
        startY: (doc as any).lastAutoTable.finalY + 10,
        theme: 'grid',
        margin: { left: 15, right: 15 },
        styles: {
          lineColor: [0, 0, 0],
          lineWidth: 0.1,
          fontSize: 10,
          textColor: [0, 0, 0],
          cellPadding: 4,
        },
        columnStyles: {
          0: { fontStyle: 'bold', fillColor: [240, 240, 240], cellWidth: 60 },
          1: { cellWidth: 120 },
        },
        body: [
          ['Quality', carpet.quality || ''],
          ['Yarn Compositions', carpet.sample_material || carpet.material || ''],
          ['Construction', carpet.sample_construction || carpet.quality || ''],
          ['Sample Sizes :', carpet.sample_size || carpet.size || ''],
          ['Finishing / Special Instruction :', carpet.sample_instructions || ''],
          ['No. of Samples :', carpet.no_of_rugs?.toString() || ''],
          ['Remarks / Ref:', ''],
        ]
      });

      // --- BOTTOM TABLE ---
      autoTable(doc, {
        startY: (doc as any).lastAutoTable.finalY,
        theme: 'plain',
        margin: { left: 15, right: 15 },
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
          ['Carving', '', ''],
          ['Colors', { content: 'BSH 501', styles: { textColor: [255, 0, 0], fontStyle: 'bold' } }, '']
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
    });

    doc.save(`Sample_Request_${new Date().getTime()}.pdf`);
  }
}
