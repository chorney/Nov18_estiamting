
export enum CostCategory {
  LABOR = 'Labor',
  MATERIAL = 'Material',
  EQUIPMENT = 'Equipment',
  SUBCONTRACTOR = 'Subcontractor',
  INDIRECT = 'Indirect'
}

export enum ContractType {
  LUMP_SUM = 'Lump Sum',
  UNIT_PRICE = 'Unit Price',
  TIME_AND_MATERIAL = 'T&M',
  COST_PLUS = 'Cost Plus'
}

export enum RiskLevel {
  LOW = 'Low',
  MEDIUM = 'Medium',
  HIGH = 'High',
  CRITICAL = 'Critical'
}

export enum WBSMode {
  STANDARD = 'Standard Construction',
  CONTRACT = 'Contractual (Pricing)',
  RISK = 'Risk Profile',
  CATEGORY = 'Cost Category'
}

export interface DatabaseItem {
  id: string;
  name: string;
  rate: number; // Hourly rate
  unit: string;
  category: CostCategory;
}

export interface EstimateResource {
  id: string;
  description: string;
  category: CostCategory;
  
  // Core Costing
  quantity: number; // e.g. Hours, CY, EA
  unit: string;
  unitPrice: number;
  total: number;

  notes?: string;
}

export interface EstimateItem {
  id: string;
  description: string;
  
  // High Level Scope
  quantity: number;
  unit: string;
  unitPrice: number; // Plug price if no details exist
  category: CostCategory; // Dominant category for summary
  notes?: string;
  
  // Advanced WBS Tagging
  contractType?: ContractType;
  riskLevel?: RiskLevel;
  
  // Hierarchy & Calculation fields
  subItems?: EstimateItem[]; // Recursive children (Group)
  resources?: EstimateResource[]; // Detailed breakdown (Terminal Node)
  
  // Productivity & Scheduling (Terminal Node Level)
  duration?: number; // In Days
  hoursPerDay?: number; // Standard shift length (default 8)
  
  wbsCode?: string; 
  total: number; 
  expanded?: boolean; 
}

export interface Project {
  id: string;
  name: string;
  client: string;
  location: string;
  status: 'Draft' | 'Active' | 'Completed';
  items: EstimateItem[];
  lastModified: Date;
  currency: string;
}

export type View = 'DASHBOARD' | 'PROJECT_ESTIMATE' | 'COST_DATABASE';
