import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { YarnOrderService, YarnOrderRequest, NotificationService, ProjectService, UserService } from 'shared-core';

@Component({
  selector: 'app-add-yarn-order-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatButtonModule, MatDialogModule],
  template: `
    <h2 mat-dialog-title>Create Yarn Order Request</h2>
    <mat-dialog-content>
      <form [formGroup]="form" style="display: flex; flex-direction: column; gap: 16px; margin-top: 16px; min-width: 300px;">
        <mat-form-field appearance="outline">
          <mat-label>Project ID</mat-label>
          <input matInput formControlName="project_id" required>
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Carpet SKU / ID</mat-label>
          <input matInput formControlName="carpet_id" required>
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Color Code</mat-label>
          <input matInput formControlName="color_code" required>
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Quantity (kg)</mat-label>
          <input matInput type="number" formControlName="quantity_kg" required>
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Purpose</mat-label>
          <mat-select formControlName="purpose" required>
            <mat-option value="Sample">Sample Production</mat-option>
            <mat-option value="Production">Final Production</mat-option>
          </mat-select>
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Notes (Optional)</mat-label>
          <textarea matInput formControlName="notes"></textarea>
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button mat-flat-button color="primary" [disabled]="!form.valid" (click)="submit()">Submit Request</button>
    </mat-dialog-actions>
  `
})
export class AddYarnOrderDialog {
  form: FormGroup;
  constructor(private fb: FormBuilder, public dialogRef: MatDialogRef<AddYarnOrderDialog>) {
    this.form = this.fb.group({
      project_id: ['', Validators.required],
      carpet_id: ['', Validators.required],
      color_code: ['', Validators.required],
      quantity_kg: [1, [Validators.required, Validators.min(0.1)]],
      purpose: ['Production', Validators.required],
      notes: ['']
    });
  }

  submit() {
    if (this.form.valid) {
      this.dialogRef.close(this.form.value);
    }
  }
}

@Component({
  selector: 'app-yarn-orders',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatTableModule, MatButtonModule, MatIconModule, MatDialogModule],
  templateUrl: './yarn-orders.html',
  styleUrl: './yarn-orders.css'
})
export class YarnOrders implements OnInit {
  orders: YarnOrderRequest[] = [];
  displayedColumns = ['project_id', 'carpet_id', 'color_code', 'quantity', 'purpose', 'status', 'requested_by', 'requested_at', 'actions'];

  private yarnOrderService = inject(YarnOrderService);
  private dialog = inject(MatDialog);
  private userService = inject(UserService);

  ngOnInit() {
    this.yarnOrderService.getYarnOrders().subscribe(orders => {
      this.orders = orders.sort((a, b) => b.requested_at?.toMillis() - a.requested_at?.toMillis());
    });
  }

  openAddDialog() {
    const dialogRef = this.dialog.open(AddYarnOrderDialog);
    dialogRef.afterClosed().subscribe(async result => {
      if (result) {
        try {
          const newOrder: Partial<YarnOrderRequest> = {
            ...result,
            status: 'Pending',
            requested_by: 'SC Admin',
            requested_at: new Date()
          };
          await this.yarnOrderService.addYarnOrder(newOrder);
        } catch (e) {
          console.error(e);
          alert('Failed to add yarn order.');
        }
      }
    });
  }

  async markAsOrdered(order: YarnOrderRequest) {
    if (confirm(`Mark yarn ${order.color_code} as Ordered?`)) {
      await this.yarnOrderService.updateYarnOrder(order.id!, { status: 'Ordered' });
    }
  }

  async markAsArrived(order: YarnOrderRequest) {
    if (confirm(`Mark yarn ${order.color_code} as Arrived?`)) {
      await this.yarnOrderService.updateYarnOrder(order.id!, { status: 'Arrived' });
    }
  }

  async deleteOrder(order: YarnOrderRequest) {
    if (confirm(`Delete this order request?`)) {
      await this.yarnOrderService.deleteYarnOrder(order.id!);
    }
  }

  exportCSV() {
    let csv = 'Project ID,Carpet ID,Color Code,Quantity (kg),Purpose,Status,Requested By,Date\n';
    this.orders.forEach(o => {
      const date = o.requested_at?.toDate ? o.requested_at.toDate().toLocaleDateString() : new Date(o.requested_at).toLocaleDateString();
      csv += `${o.project_id},${o.carpet_id},${o.color_code},${o.quantity_kg},${o.purpose},${o.status},${o.requested_by},${date}\n`;
    });
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `yarn_orders_${new Date().getTime()}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  }
}
