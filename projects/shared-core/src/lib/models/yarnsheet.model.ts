export interface YarnsheetItem {
  color: string;
  material?: string;
  percentage?: number;
  qty: number;
  batch: string;
  bucket: string;
}

export interface Yarnsheet {
  id?: string;
  project_id: string;
  carpet_id: string;
  shape?: string;
  width?: number;
  length?: number;
  diameter?: number;
  quality?: string;
  area_sqm?: number;
  designer: string;
  timestamp: Date | any;
  items: YarnsheetItem[];
}
