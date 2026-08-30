'use client';

import { Employee, Lead, AuditLog } from '@/types';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Users, Target, Activity, TrendingUp, AlertCircle, Zap } from 'lucide-react';
import AuditLogsWidget from './AuditLogsWidget';
import { FunnelChart } from '@/components/charts/funnel-chart';

import CountUp from '@/components/react-bits/CountUp/CountUp';
import SpotlightCard from '@/components/react-bits/SpotlightCard/SpotlightCard';
import TargetCursor from '@/components/react-bits/TargetCursor/TargetCursor';
import FadeContent from '@/components/react-bits/FadeContent/FadeContent';
import TrueFocus from '@/components/react-bits/TrueFocus/TrueFocus';
import MagicBento from '@/components/react-bits/MagicBento/MagicBento';



type Props = {
  employees: Employee[];
  leads: Lead[];
  auditLogs: AuditLog[];
};

export default function ManagerDashboard({ employees, leads, auditLogs }: Props) {
  const converted = leads.filter(l => l.status === 'Converted');
  const active = leads.filter(l => l.status !== 'Converted' && l.status !== 'Lost');
  
  // Forecast Model
  // Pending=10%, Contacted=20%, Meeting=50%, Proposal=80%
  // Assuming average revenue per converted lead is ₹150,000, and commission is ₹3000
  let forecastedRevenue = 0;
  let forecastedLiability = 0;
  
  active.forEach(l => {
    let prob = 0.1;
    if (l.status === 'Contacted') prob = 0.2;
    if (l.status === 'Meeting Scheduled') prob = 0.5;
    if (l.status === 'Proposal Sent') prob = 0.8;
    
    forecastedRevenue += (150000 * prob);
    forecastedLiability += (3000 * prob);
  });

  // Sales Velocity (Avg days from created to converted)
  const convertedWithDates = converted.filter(l => l.createdAt && l.convertedAt);
  let avgVelocity = 0;
  if (convertedWithDates.length > 0) {
    const totalDays = convertedWithDates.reduce((acc, l) => {
      const ms = new Date(l.convertedAt!).getTime() - new Date(l.createdAt).getTime();
      return acc + (ms / (1000 * 3600 * 24));
    }, 0);
    avgVelocity = Math.round(totalDays / convertedWithDates.length);
  }

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

  const statusData = [
    { name: 'Pending', value: leads.filter(l => l.status === 'Pending').length, color: '#9CA3AF' },
    { name: 'Contacted', value: leads.filter(l => l.status === 'Contacted').length, color: '#3B82F6' },
    { name: 'Meeting', value: leads.filter(l => l.status === 'Meeting Scheduled').length, color: '#F59E0B' },
    { name: 'Proposal', value: leads.filter(l => l.status === 'Proposal Sent').length, color: '#8B5CF6' },
    { name: 'Converted', value: leads.filter(l => l.status === 'Converted').length, color: '#10B981' },
    { name: 'Lost', value: leads.filter(l => l.status === 'Lost').length, color: '#EF4444' }
  ].filter(d => d.value > 0);

  return (
    <div className="space-y-6 cursor-target">
      <TargetCursor />
      
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <SpotlightCard className="flex items-center gap-4 shadow-sm">
          <div className="p-3 bg-blue-50 dark:bg-blue-900/30 text-blue-600 rounded-xl"><Users size={24} /></div>
          <div><p className="text-sm text-gray-500 font-medium">Headcount</p><p className="text-2xl font-bold"><CountUp to={employees.length} /></p></div>
        </SpotlightCard>
        <SpotlightCard className="flex items-center gap-4 shadow-sm">
          <div className="p-3 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 rounded-xl"><Target size={24} /></div>
          <div><p className="text-sm text-gray-500 font-medium">Converted</p><p className="text-2xl font-bold"><CountUp to={converted.length} /></p></div>
        </SpotlightCard>
        <SpotlightCard className="flex items-center gap-4 shadow-sm">
          <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 rounded-xl"><TrendingUp size={24} /></div>
          <div><p className="text-sm text-gray-500 font-medium">Pipeline Fore.</p><p className="text-lg font-bold">₹<CountUp to={Math.round(forecastedRevenue)} separator="," /></p></div>
        </SpotlightCard>
        <SpotlightCard className="flex items-center gap-4 shadow-sm">
          <div className="p-3 bg-orange-50 dark:bg-orange-900/30 text-orange-600 rounded-xl"><Zap size={24} /></div>
          <div><p className="text-sm text-gray-500 font-medium">Avg Velocity</p><p className="text-2xl font-bold"><CountUp to={avgVelocity} /> <span className="text-sm">days</span></p></div>
        </SpotlightCard>
        <SpotlightCard spotlightColor="rgba(239, 68, 68, 0.2)" className="border-red-100 dark:border-red-900/50 shadow-sm flex items-center gap-4 relative overflow-hidden group">
          <div className="absolute inset-0 bg-red-50 dark:bg-red-900/10 -z-10 group-hover:bg-red-100 dark:group-hover:bg-red-900/20 transition-colors"></div>
          <div className="p-3 bg-red-100 dark:bg-red-900/50 text-red-600 rounded-xl animate-pulse"><AlertCircle size={24} /></div>
          <div><p className="text-sm text-red-600 dark:text-red-400 font-bold">Stagnant</p><p className="text-2xl font-black text-red-700 dark:text-red-500"><CountUp to={stagnantLeads.length} /></p></div>
        </SpotlightCard>
      </div>

      
      <div className="mb-4">
         <MagicBento 
           components={[
             { children: (
        <div className="w-full h-full p-4 md:p-6 flex flex-col">
          <div className="mb-6 flex items-center gap-2">
            <Activity className="text-blue-500" />
            <TrueFocus items={[<span key="1" className="text-lg font-bold text-gray-800 dark:text-gray-100">Top</span>, <span key="2" className="text-lg font-bold text-gray-800 dark:text-gray-100">Performers</span>]} animationDuration={0.8} pauseBetweenAnimations={2} />
          </div>
          <div className="h-64 flex-1 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topPerformers}>
                <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip cursor={{fill: 'rgba(0,0,0,0.05)'}} contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Bar dataKey="conversions" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>) },
             { children: (
        <div className="w-full h-full p-4 md:p-6 flex flex-col">
          <h3 className="text-lg font-bold mb-6 text-gray-800 dark:text-gray-100">Lead Status</h3>
          
          {statusData.length > 0 ? (
            <div className="h-64 flex-1">
              <FadeContent blur={true} duration={1000} ease="ease-out" initialOpacity={0}>
              <FunnelChart 
                data={statusData.map(s => ({ label: s.name, value: s.value, color: s.color }))}
                orientation="vertical"
                layers={3}
                labelLayout="grouped"
              />
            </FadeContent>
            </div>
          ) : (
            <div className="h-48 flex items-center justify-center text-gray-400 text-sm italic">
              No leads available to chart
            </div>
          )}
        </div>) },
             { children: (
        <div className="w-full h-full p-0 flex flex-col h-full"><AuditLogsWidget logs={auditLogs} /></div>) },
           ]}
         />
      </div>

    </div>
  );
}
