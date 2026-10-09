export interface Carpet {
  id: string;
  client_name?: string;
  project_name?: string;
  selectedDesigner?: string; // SKU No
  project_fk: string; // Parent Project ID
  composite_item_name: string;
  size: string; // Keep for string representation like '10x12' if needed, or remove? I will keep it.
  width?: number;
  height?: number;
  area?: number;
  quality: string;
  material?: string;
  no_of_rugs: number;
  designer: string; // Name of assigned designer
  yarn_sheet_status: string; // 'Pending', 'Sourcing', 'Lab Dip Requested', 'Ready'
  status: string; // Workflow phase: 'Need to Assign', 'Assigned', 'In Progress', 'Review Pending', 'Revision Needed', 'Sent to AM', 'Approved', etc.
  is_working: boolean;
  time_spent_seconds: number;
  manual_hours_spent?: number; // Added for manual hour tracking
  type_of_work?: string; // 'Artwork', 'Artwork revision', 'sample', 'production files'
  review_comments?: string; // Added for bidirectional review comments
  designer_readiness_date?: Date | any;
  start_time?: Date | any;
  estimated_tufting_date?: Date | any;
  estimated_finishing_date?: Date | any;
  carpet_type?: string; // 'Rug' | 'wall to wall' | 'inserted'
  added_allowance?: boolean; // For wall to wall or inserted only
  assigned_date?: Date | any; // Tracks when the carpet was assigned to a designer
  dimensions_from?: string; // 'Mr. Taher' or 'CAD' (for wall to wall)
  taher_details?: string; // TR No, Quantifications, Special Notes
  yarn_sheet_updated?: boolean; // Tracks if yarn sheet was created/revised
  revision?: number;
  designer_folder_link?: string;
  designer_folder_path?: string;
  yarn_eta?: Date | any;
  assigned_loom?: number; // 1-12
  loom_start_date?: Date | any;
  loom_end_date?: Date | any;
  status_updated_at?: Date | any; // For CEO bottleneck tracking
  total_manual_hours?: number; // Cumulative hours after reassignment
  requested_delivery?: Date | any; // Optional requested delivery date for partial deliveries
  sample_size?: string; // Captured by designer for samples
  sample_material?: string; // Captured by designer for samples
  sample_construction?: string; // Captured by designer for samples
  sample_instructions?: string; // Captured by designer for samples
  is_urgent?: boolean; // For prioritizing urgent samples/tasks
  designer_remark?: string; // Remark added by designer upon task completion
  files?: {
    main?: string;
    sample_taken_area?: string;
    sample_file?: string;
    technology_file?: string;
  };
}
