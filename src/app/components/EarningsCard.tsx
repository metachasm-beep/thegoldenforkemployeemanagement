'use client';
import { SalaryReport } from '@/types';
import { Target, CheckCircle2, Sparkles, Clock } from 'lucide-react';
import { useMemo } from 'react';
import { Bar, BarChart, ResponsiveContainer, XAxis, Tooltip } from 'recharts';
import { PT_SALES_SCHEDULE_A, PT_SALES_CONSTANTS } from '@/lib/compensation';

export default function EarningsCard({ report }: { report: SalaryReport }) {
  const isPartTime = Boolean(report.isPartTime);

  const progress = useMemo(() => {
    if (isPartTime) {
      const rev = report.netRevenueThisMonth || 0;
      return Math.min((rev / PT_SALES_CONSTANTS.MONTHLY_NET_REVENUE_TARGET) * 100, 100);
    }
    return Math.min((report.conversions / (report.target || 5)) * 100, 100);
  }, [isPartTime, report.netRevenueThisMonth, report.conversions, report.target]);

  const demoProgress = useMemo(() => {
    const demos = report.verifiedDemos || 0;
    const quota = report.demoQuota || PT_SALES_CONSTANTS.MONTHLY_DEMO_QUOTA;
    return Math.min((demos / quota) * 100, 100);
  }, [report.verifiedDemos, report.demoQuota]);

  const milestoneProgress = useMemo(() => {
    const cumRev = report.cumulativeNetRevenue || 0;
    const remainder = cumRev % PT_SALES_CONSTANTS.MILESTONE_NET_REVENUE_BLOCK;
    return Math.min((remainder / PT_SALES_CONSTANTS.MILESTONE_NET_REVENUE_BLOCK) * 100, 100);
  }, [report.cumulativeNetRevenue]);

  const chartData = [
    { name: 'Base', amount: report.baseSalary, fill: '#818cf8' },
    { name: 'Comm / Bonus', amount: report.commission, fill: '#34d399' },
  ];

  return (
    <div className="space-y-6 w-full">
      <div className="w-full bg-gradient-to-br from-indigo-900 to-slate-900 p-5 md:p-8 rounded-2xl md:rounded-3xl shadow-xl text-white relative overflow-hidden flex flex-col md:flex-row gap-6 md:gap-8 box-border">
        <div className="absolute top-0 right-0 p-4 md:p-8 opacity-5 pointer-events-none">
          <Target className="w-32 h-32 md:w-56 md:h-56" />
        </div>

        <div className="flex-1 z-10 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h2 className="text-xs md:text-lg font-medium text-indigo-200 uppercase md:normal-case tracking-wider md:tracking-normal">
              Estimated Monthly Earnings
            </h2>
            {isPartTime && (
              <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/30">
                Part-Time Field Sales ({PT_SALES_CONSTANTS.DOCUMENT_REF})
              </span>
            )}
          </div>

          <p
            className="text-3xl md:text-5xl font-black mb-2 truncate"
            title={`Rs. ${report.totalPayout.toLocaleString('en-IN')}`}
          >
            ₹{report.totalPayout.toLocaleString('en-IN')}
          </p>

          {isPartTime && report.tierStatusLabel && (
            <p className="text-xs text-amber-300 font-semibold mb-4 bg-white/5 border border-white/10 px-3 py-1.5 rounded-xl inline-block">
              {report.tierStatusLabel}
            </p>
          )}

          <div className="grid grid-cols-2 gap-2.5 md:gap-4 mb-5">
            <div className="bg-white/10 backdrop-blur-md p-3 md:p-4 rounded-xl md:rounded-2xl border border-white/10 min-w-0">
              <p className="text-indigo-200 text-[10px] md:text-xs uppercase tracking-wider mb-0.5 truncate">
                {isPartTime ? 'Fixed Base Fee' : 'Base Fee'}
              </p>
              <p className="text-base md:text-xl font-bold leading-none truncate">
                ₹{report.baseSalary.toLocaleString('en-IN')}
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-md p-3 md:p-4 rounded-xl md:rounded-2xl border border-white/10 min-w-0">
              <p className="text-indigo-200 text-[10px] md:text-xs uppercase tracking-wider mb-0.5 truncate">
                {isPartTime ? 'Commissions & Accelerator' : 'Bonuses'}
              </p>
              <p className="text-base md:text-xl font-bold leading-none truncate">
                ₹{report.commission.toLocaleString('en-IN')}
              </p>
            </div>
          </div>

          {isPartTime ? (
            <div className="space-y-3.5">
              {/* 1. Net Annual Revenue Quota */}
              <div>
                <div className="flex justify-between text-xs font-medium text-indigo-200 mb-1.5 gap-2">
                  <span>
                    Net Annual Subscription Quota (Settled ≥ ₹59,950 Excl. 18% GST)
                  </span>
                  <span className="font-mono font-bold text-white shrink-0">
                    ₹{(report.netRevenueThisMonth || 0).toLocaleString('en-IN')} / ₹60,000 (
                    {Math.round(progress)}%)
                  </span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden border border-white/5">
                  <div
                    className="bg-gradient-to-r from-emerald-400 to-emerald-500 h-full rounded-full transition-all duration-700"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              {/* 2. Verified Live Demonstrations Gate (15/mo) */}
              <div>
                <div className="flex justify-between text-xs font-medium text-indigo-200 mb-1.5 gap-2">
                  <span>Verified On-Site Product Demonstrations Gate</span>
                  <span className="font-mono font-bold text-white shrink-0">
                    {report.verifiedDemos || 0} / {PT_SALES_CONSTANTS.MONTHLY_DEMO_QUOTA} Demos (
                    {Math.round(demoProgress)}%)
                  </span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden border border-white/5">
                  <div
                    className="bg-gradient-to-r from-amber-400 to-orange-400 h-full rounded-full transition-all duration-700"
                    style={{ width: `${demoProgress}%` }}
                  />
                </div>
              </div>

              {/* 3. Cumulative ₹12,00,000 Milestone Bonus Tracker */}
              <div>
                <div className="flex justify-between text-xs font-medium text-indigo-200 mb-1.5 gap-2">
                  <span>Cumulative ₹12,00,000 Milestone Bonus (₹60,000 Payout)</span>
                  <span className="font-mono font-bold text-purple-300 shrink-0">
                    ₹{(report.cumulativeNetRevenue || 0).toLocaleString('en-IN')} / ₹12,00,000
                  </span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden border border-white/5">
                  <div
                    className="bg-gradient-to-r from-purple-400 to-pink-500 h-full rounded-full transition-all duration-700"
                    style={{ width: `${milestoneProgress}%` }}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="mb-1 md:mb-4">
              <div className="flex justify-between text-[10px] md:text-sm font-medium text-indigo-200 mb-1.5 md:mb-2 min-w-0 gap-2">
                <span className="truncate">
                  Quota ({report.conversions}/{report.target || 5})
                </span>
                <span className="shrink-0">{Math.round(progress)}%</span>
              </div>
              <div
                className="w-full bg-slate-800 rounded-full h-1.5 md:h-3 overflow-hidden border border-white/5"
                role="progressbar"
                aria-valuenow={progress}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                <div
                  className="bg-gradient-to-r from-emerald-400 to-emerald-500 h-1.5 md:h-3 rounded-full transition-all duration-1000"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
        </div>

        <div className="flex-1 hidden md:flex flex-col justify-end z-10 bg-white/5 p-4 rounded-2xl border border-white/10">
          <h3 className="text-sm font-medium text-indigo-200 mb-4 text-center">
            Compensation Split
          </h3>
          <div className="h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <XAxis
                  dataKey="name"
                  stroke="#818cf8"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  cursor={{ fill: 'rgba(255, 255, 255, 0.1)' }}
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#fff',
                  }}
                  itemStyle={{ color: '#fff' }}
                  formatter={(value: any) => [
                    `₹${typeof value === 'number' ? value.toLocaleString('en-IN') : value}`,
                    'Amount',
                  ]}
                />
                <Bar dataKey="amount" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* SCHEDULE A MATRIX FOR PART-TIME SALES EXECUTIVES */}
      {isPartTime && (
        <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                Schedule A: Modular Pricing, Live Demo Scope &amp; Commission Matrix
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Field Hours: {PT_SALES_CONSTANTS.WEEKLY_HOURS_RANGE} • Decision-Maker Windows:{' '}
                {PT_SALES_CONSTANTS.FIELD_WINDOWS} • 90-Day Module Upsell Attribution Active
              </p>
            </div>
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
              <Clock className="w-3.5 h-3.5" /> 14-Day Free Trial = Demo Credit (₹0 Rev until Paid)
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-800 text-gray-500 uppercase text-[10px]">
                  <th className="py-3 px-3">Module / Suite (thegoldenfork.de)</th>
                  <th className="py-3 px-3">Mandatory Live Demo Features</th>
                  <th className="py-3 px-3">Net Annual (Excl. GST)</th>
                  <th className="py-3 px-3">Gross Invoice (18% GST)</th>
                  <th className="py-3 px-3">Under-Quota (30% Net)</th>
                  <th className="py-3 px-3">Over-Quota Accel (20%)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {PT_SALES_SCHEDULE_A.map((mod) => (
                  <tr key={mod.code} className="hover:bg-gray-50/60 dark:hover:bg-gray-800/30">
                    <td className="py-3 px-3 font-bold text-gray-900 dark:text-white">
                      {mod.fullName}
                    </td>
                    <td className="py-3 px-3 text-gray-600 dark:text-gray-300 max-w-xs">
                      <ul className="list-disc pl-4 space-y-0.5">
                        {mod.demoFeatures.map((f) => (
                          <li key={f}>{f}</li>
                        ))}
                      </ul>
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-indigo-600 dark:text-indigo-400 whitespace-nowrap">
                      ₹{mod.netAnnualPrice.toLocaleString('en-IN')}/yr
                    </td>
                    <td className="py-3 px-3 font-mono text-gray-600 dark:text-gray-400 whitespace-nowrap">
                      ₹{mod.grossInvoiceWithGst.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-amber-600 dark:text-amber-400 whitespace-nowrap">
                      ₹{mod.underQuotaCommission30.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                      ₹{mod.overQuotaAccelerator20.toLocaleString('en-IN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
