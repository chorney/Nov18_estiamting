
import React, { useState, useEffect, useMemo } from 'react';
import { EstimateItem, EstimateResource, CostCategory, DatabaseItem, ContractType, RiskLevel } from '../types';
import { X, Plus, Trash2, Calculator, Save, Clock, Hammer, Truck, Package, Users, Calendar, ArrowRight, ArrowLeft, Database, ShieldAlert, FileSignature } from 'lucide-react';

interface DetailSheetProps {
  item: EstimateItem;
  laborRates: DatabaseItem[];
  equipmentRates: DatabaseItem[];
  onClose: () => void;
  onSave: (itemId: string, resources: EstimateResource[], duration: number, hoursPerDay: number, quantity: number, contractType?: ContractType, riskLevel?: RiskLevel) => void;
}

export const DetailSheet: React.FC<DetailSheetProps> = ({ 
  item, 
  laborRates,
  equipmentRates,
  onClose, 
  onSave 
}) => {
  // Local state for resources to allow editing before save
  const [resources, setResources] = useState<EstimateResource[]>(
    item.resources ? JSON.parse(JSON.stringify(item.resources)) : []
  );
  const [activeTab, setActiveTab] = useState<CostCategory>(CostCategory.LABOR);
  
  // Scope & Schedule State
  const [quantity, setQuantity] = useState<number>(item.quantity || 1);
  const [duration, setDuration] = useState<number>(item.duration || 1); // Days
  const [hoursPerDay, setHoursPerDay] = useState<number>(item.hoursPerDay || 8);
  
  // Advanced Tagging State
  const [contractType, setContractType] = useState<ContractType>(item.contractType || ContractType.LUMP_SUM);
  const [riskLevel, setRiskLevel] = useState<RiskLevel>(item.riskLevel || RiskLevel.LOW);

  const [isDirty, setIsDirty] = useState(false);
  
  // Update local state when item changes (for navigation in split view)
  useEffect(() => {
      setResources(item.resources ? JSON.parse(JSON.stringify(item.resources)) : []);
      setQuantity(item.quantity || 1);
      setDuration(item.duration || 1);
      setHoursPerDay(item.hoursPerDay || 8);
      setContractType(item.contractType || ContractType.LUMP_SUM);
      setRiskLevel(item.riskLevel || RiskLevel.LOW);
      setIsDirty(false);
  }, [item.id]);

  // Mark as dirty on changes
  useEffect(() => {
    setIsDirty(true);
  }, [quantity, duration, hoursPerDay, contractType, riskLevel]);

  // Derived: Total Crew Hours = Days * Hours/Day
  const calculatedCrewHours = useMemo(() => {
    return parseFloat((duration * hoursPerDay).toFixed(2));
  }, [duration, hoursPerDay]);

  // Derived: Daily Output = Quantity / Duration
  const dailyOutput = useMemo(() => {
     if (duration === 0) return 0;
     return parseFloat((quantity / duration).toFixed(2));
  }, [quantity, duration]);

  // Helper
  const generateId = () => Math.random().toString(36).substr(2, 9);

  // EFFECT: Auto-update Labor and Equipment quantities when Schedule changes
  useEffect(() => {
      if (calculatedCrewHours > 0) {
          setResources(prev => {
            const updated = prev.map(r => {
              // If resource is Labor or Equipment, its quantity is driven by the Crew Duration
              if (r.category === CostCategory.LABOR || r.category === CostCategory.EQUIPMENT) {
                  // Only update if changed
                  if (r.quantity !== calculatedCrewHours) {
                      const newTotal = calculatedCrewHours * r.unitPrice;
                      return {
                          ...r,
                          quantity: calculatedCrewHours,
                          unit: 'hr',
                          total: newTotal
                      };
                  }
              }
              return r;
            });
            
            // Check if anything actually changed to avoid infinite loops or unnecessary renders
            const hasChanged = JSON.stringify(updated) !== JSON.stringify(prev);
            return hasChanged ? updated : prev;
          });
      }
  }, [calculatedCrewHours]);

  // Calculate total cost from current resources state for the header
  const calculatedTotal = resources.reduce((acc, r) => acc + r.total, 0);

  const handleAddResource = () => {
    // Default quantity is the Crew Hours for labor/equip, else 1
    let defaultQty = 1;
    let defaultUnit = 'ea';
    let defaultPrice = 0;
    let defaultDesc = '';

    if (activeTab === CostCategory.LABOR) {
        defaultQty = calculatedCrewHours;
        defaultUnit = 'hr';
        // Pre-select first item from DB if available
        if(laborRates.length > 0) {
            defaultDesc = laborRates[0].name;
            defaultPrice = laborRates[0].rate;
        }
    } else if (activeTab === CostCategory.EQUIPMENT) {
        defaultQty = calculatedCrewHours;
        defaultUnit = 'hr';
         if(equipmentRates.length > 0) {
            defaultDesc = equipmentRates[0].name;
            defaultPrice = equipmentRates[0].rate;
        }
    }

    const newResource: EstimateResource = {
      id: generateId(),
      category: activeTab,
      description: defaultDesc,
      quantity: defaultQty,
      unit: defaultUnit,
      unitPrice: defaultPrice,
      total: defaultQty * defaultPrice
    };

    setResources([...resources, newResource]);
    setIsDirty(true);
  };

  const handleUpdateResource = (id: string, field: keyof EstimateResource, value: any) => {
    setResources(prev => prev.map(r => {
      if (r.id !== id) return r;
      
      const updated = { ...r, [field]: value };
      updated.total = updated.quantity * updated.unitPrice;
      return updated;
    }));
    setIsDirty(true);
  };

  const handleSelectFromDeck = (resourceId: string, deckItemId: string) => {
      const deck = activeTab === CostCategory.LABOR ? laborRates : equipmentRates;
      const item = deck.find(d => d.id === deckItemId);
      
      if (item) {
          setResources(prev => prev.map(r => {
              if (r.id !== resourceId) return r;
              return {
                  ...r,
                  description: item.name,
                  unitPrice: item.rate,
                  unit: item.unit,
                  total: r.quantity * item.rate // Recalc total immediately
              };
          }));
          setIsDirty(true);
      }
  };

  const handleDeleteResource = (id: string) => {
    setResources(prev => prev.filter(r => r.id !== id));
    setIsDirty(true);
  };

  const handleSave = () => {
    onSave(item.id, resources, duration, hoursPerDay, quantity, contractType, riskLevel);
    setIsDirty(false);
  };

  const filteredResources = resources.filter(r => r.category === activeTab);

  // Tab Icons
  const getTabIcon = (cat: CostCategory) => {
    switch (cat) {
      case CostCategory.LABOR: return <Users size={16} />;
      case CostCategory.EQUIPMENT: return <Truck size={16} />;
      case CostCategory.MATERIAL: return <Package size={16} />;
      case CostCategory.SUBCONTRACTOR: return <Hammer size={16} />;
      default: return <Calculator size={16} />;
    }
  };

  return (
    <div className="flex flex-col h-full w-full bg-white">
      {/* Header */}
      <div className="h-16 flex items-center justify-between px-6 border-b bg-slate-50 shrink-0">
        <div className="flex items-center gap-4">
            <button 
                onClick={onClose}
                className="p-2 hover:bg-slate-200 rounded text-slate-500 flex items-center gap-2 transition"
                title="Back to Estimate Table"
            >
                <ArrowLeft size={20} />
                <span className="font-medium text-sm hidden md:block">Back</span>
            </button>
            <div className="h-8 w-px bg-slate-300"></div>
            <div>
            <div className="flex items-center gap-2 text-sm text-slate-500 font-mono mb-1">
                <span className="bg-slate-200 px-2 py-0.5 rounded">{item.wbsCode}</span>
                <span className="uppercase text-xs font-bold tracking-wider text-brand-600">Terminal Item</span>
            </div>
            <h2 className="text-lg font-bold text-slate-800 truncate max-w-md">{item.description}</h2>
            </div>
        </div>
        <div className="flex items-center gap-3">
            <div className="text-right mr-4 hidden sm:block">
                <div className="text-xs text-slate-500 uppercase">Total Cost</div>
                <div className="text-xl font-bold text-brand-600">
                    {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(calculatedTotal)}
                </div>
            </div>
            <button 
                onClick={handleSave} 
                disabled={!isDirty}
                className={`p-2 rounded transition flex items-center gap-2 px-4 shadow-sm ${
                    isDirty 
                    ? 'bg-brand-600 text-white hover:bg-brand-700' 
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
            >
                <Save size={18} /> 
                <span className="hidden sm:inline">{isDirty ? 'Save Changes' : 'Saved'}</span>
            </button>
        </div>
      </div>

      {/* Metadata & Strategy Panel */}
      <div className="bg-white border-b border-slate-200 grid grid-cols-2 lg:grid-cols-4 divide-x divide-slate-100">
        <div className="p-4 flex flex-col">
            <label className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase mb-2">
                <FileSignature size={14} /> Contract Type
            </label>
            <select 
                value={contractType}
                onChange={(e) => setContractType(e.target.value as ContractType)}
                className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1.5 text-sm font-medium focus:ring-2 focus:ring-brand-500 outline-none"
            >
                {Object.values(ContractType).map(t => <option key={t} value={t}>{t}</option>)}
            </select>
        </div>
        <div className="p-4 flex flex-col">
             <label className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase mb-2">
                <ShieldAlert size={14} /> Risk Profile
            </label>
            <select 
                value={riskLevel}
                onChange={(e) => setRiskLevel(e.target.value as RiskLevel)}
                className={`w-full border rounded px-2 py-1.5 text-sm font-medium outline-none ${
                    riskLevel === RiskLevel.HIGH || riskLevel === RiskLevel.CRITICAL ? 'bg-red-50 border-red-200 text-red-700' : 
                    riskLevel === RiskLevel.MEDIUM ? 'bg-orange-50 border-orange-200 text-orange-700' : 'bg-slate-50 border-slate-200'
                }`}
            >
                {Object.values(RiskLevel).map(t => <option key={t} value={t}>{t}</option>)}
            </select>
        </div>
      </div>

      {/* Productivity & Duration Control Panel */}
      <div className="bg-slate-50 border-b border-slate-200 shadow-inner">
        <div className="px-6 py-4">
            <div className="flex items-center gap-2 mb-4">
                <Calendar className="text-brand-500" size={20}/>
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">Crew Duration & Productivity</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {/* 1. Quantity Input */}
                <div className="bg-white p-3 rounded border border-slate-200 shadow-sm">
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Total Quantity</label>
                    <div className="flex items-center gap-2">
                        <input 
                            type="number" 
                            value={quantity}
                            onChange={(e) => setQuantity(parseFloat(e.target.value))}
                            className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-sm font-bold text-slate-800 focus:ring-2 focus:ring-brand-500 outline-none"
                        />
                        <span className="text-xs font-medium text-slate-400 w-12 truncate">{item.unit}</span>
                    </div>
                </div>

                {/* 2. Duration Input */}
                 <div className="bg-white p-3 rounded border border-slate-200 shadow-sm relative group">
                    <div className="absolute -left-3 top-1/2 -mt-3 text-slate-300 hidden md:block"><ArrowRight size={16} /></div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Duration (Days)</label>
                    <div className="flex items-center gap-2">
                        <input 
                            type="number" 
                            value={duration}
                            onChange={(e) => setDuration(parseFloat(e.target.value))}
                            className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-sm font-bold text-slate-800 focus:ring-2 focus:ring-brand-500 outline-none"
                        />
                        <div className="flex flex-col">
                            <span className="text-[10px] font-medium text-slate-400 uppercase leading-none">Days</span>
                        </div>
                    </div>
                    <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
                        <Clock size={12} />
                        <input 
                           type="number" 
                           value={hoursPerDay} 
                           onChange={(e) => setHoursPerDay(parseFloat(e.target.value))}
                           className="w-10 bg-white border rounded px-1 py-0.5 text-center text-xs"
                        />
                        <span>Hrs/Day</span>
                    </div>
                </div>

                 {/* 3. Productivity Output */}
                 <div className="bg-blue-50 p-3 rounded border border-blue-100">
                     <div className="absolute -left-3 top-1/2 -mt-3 text-slate-300 hidden md:block"><ArrowRight size={16} /></div>
                    <label className="block text-xs font-semibold text-blue-600 mb-1">Daily Output</label>
                    <div className="text-lg font-bold text-blue-800">
                        {dailyOutput} <span className="text-sm font-normal text-blue-600">{item.unit}/Day</span>
                    </div>
                    <div className="text-[10px] text-blue-400 mt-1">
                        Derived from Qty / Duration
                    </div>
                </div>

                 {/* 4. Resource Driver Output */}
                 <div className="bg-green-50 p-3 rounded border border-green-100">
                    <label className="block text-xs font-semibold text-green-600 mb-1">Total Crew Hours</label>
                    <div className="text-lg font-bold text-green-800">
                        {calculatedCrewHours} <span className="text-sm font-normal text-green-600">Hrs</span>
                    </div>
                     <div className="text-[10px] text-green-500 mt-1 font-medium">
                         Drives Labor & Equip Qty
                    </div>
                </div>
            </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b px-6 shrink-0 bg-white mt-2 overflow-x-auto">
        {Object.values(CostCategory).filter(c => c !== CostCategory.INDIRECT).map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveTab(cat)}
            className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === cat 
                ? 'border-brand-500 text-brand-600 bg-brand-50/30' 
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            {getTabIcon(cat)}
            {cat}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden max-w-5xl mx-auto">
            <table className="w-full text-sm text-left">
                <thead className="bg-slate-100 text-slate-600 text-xs uppercase font-semibold">
                    <tr>
                        <th className="p-3 pl-4">Resource Description</th>
                        <th className="p-3 w-24 text-right">{activeTab === CostCategory.LABOR || activeTab === CostCategory.EQUIPMENT ? 'Hrs' : 'Qty'}</th>
                        <th className="p-3 w-20 text-center">Unit</th>
                        <th className="p-3 w-28 text-right">Unit Rate</th>
                        <th className="p-3 w-32 text-right">Total</th>
                        <th className="p-3 w-12"></th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {filteredResources.map(res => (
                        <tr key={res.id} className="group hover:bg-slate-50">
                            <td className="p-2 pl-4">
                                {(activeTab === CostCategory.LABOR || activeTab === CostCategory.EQUIPMENT) ? (
                                    <div className="flex items-center gap-2">
                                        <Database size={14} className="text-slate-400" />
                                        <select 
                                            value={
                                                (activeTab === CostCategory.LABOR ? laborRates : equipmentRates).find(d => d.name === res.description)?.id || ''
                                            }
                                            onChange={(e) => handleSelectFromDeck(res.id, e.target.value)}
                                            className="w-full bg-transparent focus:bg-white border border-transparent focus:border-blue-300 rounded px-2 py-1 outline-none font-medium text-slate-700"
                                        >
                                            <option value="" disabled>Select from Deck...</option>
                                            {(activeTab === CostCategory.LABOR ? laborRates : equipmentRates).map(dbItem => (
                                                <option key={dbItem.id} value={dbItem.id}>{dbItem.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                ) : (
                                    <input 
                                        type="text" 
                                        value={res.description}
                                        placeholder={`e.g. ${activeTab} Item`}
                                        onChange={(e) => handleUpdateResource(res.id, 'description', e.target.value)}
                                        className="w-full bg-transparent focus:bg-white border border-transparent focus:border-blue-300 rounded px-2 py-1 outline-none"
                                        autoFocus={!res.description}
                                    />
                                )}
                            </td>
                            <td className="p-2">
                                <input 
                                    type="number" 
                                    value={res.quantity}
                                    onChange={(e) => handleUpdateResource(res.id, 'quantity', parseFloat(e.target.value))}
                                    // If Labor/Equip, highlight that this is driven by duration
                                    disabled={activeTab === CostCategory.LABOR || activeTab === CostCategory.EQUIPMENT}
                                    className={`w-full text-right bg-transparent border border-transparent rounded px-2 py-1 outline-none ${
                                        (activeTab === CostCategory.LABOR || activeTab === CostCategory.EQUIPMENT) 
                                        ? 'font-bold text-green-600 cursor-not-allowed bg-green-50/50' 
                                        : 'focus:bg-white focus:border-blue-300'
                                    }`}
                                />
                            </td>
                            <td className="p-2">
                                <input 
                                    type="text" 
                                    value={res.unit}
                                    onChange={(e) => handleUpdateResource(res.id, 'unit', e.target.value)}
                                    className="w-full text-center bg-transparent focus:bg-white border border-transparent focus:border-blue-300 rounded px-2 py-1 outline-none text-slate-400"
                                />
                            </td>
                            <td className="p-2">
                                <input 
                                    type="number" 
                                    value={res.unitPrice}
                                    onChange={(e) => handleUpdateResource(res.id, 'unitPrice', parseFloat(e.target.value))}
                                    className={`w-full text-right bg-transparent border border-transparent rounded px-2 py-1 outline-none ${
                                        (activeTab === CostCategory.LABOR || activeTab === CostCategory.EQUIPMENT)
                                         ? 'bg-slate-50 text-slate-600' // Visual clue that it comes from DB
                                         : 'focus:bg-white focus:border-blue-300'
                                    }`}
                                />
                            </td>
                            <td className="p-2 text-right font-mono text-slate-700">
                                {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(res.total)}
                            </td>
                            <td className="p-2 text-center">
                                <button 
                                    onClick={() => handleDeleteResource(res.id)}
                                    className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </td>
                        </tr>
                    ))}
                    {filteredResources.length === 0 && (
                        <tr>
                            <td colSpan={6} className="p-8 text-center text-slate-400 italic">
                                No resources added for this category yet.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
             <div className="p-3 bg-slate-50 border-t">
                <button 
                    onClick={handleAddResource}
                    className="flex items-center gap-2 text-sm text-brand-600 font-medium hover:text-brand-700 px-2 py-1 rounded hover:bg-brand-50 transition"
                >
                    <Plus size={16} /> Add {activeTab}
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};
