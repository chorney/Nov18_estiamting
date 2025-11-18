
import React, { useState, useMemo, useEffect } from 'react';
import { Project, EstimateItem, CostCategory, EstimateResource, DatabaseItem, WBSMode, ContractType, RiskLevel } from '../types';
import { CostTable } from './CostTable';
import { CostBreakdownChart, TopCostItemsChart } from './Charts';
import { DetailSheet } from './DetailSheet';
import { WBSTreeNav } from './WBSTreeNav';
import { generateEstimateItems, analyzeRisk } from '../services/geminiService';
import { transformWBS } from '../services/wbsTransformer';
import { Plus, Wand2, Download, Save, RefreshCw, BrainCircuit, FileDown, Layers, AlertTriangle } from 'lucide-react';

interface WorkspaceProps {
  project: Project;
  laborRates: DatabaseItem[];
  equipmentRates: DatabaseItem[];
}

export const EstimateWorkspace: React.FC<WorkspaceProps> = ({ 
  project: initialProject,
  laborRates,
  equipmentRates
}) => {
  const [project, setProject] = useState<Project>(initialProject);
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [showAiModal, setShowAiModal] = useState(false);
  const [riskAnalysis, setRiskAnalysis] = useState<string | null>(null);
  
  // View Mode State
  const [wbsMode, setWbsMode] = useState<WBSMode>(WBSMode.STANDARD);

  // Selection for Detail View
  const [selectedItemForDetail, setSelectedItemForDetail] = useState<EstimateItem | null>(null);

  // --- Core Logic: Recursive Calculation & WBS Numbering ---

  const recalculateProject = (items: EstimateItem[], parentWbs: string = ''): { items: EstimateItem[], total: number } => {
    let branchTotal = 0;

    const updatedItems = items.map((item, index) => {
      // 1. WBS Code
      const currentWbs = parentWbs ? `${parentWbs}.${index + 1}` : `${index + 1}`;
      
      // 2. Logic Selection
      let newSubItems: EstimateItem[] | undefined = item.subItems;
      let itemTotal = 0;

      // Does it have children? (Group)
      if (newSubItems && newSubItems.length > 0) {
        const result = recalculateProject(newSubItems, currentWbs);
        newSubItems = result.items;
        itemTotal = result.total;
      } else {
        // Terminal Node
        // Does it have detailed resources?
        if (item.resources && item.resources.length > 0) {
            itemTotal = item.resources.reduce((sum, r) => sum + r.total, 0);
        } else {
            // Simple plug value
            itemTotal = (item.quantity || 0) * (item.unitPrice || 0);
        }
      }

      branchTotal += itemTotal;

      return {
        ...item,
        wbsCode: currentWbs,
        subItems: newSubItems,
        total: itemTotal
      };
    });

    return { items: updatedItems, total: branchTotal };
  };
  
  const updateProjectItems = (newItems: EstimateItem[]) => {
    const { items } = recalculateProject(newItems);
    setProject(prev => ({ ...prev, items }));
    
    // If in detail view, ensure selected item state is refreshed with new totals/calc
    if (selectedItemForDetail) {
        const findItem = (list: EstimateItem[]): EstimateItem | null => {
            for (const i of list) {
                if (i.id === selectedItemForDetail.id) return i;
                if (i.subItems) {
                    const found = findItem(i.subItems);
                    if (found) return found;
                }
            }
            return null;
        };
        const refreshed = findItem(items);
        if (refreshed) setSelectedItemForDetail(refreshed);
    }
  };

  // --- Item Manipulation ---

  const findAndApply = (
    items: EstimateItem[], 
    targetId: string, 
    action: (item: EstimateItem) => EstimateItem
  ): EstimateItem[] => {
    return items.map(item => {
      if (item.id === targetId) {
        return action(item);
      }
      if (item.subItems) {
        return { ...item, subItems: findAndApply(item.subItems, targetId, action) };
      }
      return item;
    });
  };

  const handleUpdateItem = (id: string, field: keyof EstimateItem, value: any) => {
    const updatedItems = findAndApply(project.items, id, (item) => ({
      ...item,
      [field]: value
    }));
    updateProjectItems(updatedItems);
  };
  
  const handleSaveDetail = (
      itemId: string, 
      resources: EstimateResource[], 
      duration: number, 
      hoursPerDay: number, 
      quantity: number,
      contractType?: ContractType,
      riskLevel?: RiskLevel
    ) => {
      const updatedItems = findAndApply(project.items, itemId, (item) => ({
          ...item,
          resources: resources,
          duration: duration,
          hoursPerDay: hoursPerDay,
          quantity: quantity,
          contractType: contractType,
          riskLevel: riskLevel
      }));
      updateProjectItems(updatedItems);
  };

  const handleToggleExpand = (id: string) => {
    // Note: We only persist expand/collapse in Standard view for now
    // In other views, it's a generated tree, so we might need local state in CostTable or handle uniquely
    if (wbsMode === WBSMode.STANDARD) {
        const toggleRecursive = (list: EstimateItem[]): EstimateItem[] => {
        return list.map(item => {
            if (item.id === id) return { ...item, expanded: !item.expanded };
            if (item.subItems) return { ...item, subItems: toggleRecursive(item.subItems) };
            return item;
        });
        };
        setProject(prev => ({ ...prev, items: toggleRecursive(prev.items) }));
    }
  };

  const handleDeleteItem = (id: string) => {
    if (wbsMode !== WBSMode.STANDARD) {
      alert("Items can only be deleted in Standard WBS view.");
      return;
    }
    const deleteRecursive = (list: EstimateItem[]): EstimateItem[] => {
      return list.filter(item => item.id !== id).map(item => ({
        ...item,
        subItems: item.subItems ? deleteRecursive(item.subItems) : undefined
      }));
    };
    updateProjectItems(deleteRecursive(project.items));
    if (selectedItemForDetail?.id === id) setSelectedItemForDetail(null);
  };

  const handleAddRootItem = () => {
     if (wbsMode !== WBSMode.STANDARD) {
      alert("New phases can only be added in Standard WBS view.");
      return;
    }
    const newItem: EstimateItem = {
      id: Math.random().toString(36).substr(2, 9),
      description: 'New Scope Item',
      quantity: 1,
      unit: 'ls',
      unitPrice: 0,
      category: CostCategory.MATERIAL,
      total: 0,
      expanded: true,
      subItems: [] // Start as group capable
    };
    updateProjectItems([...project.items, newItem]);
  };

  const handleAddChild = (parentId: string) => {
    if (wbsMode !== WBSMode.STANDARD) {
      alert("New children can only be added in Standard WBS view.");
      return;
    }
    const newItem: EstimateItem = {
      id: Math.random().toString(36).substr(2, 9),
      description: 'New Sub-Item',
      quantity: 1,
      unit: 'ea',
      unitPrice: 0,
      category: CostCategory.MATERIAL,
      total: 0,
      expanded: true,
      subItems: undefined // Start as leaf
    };

    const addRecursive = (list: EstimateItem[]): EstimateItem[] => {
      return list.map(item => {
        if (item.id === parentId) {
          // Ensure parent becomes a group if it wasn't
          return {
            ...item,
            expanded: true,
            subItems: [...(item.subItems || []), newItem]
          };
        }
        if (item.subItems) {
          return { ...item, subItems: addRecursive(item.subItems) };
        }
        return item;
      });
    };

    updateProjectItems(addRecursive(project.items));
  };

  // --- AI & Analysis ---

  const handleAiGenerate = async () => {
    if (!aiPrompt.trim()) return;
    setIsGenerating(true);
    try {
      const newItems = await generateEstimateItems(aiPrompt);
      updateProjectItems([...project.items, ...newItems]);
      setShowAiModal(false);
      setAiPrompt('');
    } catch (error) {
      alert('Failed to generate estimate. Check API Key.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRiskAnalysis = async () => {
    setRiskAnalysis("Analyzing...");
    const analysis = await analyzeRisk(project.items);
    setRiskAnalysis(analysis);
  };

  // --- Data View Transformation ---
  // This logic handles the "Theory of WBS Rearrangement"
  const displayedItems = useMemo(() => {
    return transformWBS(project.items, wbsMode);
  }, [project.items, wbsMode]);


  const flatItemsForCharts = useMemo(() => {
    const flatten = (list: EstimateItem[]): EstimateItem[] => {
      return list.flatMap(i => {
        if (i.subItems && i.subItems.length > 0) {
          return flatten(i.subItems);
        }
        return [i];
      });
    }
    return flatten(project.items);
  }, [project.items]);

  const totalProjectCost = useMemo(() => 
    project.items.reduce((acc, item) => acc + item.total, 0)
  , [project.items]);

  // --- Render Helpers ---

  const renderMainContent = () => {
    if (selectedItemForDetail) {
        // Detailed Master-Detail View
        // Note: We pass displayedItems to tree so navigation matches current view mode
        return (
            <div className="flex flex-1 h-full overflow-hidden">
                {/* Left Panel: Navigation Tree */}
                <div className="w-72 shrink-0 h-full hidden lg:block">
                    <WBSTreeNav 
                        items={displayedItems}
                        selectedId={selectedItemForDetail.id}
                        onSelect={setSelectedItemForDetail}
                        onToggleExpand={handleToggleExpand}
                    />
                </div>
                {/* Right Panel: Detail Sheet */}
                <div className="flex-1 h-full bg-white border-l border-slate-200 relative">
                   {/* Hint for user if they are in a filtered view */}
                   {wbsMode !== WBSMode.STANDARD && (
                     <div className="absolute top-0 left-1/2 -translate-x-1/2 bg-orange-100 text-orange-800 text-xs px-3 py-1 rounded-b z-20 font-medium shadow-sm">
                        Editing in {wbsMode} View
                     </div>
                   )}
                    <DetailSheet 
                        item={selectedItemForDetail} 
                        laborRates={laborRates}
                        equipmentRates={equipmentRates}
                        onClose={() => setSelectedItemForDetail(null)}
                        onSave={handleSaveDetail}
                    />
                </div>
            </div>
        );
    }

    // Standard Table View
    return (
        <div className="flex flex-1 overflow-hidden">
            {/* Main Table Area */}
            <div className="flex-1 flex flex-col p-4 min-w-0 overflow-hidden">
              
              {/* View Mode Warning */}
              {wbsMode !== WBSMode.STANDARD && (
                <div className="mb-4 p-3 bg-blue-50 border border-blue-100 rounded text-sm text-blue-700 flex items-center gap-2">
                   <Layers size={16} />
                   <span>
                     <strong>{wbsMode} View Active:</strong> Structure is generated dynamically based on item tags. 
                     Only terminal items can be edited. Switch to Standard Construction to add/delete structure.
                   </span>
                </div>
              )}

            <CostTable 
                items={displayedItems} 
                onUpdateItem={handleUpdateItem}
                onDeleteItem={handleDeleteItem}
                onAddChild={handleAddChild}
                onToggleExpand={handleToggleExpand}
                onOpenDetail={setSelectedItemForDetail}
            />
            <div className="mt-4 bg-white p-4 border rounded-lg shadow-sm flex justify-between items-center">
                <div className="text-xs text-slate-400">
                Right-click on items for more actions. Click "Detail" to open productivity sheet.
                </div>
                <div className="flex items-center gap-4">
                    <span className="text-slate-500 font-medium uppercase tracking-wider text-xs">Total Project Value</span>
                    <span className="text-2xl font-bold text-slate-900">
                    {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(totalProjectCost)}
                    </span>
                </div>
            </div>
            </div>

            {/* Right Panel: Analytics & Details (Only in Table View) */}
            <div className="w-80 bg-white border-l p-4 overflow-y-auto flex flex-col gap-6 shadow-xl z-10 hidden xl:flex">
            <div>
                <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide mb-4 border-b pb-2">
                Cost Breakdown
                </h3>
                <CostBreakdownChart items={flatItemsForCharts} />
                <TopCostItemsChart items={flatItemsForCharts} />
            </div>

            <div className="bg-slate-50 rounded-lg p-4 border border-slate-100">
                <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide flex items-center gap-2">
                    <BrainCircuit size={16} className="text-purple-600"/>
                    AI Estimator Agent
                </h3>
                <button onClick={handleRiskAnalysis} className="text-xs text-blue-600 hover:underline font-medium">Run Analysis</button>
                </div>
                
                {riskAnalysis ? (
                <div className="text-xs text-slate-600 leading-relaxed space-y-2">
                    {riskAnalysis === "Analyzing..." ? (
                    <div className="flex items-center gap-2 text-slate-400">
                        <RefreshCw className="animate-spin" size={14}/> Analyzing WBS...
                    </div>
                    ) : (
                    <div className="prose prose-sm max-w-none">
                        <p className="whitespace-pre-line">{riskAnalysis}</p>
                    </div>
                    )}
                </div>
                ) : (
                <p className="text-xs text-slate-400 italic">
                    "I can analyze your WBS structure for missing scope, pricing anomalies, and overall risk. Click Run to start."
                </p>
                )}
            </div>
            </div>
        </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-slate-50 relative">
      {/* Header Actions */}
      <div className="flex items-center justify-between p-4 bg-white border-b shadow-sm shrink-0 z-20">
        <div>
          <h2 className="text-xl font-bold text-slate-800">{project.name}</h2>
          <div className="flex items-center gap-4 text-sm text-slate-500 mt-1">
            <span>{project.location}</span>
            <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-xs font-bold uppercase">
              {project.status}
            </span>
          </div>
        </div>
        
        {/* Hide main actions in detail mode to focus on editing */}
        {!selectedItemForDetail && (
            <div className="flex items-center gap-4">
               {/* WBS VIEW SWITCHER */}
               <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-lg border border-slate-200">
                  <span className="text-xs font-bold text-slate-400 uppercase px-2">View Mode:</span>
                  <select 
                    value={wbsMode}
                    onChange={(e) => setWbsMode(e.target.value as WBSMode)}
                    className="bg-white text-sm font-medium text-slate-700 border-none rounded py-1 pl-2 pr-6 focus:ring-0 cursor-pointer hover:text-brand-600"
                  >
                    {Object.values(WBSMode).map(mode => (
                      <option key={mode} value={mode}>{mode}</option>
                    ))}
                  </select>
               </div>

                <div className="h-6 w-px bg-slate-200"></div>

                <button 
                    onClick={() => setShowAiModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded hover:bg-brand-700 transition shadow-sm"
                >
                    <Wand2 size={16} />
                    <span className="font-medium">AI Generate</span>
                </button>
                <button 
                    onClick={handleAddRootItem}
                    disabled={wbsMode !== WBSMode.STANDARD}
                    className={`flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 rounded transition shadow-sm ${
                      wbsMode !== WBSMode.STANDARD ? 'opacity-50 cursor-not-allowed' : 'text-slate-700 hover:bg-slate-50'
                    }`}
                >
                    <Plus size={16} />
                    <span>Add Phase</span>
                </button>
            </div>
        )}
      </div>

      {/* Main Body */}
      {renderMainContent()}

      {/* AI Modal Overlay */}
      {showAiModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6 m-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Wand2 className="text-brand-500" />
                Generate Scope
              </h3>
              <button onClick={() => setShowAiModal(false)} className="text-slate-400 hover:text-slate-600">
                <Plus size={24} className="rotate-45"/>
              </button>
            </div>
            <p className="text-slate-600 text-sm mb-4">
              Describe what you need to build. I will create a structured WBS with nested items.
            </p>
            
            <textarea 
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              placeholder="E.g., A 3-story parking garage structure including excavation, concrete foundation, pre-cast pillars, and lighting."
              className="w-full h-32 p-3 border rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none text-sm resize-none mb-4"
            />

            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setShowAiModal(false)}
                className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-100 rounded transition"
              >
                Cancel
              </button>
              <button 
                onClick={handleAiGenerate}
                disabled={isGenerating || !aiPrompt.trim()}
                className="px-4 py-2 bg-brand-600 text-white font-medium rounded hover:bg-brand-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isGenerating && <RefreshCw className="animate-spin" size={16} />}
                {isGenerating ? 'Thinking...' : 'Generate WBS'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
