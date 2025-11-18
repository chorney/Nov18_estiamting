
import React, { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { EstimateWorkspace } from './components/EstimateWorkspace';
import { Dashboard } from './components/Dashboard';
import { CostDatabaseView } from './components/CostDatabaseView';
import { Project, View, EstimateItem, CostCategory, DatabaseItem } from './types';
import { LABOR_DATABASE, EQUIPMENT_DATABASE } from './services/costDatabase';

// Initial Data Seeding with Hierarchy
const initialProject: Project = {
  id: '1',
  name: 'Downtown Office Complex - Phase 1',
  client: 'Urban Develop Corp',
  location: 'Seattle, WA',
  status: 'Active',
  lastModified: new Date(),
  currency: 'USD',
  items: [
    {
      id: '100',
      description: 'General Conditions',
      quantity: 1,
      unit: 'ls',
      unitPrice: 0,
      category: CostCategory.INDIRECT,
      total: 15000,
      wbsCode: '1',
      expanded: true,
      subItems: [
         {
          id: '101',
          description: 'Mobilization',
          quantity: 1,
          unit: 'ls',
          unitPrice: 5000,
          category: CostCategory.INDIRECT,
          total: 5000,
          wbsCode: '1.1'
        },
        {
          id: '102',
          description: 'Temporary Utilities',
          quantity: 4,
          unit: 'mo',
          unitPrice: 2500,
          category: CostCategory.INDIRECT,
          total: 10000,
          wbsCode: '1.2'
        }
      ]
    },
    {
      id: '200',
      description: 'Site Work',
      quantity: 1,
      unit: 'ls',
      unitPrice: 0,
      category: CostCategory.LABOR,
      total: 12500,
      wbsCode: '2',
      expanded: true,
      subItems: [
        {
          id: '201',
          description: 'Excavation',
          quantity: 500,
          unit: 'cy',
          unitPrice: 25,
          category: CostCategory.EQUIPMENT,
          total: 12500,
          wbsCode: '2.1'
        }
      ]
    }
  ]
};

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>('DASHBOARD');
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);

  // Database State
  const [laborRates, setLaborRates] = useState<DatabaseItem[]>(LABOR_DATABASE);
  const [equipmentRates, setEquipmentRates] = useState<DatabaseItem[]>(EQUIPMENT_DATABASE);

  const handleNavigate = (view: View) => {
    setCurrentView(view);
  };

  const handleOpenProject = (id: string) => {
    setActiveProjectId(id);
    setCurrentView('PROJECT_ESTIMATE');
  };

  // Database Handlers
  const handleAddRate = (item: DatabaseItem) => {
    if (item.category === CostCategory.LABOR) {
        setLaborRates([...laborRates, item]);
    } else {
        setEquipmentRates([...equipmentRates, item]);
    }
  };

  const handleDeleteRate = (id: string, category: CostCategory) => {
      if (category === CostCategory.LABOR) {
          setLaborRates(laborRates.filter(i => i.id !== id));
      } else {
          setEquipmentRates(equipmentRates.filter(i => i.id !== id));
      }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 font-sans">
      <Sidebar currentView={currentView} onNavigate={handleNavigate} />
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        {currentView === 'DASHBOARD' && (
          <Dashboard projects={[initialProject]} onOpenProject={handleOpenProject} />
        )}
        {currentView === 'PROJECT_ESTIMATE' && (
          <EstimateWorkspace 
            project={initialProject} 
            laborRates={laborRates}
            equipmentRates={equipmentRates}
          />
        )}
        {currentView === 'COST_DATABASE' && (
          <CostDatabaseView 
             laborRates={laborRates}
             equipmentRates={equipmentRates}
             onAdd={handleAddRate}
             onDelete={handleDeleteRate}
          />
        )}
      </main>
    </div>
  );
};

export default App;