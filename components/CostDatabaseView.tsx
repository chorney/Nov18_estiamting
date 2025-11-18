
import React, { useState } from 'react';
import { DatabaseItem, CostCategory } from '../types';
import { Search, Plus, Trash2, Users, Truck, DollarSign, Save } from 'lucide-react';

interface CostDatabaseViewProps {
  laborRates: DatabaseItem[];
  equipmentRates: DatabaseItem[];
  onAdd: (item: DatabaseItem) => void;
  onDelete: (id: string, category: CostCategory) => void;
}

export const CostDatabaseView: React.FC<CostDatabaseViewProps> = ({ 
  laborRates, 
  equipmentRates, 
  onAdd, 
  onDelete 
}) => {
  const [activeTab, setActiveTab] = useState<CostCategory>(CostCategory.LABOR);
  const [searchTerm, setSearchTerm] = useState('');
  
  // New Item State
  const [newName, setNewName] = useState('');
  const [newRate, setNewRate] = useState<number>(0);
  const [newUnit, setNewUnit] = useState('hr');

  const currentData = activeTab === CostCategory.LABOR ? laborRates : equipmentRates;

  const filteredData = currentData.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddItem = () => {
    if (!newName.trim()) return;
    const newItem: DatabaseItem = {
      id: `${activeTab === CostCategory.LABOR ? 'L' : 'E'}-${Date.now()}`,
      name: newName,
      rate: newRate,
      unit: newUnit,
      category: activeTab
    };
    onAdd(newItem);
    setNewName('');
    setNewRate(0);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b px-8 py-6 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <DollarSign className="text-brand-500" />
            Cost Database
        </h1>
        <p className="text-slate-500 mt-1">Manage standard rates for labor crews and equipment fleets.</p>
      </div>

      {/* Controls */}
      <div className="max-w-5xl mx-auto w-full p-6 flex-1 flex flex-col overflow-hidden">
        
        {/* Tabs */}
        <div className="flex gap-4 mb-6">
            <button 
                onClick={() => setActiveTab(CostCategory.LABOR)}
                className={`flex-1 py-4 px-6 rounded-xl border-2 transition-all flex items-center justify-center gap-3 font-bold ${
                    activeTab === CostCategory.LABOR 
                    ? 'border-brand-500 bg-brand-50 text-brand-700 shadow-sm' 
                    : 'border-white bg-white text-slate-400 hover:bg-slate-100'
                }`}
            >
                <Users size={20} />
                Labor Deck
            </button>
            <button 
                onClick={() => setActiveTab(CostCategory.EQUIPMENT)}
                className={`flex-1 py-4 px-6 rounded-xl border-2 transition-all flex items-center justify-center gap-3 font-bold ${
                    activeTab === CostCategory.EQUIPMENT 
                    ? 'border-brand-500 bg-brand-50 text-brand-700 shadow-sm' 
                    : 'border-white bg-white text-slate-400 hover:bg-slate-100'
                }`}
            >
                <Truck size={20} />
                Equipment Deck
            </button>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-xl border shadow-sm flex flex-col flex-1 overflow-hidden">
            
            {/* Toolbar */}
            <div className="p-4 border-b flex items-center justify-between gap-4 bg-slate-50/50">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input 
                        type="text" 
                        placeholder={`Search ${activeTab} items...`}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-white border rounded-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                    />
                </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto">
                <table className="w-full text-sm text-left">
                    <thead className="text-xs text-slate-500 uppercase bg-slate-50 sticky top-0">
                        <tr>
                            <th className="px-6 py-3">Description</th>
                            <th className="px-6 py-3 text-center">Unit</th>
                            <th className="px-6 py-3 text-right">Rate / Cost</th>
                            <th className="px-6 py-3 w-20"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {filteredData.map((item) => (
                            <tr key={item.id} className="hover:bg-slate-50 group">
                                <td className="px-6 py-4 font-medium text-slate-700">
                                    {item.name}
                                    <div className="text-xs text-slate-400 font-mono mt-0.5">{item.id}</div>
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <span className="bg-slate-100 text-slate-500 px-2 py-1 rounded text-xs font-mono">
                                        {item.unit}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right font-mono font-medium text-slate-700">
                                    {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(item.rate)}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button 
                                        onClick={() => onDelete(item.id, activeTab)}
                                        className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded transition"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Add New Bar */}
            <div className="p-4 border-t bg-slate-50 grid grid-cols-12 gap-4 items-end">
                <div className="col-span-5">
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Description</label>
                    <input 
                        type="text" 
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        placeholder="e.g. Senior Pipefitter"
                        className="w-full px-3 py-2 bg-white border rounded outline-none focus:ring-2 focus:ring-brand-500"
                    />
                </div>
                <div className="col-span-2">
                     <label className="block text-xs font-semibold text-slate-500 mb-1">Unit</label>
                    <select 
                        value={newUnit} 
                        onChange={(e) => setNewUnit(e.target.value)}
                        className="w-full px-3 py-2 bg-white border rounded outline-none focus:ring-2 focus:ring-brand-500"
                    >
                        <option value="hr">Hour (hr)</option>
                        <option value="day">Day</option>
                        <option value="wk">Week</option>
                        <option value="mo">Month</option>
                    </select>
                </div>
                <div className="col-span-3">
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Base Rate</label>
                    <input 
                        type="number" 
                        value={newRate}
                        onChange={(e) => setNewRate(parseFloat(e.target.value))}
                        className="w-full px-3 py-2 bg-white border rounded outline-none focus:ring-2 focus:ring-brand-500 text-right"
                    />
                </div>
                <div className="col-span-2">
                    <button 
                        onClick={handleAddItem}
                        className="w-full py-2 bg-brand-600 text-white font-medium rounded hover:bg-brand-700 transition flex items-center justify-center gap-2"
                    >
                        <Plus size={16} /> Add
                    </button>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};
