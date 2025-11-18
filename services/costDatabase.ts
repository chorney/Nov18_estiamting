
import { CostCategory, DatabaseItem } from "../types";

export const LABOR_DATABASE: DatabaseItem[] = [
  { id: 'L-001', name: 'General Laborer', rate: 35.00, unit: 'hr', category: CostCategory.LABOR },
  { id: 'L-002', name: 'Skilled Laborer', rate: 45.00, unit: 'hr', category: CostCategory.LABOR },
  { id: 'L-003', name: 'Foreman', rate: 85.00, unit: 'hr', category: CostCategory.LABOR },
  { id: 'L-004', name: 'Superintendent', rate: 110.00, unit: 'hr', category: CostCategory.LABOR },
  { id: 'L-005', name: 'Carpenter', rate: 65.00, unit: 'hr', category: CostCategory.LABOR },
  { id: 'L-006', name: 'Electrician', rate: 75.00, unit: 'hr', category: CostCategory.LABOR },
  { id: 'L-007', name: 'Plumber', rate: 72.00, unit: 'hr', category: CostCategory.LABOR },
  { id: 'L-008', name: 'Operator - Light', rate: 55.00, unit: 'hr', category: CostCategory.LABOR },
  { id: 'L-009', name: 'Operator - Heavy', rate: 78.00, unit: 'hr', category: CostCategory.LABOR },
  { id: 'L-010', name: 'Ironworker', rate: 82.00, unit: 'hr', category: CostCategory.LABOR },
];

export const EQUIPMENT_DATABASE: DatabaseItem[] = [
  { id: 'E-001', name: 'Excavator (20T)', rate: 185.00, unit: 'hr', category: CostCategory.EQUIPMENT },
  { id: 'E-002', name: 'Excavator (Mini)', rate: 95.00, unit: 'hr', category: CostCategory.EQUIPMENT },
  { id: 'E-003', name: 'Skid Steer Loader', rate: 85.00, unit: 'hr', category: CostCategory.EQUIPMENT },
  { id: 'E-004', name: 'Dozer (D6)', rate: 220.00, unit: 'hr', category: CostCategory.EQUIPMENT },
  { id: 'E-005', name: 'Dump Truck (12cy)', rate: 110.00, unit: 'hr', category: CostCategory.EQUIPMENT },
  { id: 'E-006', name: 'Compactor (Roller)', rate: 75.00, unit: 'hr', category: CostCategory.EQUIPMENT },
  { id: 'E-007', name: 'Telehandler', rate: 105.00, unit: 'hr', category: CostCategory.EQUIPMENT },
  { id: 'E-008', name: 'Scissor Lift', rate: 45.00, unit: 'hr', category: CostCategory.EQUIPMENT },
  { id: 'E-009', name: 'Generator (50kW)', rate: 60.00, unit: 'hr', category: CostCategory.EQUIPMENT },
  { id: 'E-010', name: 'Concrete Pump', rate: 250.00, unit: 'hr', category: CostCategory.EQUIPMENT },
];