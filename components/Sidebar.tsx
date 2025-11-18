
import React from 'react';
import { LayoutDashboard, FileText, Database, Settings, LogOut, Calculator, PieChart } from 'lucide-react';
import { View } from '../types';

interface SidebarProps {
  currentView: View;
  onNavigate: (view: View) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, onNavigate }) => {
  return (
    <aside className="w-16 lg:w-64 bg-slate-850 text-slate-300 flex flex-col h-screen border-r border-slate-700 transition-all duration-300 z-20">
      <div className="h-16 flex items-center justify-center lg:justify-start lg:px-6 border-b border-slate-700 bg-slate-900">
        <Calculator className="text-brand-500 mr-0 lg:mr-3" />
        <span className="font-bold text-white text-lg hidden lg:block">EstiMate Pro</span>
      </div>

      <nav className="flex-1 py-6 space-y-1">
        <SidebarItem 
          icon={<LayoutDashboard size={20} />} 
          label="Dashboard" 
          active={currentView === 'DASHBOARD'} 
          onClick={() => onNavigate('DASHBOARD')}
        />
        <SidebarItem 
          icon={<FileText size={20} />} 
          label="Current Estimate" 
          active={currentView === 'PROJECT_ESTIMATE'} 
          onClick={() => onNavigate('PROJECT_ESTIMATE')}
        />
        <SidebarItem 
          icon={<Database size={20} />} 
          label="Cost Database" 
          active={currentView === 'COST_DATABASE'}
          onClick={() => onNavigate('COST_DATABASE')}
        />
        <SidebarItem icon={<PieChart size={20} />} label="Reports" />
        <SidebarItem icon={<Settings size={20} />} label="Settings" />
      </nav>

      <div className="p-4 border-t border-slate-700 bg-slate-900/50">
        <div className="mb-4 px-2 hidden lg:block">
             <div className="text-xs font-semibold text-slate-500 uppercase mb-1">User</div>
             <div className="text-sm text-white">Senior Estimator</div>
             <div className="text-xs text-slate-400">Enterprise Plan</div>
        </div>
        <button className="flex items-center justify-center lg:justify-start w-full p-2 hover:bg-slate-700 rounded text-slate-400 hover:text-white transition-colors">
          <LogOut size={18} />
          <span className="ml-3 hidden lg:block text-sm font-medium">Sign Out</span>
        </button>
      </div>
    </aside>
  );
};

const SidebarItem: React.FC<{ 
  icon: React.ReactNode; 
  label: string; 
  active?: boolean;
  onClick?: () => void;
}> = ({ icon, label, active, onClick }) => {
  return (
    <button 
      onClick={onClick}
      className={`w-full flex items-center justify-center lg:justify-start px-0 lg:px-6 py-3 border-l-4 transition-all ${
      active 
        ? 'bg-brand-900/30 text-white border-brand-500' 
        : 'border-transparent hover:bg-slate-800 hover:text-white'
    }`}>
      {icon}
      <span className="ml-3 hidden lg:block font-medium text-sm">{label}</span>
    </button>
  );
};
