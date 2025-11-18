
import React from 'react';
import { EstimateItem, CostCategory } from '../types';
import { ChevronRight, ChevronDown, Folder, FileText, Circle, CheckCircle2 } from 'lucide-react';

interface WBSTreeNavProps {
  items: EstimateItem[];
  selectedId: string | null;
  onSelect: (item: EstimateItem) => void;
  onToggleExpand: (id: string) => void;
}

export const WBSTreeNav: React.FC<WBSTreeNavProps> = ({ 
  items, 
  selectedId, 
  onSelect,
  onToggleExpand 
}) => {

  const renderNode = (item: EstimateItem, depth: number = 0) => {
    const isGroup = !!item.subItems && item.subItems.length > 0;
    const hasResources = item.resources && item.resources.length > 0;
    const isSelected = item.id === selectedId;

    return (
      <div key={item.id} className="select-none">
        <div 
          className={`
            flex items-center gap-2 px-3 py-2 cursor-pointer transition-colors text-sm border-l-2
            ${isSelected 
                ? 'bg-blue-50 border-blue-500 text-blue-700 font-medium' 
                : 'border-transparent hover:bg-slate-50 text-slate-600'}
          `}
          style={{ paddingLeft: `${depth * 16 + 12}px` }}
          onClick={() => {
              if (isGroup) {
                  onToggleExpand(item.id);
              } else {
                  onSelect(item);
              }
          }}
        >
          {/* Expand/Collapse Icon */}
          <div 
            className="text-slate-400 hover:text-slate-600 p-0.5 rounded"
            onClick={(e) => {
              e.stopPropagation();
              if (isGroup) onToggleExpand(item.id);
            }}
          >
             {isGroup ? (
                 item.expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />
             ) : (
                 <div className="w-[14px]" />
             )}
          </div>

          {/* Type Icon */}
          {isGroup ? (
            <Folder size={14} className={`${isSelected ? 'text-blue-500' : 'text-slate-400'}`} />
          ) : (
            hasResources ? 
              <CheckCircle2 size={14} className="text-green-500" /> : 
              <Circle size={14} className="text-slate-300" />
          )}

          {/* Label */}
          <span className="truncate flex-1">
            <span className="font-mono text-xs text-slate-400 mr-2">{item.wbsCode}</span>
            {item.description}
          </span>

          {/* Total Badge (Mini) */}
          <span className="text-[10px] text-slate-400 font-mono">
            {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(item.total)}
          </span>
        </div>

        {/* Recursive Children */}
        {isGroup && item.expanded && (
          <div>
            {item.subItems!.map(child => renderNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col bg-white border-r border-slate-200">
        <div className="p-4 border-b bg-slate-50">
            <h3 className="font-bold text-slate-700 text-sm uppercase tracking-wider">WBS Navigation</h3>
            <p className="text-xs text-slate-500 mt-1">Select a terminal item to edit details.</p>
        </div>
        <div className="flex-1 overflow-y-auto py-2">
            {items.map(item => renderNode(item))}
        </div>
    </div>
  );
};
