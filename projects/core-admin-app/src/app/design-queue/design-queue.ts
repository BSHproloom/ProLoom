import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { SelectionModel } from '@angular/cdk/collections';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { Carpet } from 'shared-core';

const MOCK_UNASSIGNED: Carpet[] = [
  { id: 'SKU-001', project_fk: 'P-12601', composite_item_name: 'Lobby Main Rug', size: '10x15', quality: 'ht-850', no_of_rugs: 1, designer: '', yarn_sheet_status: 'Pending', status: 'Need to Assign', is_working: false, time_spent_seconds: 0 },
  { id: 'SKU-002', project_fk: 'P-12601', composite_item_name: 'Lobby Corridor', size: '5x20', quality: 'ht-850', no_of_rugs: 4, designer: '', yarn_sheet_status: 'Pending', status: 'Need to Assign', is_working: false, time_spent_seconds: 0 },
  { id: 'SKU-003', project_fk: 'P-12602', composite_item_name: 'Suite Master', size: '20x30', quality: 'ht-650', no_of_rugs: 1, designer: '', yarn_sheet_status: 'Sourcing', status: 'Need to Assign', is_working: false, time_spent_seconds: 0 }
];

@Component({
  selector: 'app-design-queue',
  standalone: true,
  imports: [CommonModule, MatTableModule, MatCheckboxModule, MatSelectModule, MatButtonModule],
  templateUrl: './design-queue.html',
  styleUrl: './design-queue.css',
})
export class DesignQueue {
  displayedColumns: string[] = ['select', 'id', 'project_fk', 'composite_item_name', 'size'];
  dataSource = new MatTableDataSource<Carpet>(MOCK_UNASSIGNED);
  selection = new SelectionModel<Carpet>(true, []);

  designers = ['Alice', 'Bob', 'Charlie'];
  selectedDesigner = '';

  isAllSelected() {
    const numSelected = this.selection.selected.length;
    const numRows = this.dataSource.data.length;
    return numSelected === numRows;
  }

  toggleAllRows() {
    if (this.isAllSelected()) {
      this.selection.clear();
      return;
    }
    this.selection.select(...this.dataSource.data);
  }

  assign() {
    if (this.selection.selected.length === 0 || !this.selectedDesigner) return;
    
    // In real app, call service to update Firestore
    const assignedIds = this.selection.selected.map(c => c.id).join(', ');
    alert(`Assigned ${assignedIds} to ${this.selectedDesigner}`);
    
    // Remove from mock data
    const remaining = this.dataSource.data.filter(c => !this.selection.selected.includes(c));
    this.dataSource.data = remaining;
    this.selection.clear();
  }
}
