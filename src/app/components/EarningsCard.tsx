'use client';
import { SalaryReport } from '@/types';
import { Target } from 'lucide-react';
import { useCallback, useMemo } from 'react';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';

export default function EarningsCard({ report }: { report: SalaryReport }) {
  const progress = useMemo(() => Math.min((report.conversions / (report.target || 5)) * 100, 100), [report.conversions, report.target]);

  const chartData = [
    { name: 'Base', amount: report.baseSalary, fill: '#818cf8' },
    { name: 'Bonus', amount: report.commission, fill: '#34d399' },
  ];

  return (
    <div className="w-full lg:col-span-2 bg-gradient-to-br from-indigo-900 to-slate-900 p-4 md:p-8 rounded-2xl md:rounded-3xl shadow-xl text-white relative overflow-hidden flex flex-col md:flex-row gap-4 md:gap-8 box-border">
      <div className="absolute top-0 right-0 p-4 md:p-8 opacity-5 pointer-events-none">
        <Target className="w-32 h-32 md:w-56 md:h-56" />
      </div>
      
      <div className="flex-1 z-10 min-w-0">
        <h2 className="text-xs md:text-xl font-medium text-indigo-200 mb-0.5 md:mb-2 uppercase md:normal-case tracking-wider md:tracking-normal truncate">Estimated Earnings</h2>
        <p className="text-3xl md:text-5xl font-black mb-3 md:mb-8 truncate" title={`Rs. ${report.totalPayout.toLocaleString()}`}>
          Rs. {report.totalPayout.toLocaleString()}
        </p>
        
        <div className="grid grid-cols-2 gap-2 md:gap-4 mb-3 md:mb-8">
          <div className="bg-white/10 backdrop-blur-md p-2.5 md:p-4 rounded-xl md:rounded-2xl border border-white/10 min-w-0">
            <p className="text-indigo-200 text-[10px] md:text-sm uppercase tracking-wider mb-0.5 truncate">Base Fee</p>
            <p className="text-base md:text-xl font-bold leading-none truncate" title={`Rs. ${report.baseSalary.toLocaleString()}`}>
              Rs. {report.baseSalary.toLocaleString()}
            </p>
          </div>
          <div className="bg-white/10 backdrop-blur-md p-2.5 md:p-4 rounded-xl md:rounded-2xl border border-white/10 min-w-0">
            <p className="text-indigo-200 text-[10px] md:text-sm uppercase tracking-wider mb-0.5 truncate">Bonuses</p>
            <p className="text-base md:text-xl font-bold leading-none truncate" title={`Rs. ${report.commission.toLocaleString()}`}>
              Rs. {report.commission.toLocaleString()}
            </p>
          </div>
        </div>

        <div className="mb-1 md:mb-4">
          <div className="flex justify-between text-[10px] md:text-sm font-medium text-indigo-200 mb-1.5 md:mb-2 min-w-0 gap-2">
            <span className="truncate">Quota ({report.conversions}/{report.target || 5})</span>
            <span className="shrink-0">{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-1.5 md:h-3 overflow-hidden border border-white/5" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
            <div 
              className="bg-gradient-to-r from-emerald-400 to-emerald-500 h-1.5 md:h-3 rounded-full transition-all duration-1000" 
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>
      </div>

      <div className="flex-1 hidden md:flex flex-col justify-end z-10 bg-white/5 p-4 rounded-2xl border border-white/10">
        <h3 className="text-sm font-medium text-indigo-200 mb-4 text-center">Compensation Split</h3>
        <div className="h-[200px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <XAxis dataKey="name" stroke="#818cf8" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip 
                cursor={{ fill: 'rgba(255, 255, 255, 0.1)' }}
                contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }}
                itemStyle={{ color: '#fff' }}
                formatter={(value: any) => [`₹${typeof value === 'number' ? value.toLocaleString() : value}`, 'Amount']}
              />
              <Bar dataKey="amount" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
