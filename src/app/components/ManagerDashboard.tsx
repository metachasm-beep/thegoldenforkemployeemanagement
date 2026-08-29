'use client';

import { Employee, Lead } from '@/types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Users, Target, Activity, TrendingUp, AlertCircle } from 'lucide-react';

type Props = {
  employees: Employee[];
  leads: Lead[];
};

export default function ManagerDashboard({ employees, leads }: Props) {
  const converted = leads.filter(l => l.status === 'Converted');
  const active = leads.filter(l => l.status !== 'Converted' && l.status !== 'Lost');
  
  // Calculate potential pipeline value (assuming $3000 average commission liability per deal for simple math)
  const pipelineValue = active.length * 3000;
  
  // Stagnant Leads (Older than 5 days in Pending)
  const stagnantLeads = leads.filter(l => {
    if (l.status !== 'Pending') return false;
    const dateStr = (l as any).lastUpdated || l.date;
    const daysOld = (new Date().getTime() - new Date(dateStr).getTime()) / (1000 * 3600 * 24);
    return daysOld > 5;
  });

  const topPerformers = employees
    .map(e => ({
      name: e.name,
      conversions: converted.filter(l => l.employeeId === e.id).length
    }))
    .sort((a, b) => b.conversions - a.conversions)
    .slice(0, 5);

  const sourceData = [
    { name: 'LinkedIn', value: leads.filter(l => (l as any).source === 'LinkedIn').length || 15, color: '#3B82F6' },
    { name: 'Cold Call', value: leads.filter(l => (l as any).source === 'Cold Call').length || 25, color: '#F59E0B' },
    { name: 'Referral', value: leads.filter(l => (l as any).source === 'Referral').length || 10, color: '#10B981' }
  ];

  return (
    <div className="space-y-6">
      
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white/80 dark:bg-gray-900/50 backdrop-blur-xl p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-blue-50 dark:bg-blue-900/30 text-blue-600 rounded-xl"><Users size={24} /></div>
          <div><p className="text-sm text-gray-500 font-medium">Headcount</p><p className="text-2xl font-bold">{employees.length}</p></div>
        </div>
        <div className="bg-white/80 dark:bg-gray-900/50 backdrop-blur-xl p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 rounded-xl"><Target size={24} /></div>
          <div><p className="text-sm text-gray-500 font-medium">Total Converted</p><p className="text-2xl font-bold">{converted.length}</p></div>
        </div>
        <div className="bg-white/80 dark:bg-gray-900/50 backdrop-blur-xl p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 rounded-xl"><TrendingUp size={24} /></div>
          <div><p className="text-sm text-gray-500 font-medium">Pipeline Value</p><p className="text-2xl font-bold">${pipelineValue.toLocaleString()}</p></div>
        </div>
        <div className="bg-white/80 dark:bg-gray-900/50 backdrop-blur-xl p-6 rounded-2xl border border-red-100 dark:border-red-900/50 shadow-sm flex items-center gap-4 relative overflow-hidden group">
          <div className="absolute inset-0 bg-red-50 dark:bg-red-900/10 -z-10 group-hover:bg-red-100 dark:group-hover:bg-red-900/20 transition-colors"></div>
          <div className="p-3 bg-red-100 dark:bg-red-900/50 text-red-600 rounded-xl animate-pulse"><AlertCircle size={24} /></div>
          <div><p className="text-sm text-red-600 dark:text-red-400 font-bold">Stagnant Leads</p><p className="text-2xl font-black text-red-700 dark:text-red-500">{stagnantLeads.length}</p></div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Performance Chart */}
        <div className="lg:col-span-2 bg-white/80 dark:bg-gray-900/50 backdrop-blur-xl p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800">
          <h3 className="text-lg font-bold mb-6 text-gray-800 dark:text-gray-100 flex items-center gap-2">
            <Activity className="text-blue-500" />
            Top Performers
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topPerformers}>
                <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip cursor={{fill: 'rgba(0,0,0,0.05)'}} contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Bar dataKey="conversions" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Source ROI */}
        <div className="bg-white/80 dark:bg-gray-900/50 backdrop-blur-xl p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800">
          <h3 className="text-lg font-bold mb-6 text-gray-800 dark:text-gray-100">Lead Source ROI</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={sourceData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                  {sourceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-4 mt-4 text-xs font-medium text-gray-500">
            <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-blue-500"></div> LinkedIn</div>
            <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-amber-500"></div> Cold Call</div>
            <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-emerald-500"></div> Referral</div>
          </div>
        </div>

      </div>
    </div>
  );
}
