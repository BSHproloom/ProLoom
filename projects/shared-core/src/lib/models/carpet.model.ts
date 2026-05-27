export interface Carpet {
  id: string; // SKU No
  project_fk: string; // Parent Project ID
  composite_item_name: string;
  size: string;
  quality: string;
  no_of_rugs: number;
  designer: string;
  yarn_sheet_status: string; // 'Pending', 'Sourcing', 'Lab Dip Requested', 'Ready'
  status: string; // Workflow phase: 'Need to Assign', 'In Progress', 'Revision Requested', 'Approved', etc.
  is_working: boolean;
  time_spent_seconds: number;
}
