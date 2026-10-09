export interface ActivityLog {
  id?: string;
  carpet_id: string;
  project_id: string;
  user_name: string;
  action: string;
  comment: string;
  time_spent_seconds?: number;
  timestamp: Date | any;
}
