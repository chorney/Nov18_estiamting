import React from 'react';
import { Project } from '../types';
import { TrendingUp, Users, Briefcase, DollarSign, Clock, ArrowUpRight } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

interface DashboardProps {
  projects: Project[];
  onOpenProject: (id: string) => void;
}

// Mock data for charts
const RECENT_ACTIVITY = [
  { name: 'Mon', value: 4000 },
  { name: 'Tue', value: 3000 },
  { name: 'Wed', value: 2000 },
  { name: 'Thu', value: 2780 },
  { name: 'Fri', value: 1890 },
  { name: 'Sat', value: 2390 },
  { name: 'Sun', value: 3490 },
];

export const Dashboard: React.FC<DashboardProps> = ({ projects, onOpenProject }) => {
  return (
    <div className="flex-1 h-full overflow-y-auto bg-slate-50 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Executive Dashboard</h1>
          <p className="text-slate-500">Overview of active estimations and bid performance.</p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <KpiCard title="Total Active Bids" value="$2.4M" change="+12%" icon={<DollarSign className="text-white" />} color="bg-blue-500" />
          <KpiCard title="Win Rate" value="34%" change="+2.1%" icon={<TrendingUp className="text-white" />} color="bg-green-500" />
          <KpiCard title="Pending Reviews" value="12" change="-4" icon={<Users className="text-white" />} color="bg-orange-500" />
          <KpiCard title="Projects Due" value="3" change="This Week" icon={<Clock className="text-white" />} color="bg-purple-500" />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Recent Projects List */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-100 p-6">
            <h2 className="text-lg font-bold text-slate-800 mb-4">Recent Projects</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-slate-500 uppercase bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 rounded-l-lg">Project Name</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Client</th>
                    <th className="px-4 py-3 rounded-r-lg text-right">Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {projects.map(p => (
                    <tr key={p.id} onClick={() => onOpenProject(p.id)} className="hover:bg-slate-50 cursor-pointer transition-colors group">
                      <td className="px-4 py-4 font-medium text-slate-700 group-hover:text-blue-600">
                        {p.name}
                      </td>
                      <td className="px-4 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase ${
                          p.status === 'Active' ? 'bg-green-100 text-green-700' : 
                          p.status === 'Draft' ? 'bg-slate-100 text-slate-600' : 'bg-blue-100 text-blue-700'
                        }`}>
                          {p.status}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-slate-500">{p.client}</td>
                      <td className="px-4 py-4 text-right font-mono text-slate-700">$1.2M</td>
                    </tr>
                  ))}
                  {/* Mock extra rows */}
                  <tr className="hover:bg-slate-50 cursor-pointer">
                    <td className="px-4 py-4 font-medium text-slate-700">Riverside Community Center</td>
                    <td className="px-4 py-4"><span className="px-2 py-1 rounded-full bg-yellow-100 text-yellow-700 text-xs font-bold">Review</span></td>
                    <td className="px-4 py-4 text-slate-500">City Council</td>
                    <td className="px-4 py-4 text-right font-mono text-slate-700">$4.5M</td>
                  </tr>
                   <tr className="hover:bg-slate-50 cursor-pointer">
                    <td className="px-4 py-4 font-medium text-slate-700">West End Renovation</td>
                    <td className="px-4 py-4"><span className="px-2 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-bold">Draft</span></td>
                    <td className="px-4 py-4 text-slate-500">Private</td>
                    <td className="px-4 py-4 text-right font-mono text-slate-700">$250K</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Activity Chart */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 flex flex-col">
            <h2 className="text-lg font-bold text-slate-800 mb-4">Estimating Volume</h2>
            <div className="flex-1 min-h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={RECENT_ACTIVITY}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" hide />
                  <Tooltip 
                    contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                  />
                  <Line type="monotone" dataKey="value" stroke="#0ea5e9" strokeWidth={3} dot={{r: 4, fill: '#0ea5e9'}} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 p-4 bg-slate-50 rounded-lg">
               <div className="flex items-center justify-between">
                 <span className="text-sm text-slate-500">Weekly Total</span>
                 <span className="font-bold text-slate-700">$845,000</span>
               </div>
               <div className="w-full bg-slate-200 rounded-full h-2 mt-2">
                  <div className="bg-brand-500 h-2 rounded-full" style={{width: '70%'}}></div>
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const KpiCard: React.FC<{ title: string, value: string, change: string, icon: React.ReactNode, color: string }> = ({ title, value, change, icon, color }) => (
  <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between">
    <div>
      <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
      <h3 className="text-2xl font-bold text-slate-800">{value}</h3>
      <p className="text-xs font-medium text-green-600 mt-1 flex items-center">
        <ArrowUpRight size={12} className="mr-1"/> {change}
      </p>
    </div>
    <div className={`w-12 h-12 rounded-lg ${color} flex items-center justify-center shadow-lg shadow-blue-500/20`}>
      {icon}
    </div>
  </div>
);
