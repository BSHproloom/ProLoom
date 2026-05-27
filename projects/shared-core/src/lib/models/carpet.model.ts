export interface Carpet {
  id: string; // SKU No
  project_fk: string; // Parent Project ID
  composite_item_name: string;
  size: string;
  quality: string;
  no_of_rugs: number;
  designer: string; // Name of assigned designer
  yarn_sheet_status: string; // 'Pending', 'Sourcing', 'Lab Dip Requested', 'Ready'
  status: string; // Workflow phase: 'Need to Assign', 'Assigned', 'In Progress', 'Review Pending', 'Revision Needed', 'Sent to AM', 'Approved', etc.
  is_working: boolean;
  time_spent_seconds: number;
  designer_readiness_date: Date | any; // Estimated Finishing Date
  start_time: Date | any | null; // Null if not currently working
}
