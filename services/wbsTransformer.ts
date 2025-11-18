
import { EstimateItem, WBSMode, CostCategory, ContractType, RiskLevel } from "../types";

// Helper to deep clone
const clone = (items: EstimateItem[]) => JSON.parse(JSON.stringify(items));

// Helper to flatten tree into a list of terminal nodes (items with no children or explicit terminal items)
const flattenToTerminal = (items: EstimateItem[]): EstimateItem[] => {
  let terminal: EstimateItem[] = [];
  
  items.forEach(item => {
    if (item.subItems && item.subItems.length > 0) {
      terminal = [...terminal, ...flattenToTerminal(item.subItems)];
    } else {
      terminal.push(item);
    }
  });
  
  return terminal;
};

// Helper to generate a Group Node
const createGroup = (id: string, description: string, children: EstimateItem[], wbsPrefix: string): EstimateItem => {
  const total = children.reduce((sum, c) => sum + c.total, 0);
  
  // Recalculate WBS codes for children
  const childrenWithWbs = children.map((c, idx) => ({
    ...c,
    wbsCode: `${wbsPrefix}.${idx + 1}`
  }));

  return {
    id: `GROUP-${id}`,
    description: description,
    quantity: 1,
    unit: 'ls',
    unitPrice: 0,
    category: CostCategory.INDIRECT, // Default for group headers
    total: total,
    expanded: true,
    wbsCode: wbsPrefix,
    subItems: childrenWithWbs
  };
};

export const transformWBS = (items: EstimateItem[], mode: WBSMode): EstimateItem[] => {
  // 1. If Standard, just return as is (but maybe ensure totals are calc'd)
  if (mode === WBSMode.STANDARD) {
    return items;
  }

  // 2. Flatten to get all "Leaf" nodes (The actual work)
  // We clone first to avoid mutating the original state reference
  const terminalItems = flattenToTerminal(clone(items));

  // 3. Group based on Mode
  const groups: Record<string, EstimateItem[]> = {};
  const uncategorized: EstimateItem[] = [];

  terminalItems.forEach(item => {
    let key: string | undefined;

    switch (mode) {
      case WBSMode.CONTRACT:
        key = item.contractType;
        break;
      case WBSMode.RISK:
        key = item.riskLevel;
        break;
      case WBSMode.CATEGORY:
        key = item.category;
        break;
    }

    if (key) {
      if (!groups[key]) groups[key] = [];
      groups[key].push(item);
    } else {
      uncategorized.push(item);
    }
  });

  // 4. Reconstruct Tree
  const newStructure: EstimateItem[] = [];
  let groupIndex = 1;

  // Create nodes for each group
  Object.entries(groups).forEach(([key, groupItems]) => {
    newStructure.push(createGroup(key, key, groupItems, `${groupIndex}`));
    groupIndex++;
  });

  // Handle Uncategorized
  if (uncategorized.length > 0) {
    newStructure.push(createGroup('Unassigned', 'Unassigned / General', uncategorized, `${groupIndex}`));
  }

  return newStructure;
};
