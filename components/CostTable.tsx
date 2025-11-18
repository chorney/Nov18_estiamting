
import React, { useState, useEffect, useRef } from 'react';
import { EstimateItem, CostCategory } from '../types';
import { Trash2, ChevronRight, ChevronDown, Plus, Folder, FileText, MoreVertical, Edit3, Copy } from 'lucide-react';

interface CostTableProps {
  items: EstimateItem[];
  onUpdateItem: (id: string, field: keyof EstimateItem, value: any) => void;
  onDeleteItem: (id: string) => void;
  onAddChild: (parentId: string) => void;
  onToggleExpand: (id: string) => void;
  onOpenDetail: (item: EstimateItem) => void;
}

interface ContextMenuState {
  visible: boolean;
  x: number;
  y: number;
  itemId: string;
  isGroup: boolean;
}

export const CostTable: React.FC<CostTableProps> = ({ 
  items, 
  onUpdateItem, 
  onDeleteItem, 
  onAddChild,
  onToggleExpand,
  onOpenDetail
}) => {
  
  const [contextMenu, setContextMenu] = useState<ContextMenuState>({ visible: false, x: 0, y: 0, itemId: '', isGroup: false });
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu on click outside
  useEffect(() => {
    const handleClick = () => setContextMenu({ ...contextMenu, visible: false });
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [contextMenu]);

  const handleContextMenu = (e: React.MouseEvent, item: EstimateItem) => {
    e.preventDefault();
    const isGroup = !!(item.subItems && item.subItems.length > 0) || item.category === CostCategory.INDIRECT; // Rough heuristic for group, or if it has children
    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      itemId: item.id,
      isGroup: !!item.subItems
    });
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);
  };

  const renderRow = (item: EstimateItem, depth: number = 0) => {
    const isGroup = item.subItems !== undefined; // If subItems array exists, it's a potential parent
    // If it's a group but empty, we still treat it as group structure
    const hasChildren = item.subItems && item.subItems.length > 0;
    const hasResources = item.resources && item.resources.length > 0;

    // Highlight row if context menu is active for it
    const isActive = contextMenu.visible && contextMenu.itemId === item.id;

    return (
      <React.Fragment key={item.id}>
        <tr 
          className={`
            border-b border-slate-50 transition-colors group
            ${isActive ? 'bg-blue-100' : 'hover:bg-blue-50/30'}
            ${hasChildren ? 'bg-slate-50/50 font-medium' : ''}
          `}
          onContextMenu={(e) => handleContextMenu(e, item)}
        >
          {/* WBS & Toggle */}
          <td className="p-2 whitespace-nowrap text-slate-500 font-mono text-xs relative">
            <div className="flex items-center gap-1">
              <div style={{ width: `${depth * 16}px` }} />
              
              <button 
                onClick={() => isGroup ? onToggleExpand(item.id) : null}
                className={`p-1 rounded hover:bg-slate-200 text-slate-400 ${!isGroup ? 'invisible' : ''}`}
              >
                 {isGroup && (item.expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />)}
              </button>
              <span>{item.wbsCode}</span>
            </div>
          </td>

          {/* Description */}
          <td className="p-2">
            <div className="flex items-center gap-2">
               {isGroup ? <Folder size={14} className="text-blue-400" /> : <FileText size={14} className="text-slate-300" />}
               <input 
                type="text" 
                value={item.description}
                onChange={(e) => onUpdateItem(item.id, 'description', e.target.value)}
                className={`w-full bg-transparent focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none rounded px-1 ${isGroup ? 'font-semibold text-slate-800' : 'text-slate-700'}`}
              />
               {!isGroup && (
                   <button 
                    onClick={() => onOpenDetail(item)}
                    className={`opacity-0 group-hover:opacity-100 p-1 text-xs border rounded hover:bg-white hover:shadow-sm transition-all whitespace-nowrap ${hasResources ? 'text-brand-600 border-brand-200 bg-brand-50 opacity-100' : 'text-slate-400'}`}
                   >
                       {hasResources ? 'Edit Details' : 'Detail'}
                   </button>
               )}
            </div>
          </td>

          {/* Category */}
          <td className="p-2">
             {/* Groups don't usually have a category, but let's allow it for summary sorting */}
            <select 
              value={item.category}
              onChange={(e) => onUpdateItem(item.id, 'category', e.target.value as CostCategory)}
              className="w-full bg-transparent focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none rounded px-1 text-xs text-slate-600 truncate"
            >
              {Object.values(CostCategory).map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </td>

          {/* Inputs */}
          <td className="p-2 text-right">
            <input 
                type="number" 
                value={item.quantity}
                onChange={(e) => onUpdateItem(item.id, 'quantity', parseFloat(e.target.value))}
                className={`w-full text-right bg-transparent focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none rounded px-1 ${isGroup ? 'text-slate-400' : ''}`}
              />
          </td>
          <td className="p-2 text-center">
             <input 
                type="text" 
                value={item.unit}
                onChange={(e) => onUpdateItem(item.id, 'unit', e.target.value)}
                className="w-full text-center bg-transparent focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none rounded px-1 text-slate-500"
              />
          </td>
          <td className="p-2 text-right">
             {/* Unit Price - Read Only if Group OR Details Exist */}
             {(isGroup || hasResources) ? (
                 <span className="text-slate-400 text-xs italic block py-1 pr-1">
                     {hasResources ? 'Detailed' : 'Calc'}
                 </span>
             ) : (
                <input 
                    type="number" 
                    value={item.unitPrice}
                    onChange={(e) => onUpdateItem(item.id, 'unitPrice', parseFloat(e.target.value))}
                    className="w-full text-right bg-transparent focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none rounded px-1"
                />
             )}
          </td>

          {/* Total */}
          <td className={`p-3 text-right font-mono ${isGroup ? 'font-bold text-slate-800' : 'text-slate-600'}`}>
            {formatCurrency(item.total)}
          </td>
        </tr>

        {/* Recursive Render */}
        {item.expanded && item.subItems && item.subItems.map(child => renderRow(child, depth + 1))}
      </React.Fragment>
    );
  };

  return (
    <div className="flex-1 overflow-hidden flex flex-col bg-white border rounded-lg shadow-sm relative">
      <div className="overflow-auto flex-1">
          <table className="w-full text-sm text-left border-collapse table-fixed min-w-[800px]">
            <thead className="bg-slate-100 text-slate-600 sticky top-0 z-10 font-semibold uppercase tracking-wider text-xs shadow-sm">
              <tr>
                <th className="p-3 border-b w-40">WBS</th>
                <th className="p-3 border-b">Description</th>
                <th className="p-3 border-b w-28">Category</th>
                <th className="p-3 border-b w-24 text-right">Qty</th>
                <th className="p-3 border-b w-20 text-center">Unit</th>
                <th className="p-3 border-b w-24 text-right">Unit Cost</th>
                <th className="p-3 border-b w-32 text-right bg-slate-200/50">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-20 text-center text-slate-400">
                    <p>No items yet. Start adding scope.</p>
                  </td>
                </tr>
              ) : (
                items.map(item => renderRow(item, 0))
              )}
            </tbody>
          </table>
      </div>

      {/* Context Menu */}
      {contextMenu.visible && (
        <div 
            ref={menuRef}
            className="fixed bg-white border shadow-xl rounded-lg py-1 w-48 z-50 text-sm text-slate-700"
            style={{ top: contextMenu.y, left: contextMenu.x }}
        >
            <div className="px-3 py-2 border-b bg-slate-50 text-xs font-bold text-slate-400 uppercase">
                Actions
            </div>
            <button 
                onClick={() => onAddChild(contextMenu.itemId)}
                className="w-full text-left px-4 py-2 hover:bg-blue-50 hover:text-blue-600 flex items-center gap-2"
            >
                <Plus size={14} /> Add Child Item
            </button>
            <button 
                onClick={() => {
                    // Need to find item to pass to onOpenDetail, simplified via Workspace for now
                    // This is a limitation of the current context menu passing ID only
                    // But standard left-click handles details well.
                    // We will just close menu for now.
                    setContextMenu(prev => ({...prev, visible: false}));
                }}
                className="w-full text-left px-4 py-2 hover:bg-blue-50 hover:text-blue-600 flex items-center gap-2"
            >
                <Edit3 size={14} /> Rename
            </button>
             <button 
                className="w-full text-left px-4 py-2 hover:bg-blue-50 hover:text-blue-600 flex items-center gap-2"
            >
                <Copy size={14} /> Duplicate Branch
            </button>
            <div className="border-t my-1"></div>
            <button 
                onClick={() => onDeleteItem(contextMenu.itemId)}
                className="w-full text-left px-4 py-2 hover:bg-red-50 hover:text-red-600 flex items-center gap-2"
            >
                <Trash2 size={14} /> Delete Item
            </button>
        </div>
      )}
    </div>
  );
};
