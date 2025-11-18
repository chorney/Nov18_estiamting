import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';
import { EstimateItem, CostCategory } from '../types';

interface ChartProps {
  items: EstimateItem[];
}

const COLORS = ['#0ea5e9', '#3b82f6', '#6366f1', '#8b5cf6', '#d946ef'];

export const CostBreakdownChart: React.FC<ChartProps> = ({ items }) => {
  const data = React.useMemo(() => {
    const summary: Record<string, number> = {};
    items.forEach(item => {
      if (!summary[item.category]) summary[item.category] = 0;
      summary[item.category] += item.total;
    });
    return Object.keys(summary).map(key => ({
      name: key,
      value: summary[key]
    }));
  }, [items]);

  const totalCost = items.reduce((acc, curr) => acc + curr.total, 0);

  if (totalCost === 0) return (
    <div className="h-64 flex items-center justify-center text-slate-400 text-sm">
      No data to visualize
    </div>
  );

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            fill="#8884d8"
            paddingAngle={5}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip 
            formatter={(value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value)}
          />
          <Legend verticalAlign="bottom" height={36}/>
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export const TopCostItemsChart: React.FC<ChartProps> = ({ items }) => {
  const data = React.useMemo(() => {
    return [...items]
      .sort((a, b) => b.total - a.total)
      .slice(0, 5)
      .map(item => ({
        name: item.description.length > 15 ? item.description.substring(0, 15) + '...' : item.description,
        cost: item.total
      }));
  }, [items]);

  if (items.length === 0) return null;

  return (
     <div className="h-64 w-full mt-4">
        <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 text-center">Top 5 Drivers</h4>
      <ResponsiveContainer width="100%" height="90%">
        <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
          <XAxis type="number" hide />
          <YAxis type="category" dataKey="name" width={100} tick={{fontSize: 11}} />
          <Tooltip 
             cursor={{fill: '#f8fafc'}}
             formatter={(value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value)}
          />
          <Bar dataKey="cost" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={20} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}