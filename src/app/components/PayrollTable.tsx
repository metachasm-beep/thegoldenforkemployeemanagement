'use client';

import { useState } from 'react';
import { SalaryReport } from '@/types';
import Avatar from 'boring-avatars';
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Info } from 'lucide-react';

export default function PayrollTable({ reports }: { reports: SalaryReport[] }) {
  const [sortConfig, setSortConfig] = useState<{ key: keyof SalaryReport; direction: 'asc' | 'desc' } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const sortedReports = [...reports].sort((a, b) => {
    if (!sortConfig) return 0;
    const aValue = a[sortConfig.key];
    const bValue = b[sortConfig.key];
    if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  const totalPages = Math.ceil(sortedReports.length / itemsPerPage);
  const currentData = sortedReports.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const requestSort = (key: keyof SalaryReport) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
    setSortConfig({ key, direction });
  };

  const SortIcon = ({ columnKey }: { columnKey: keyof SalaryReport }) => {
    if (sortConfig?.key !== columnKey) return <ChevronUp className="w-4 h-4 text-gray-300 dark:text-gray-700 opacity-0 group-hover:opacity-100 transition-opacity" />;
    return sortConfig.direction === 'asc' ? <ChevronUp className="w-4 h-4 text-blue-500" /> : <ChevronDown className="w-4 h-4 text-blue-500" />;
  };

  return (
    <div className="overflow-x-auto rounded-2xl border border-gray-100 dark:border-gray-800 shadow-inner bg-gray-50/50 dark:bg-gray-900/50">
      <table className="w-full text-left border-collapse min-w-[800px]">
        <thead>
          <tr className="text-xs uppercase tracking-widest text-gray-400 border-b border-gray-100 dark:border-gray-800">
            <th className="p-5 font-semibold cursor-pointer group hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors" onClick={() => requestSort('employeeName')}>
              <div className="flex items-center gap-2">Employee <SortIcon columnKey="employeeName" /></div>
            </th>
            <th className="p-5 font-semibold cursor-pointer group hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors" onClick={() => requestSort('baseSalary')}>
              <div className="flex items-center gap-2">Base Fee <SortIcon columnKey="baseSalary" /></div>
            </th>
            <th className="p-5 font-semibold text-center cursor-pointer group hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors" onClick={() => requestSort('conversions')}>
              <div className="flex items-center justify-center gap-2">Conversions <SortIcon columnKey="conversions" /></div>
            </th>
            <th className="p-5 font-semibold cursor-pointer group hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors" onClick={() => requestSort('commission')}>
              <div className="flex items-center gap-2">Bonuses <SortIcon columnKey="commission" /></div>
            </th>
            <th className="p-5 font-bold text-emerald-600 dark:text-emerald-500 cursor-pointer group hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors" onClick={() => requestSort('totalPayout')}>
              <div className="flex items-center gap-2">Net Payout <SortIcon columnKey="totalPayout" /></div>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-gray-800 bg-white dark:bg-gray-900">
          {currentData.map(report => (
            <tr key={report.employeeId} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group">
              <td className="p-5 font-bold text-gray-700 dark:text-gray-200">
                <div className="flex items-center gap-3">
                  <Avatar size={32} name={report.employeeName} variant="beam" colors={['#92A1C6', '#146A7C', '#F0AB3D', '#C271B4', '#C20D90']} />
                  <span>{report.employeeName}</span>
                </div>
              </td>
              <td className="p-5 text-gray-500 dark:text-gray-400">
                <div className="flex items-center gap-2 relative group/tooltip">
                  ${report.baseSalary.toLocaleString()}
                  <Info className="w-4 h-4 text-gray-300 hover:text-blue-500 cursor-help" />
                  <div className="absolute bottom-full mb-2 left-0 w-48 bg-gray-900 text-white text-xs p-2 rounded-lg opacity-0 group-hover/tooltip:opacity-100 transition-opacity pointer-events-none z-10 shadow-xl">
                    Probation targets 5 sales ($15k). Standard ($45k). Prorated ($9k/sale) if missed.
                  </div>
                </div>
              </td>
              <td className="p-5 text-center">
                <span className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 py-1 px-3 rounded-full font-semibold">
                  {report.conversions}
                </span>
              </td>
              <td className="p-5 text-gray-500 dark:text-gray-400">${report.commission.toLocaleString()}</td>
              <td className="p-5 font-black text-emerald-600 dark:text-emerald-400 group-hover:text-emerald-500">${report.totalPayout.toLocaleString()}</td>
            </tr>
          ))}
          {reports.length === 0 && (
            <tr><td colSpan={5} className="p-8 text-center text-gray-400">No data available</td></tr>
          )}
        </tbody>
      </table>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="p-4 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 flex items-center justify-between">
          <span className="text-sm text-gray-500">Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, reports.length)} of {reports.length}</span>
          <div className="flex items-center gap-2">
            <button 
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(p => p - 1)}
              className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50"
            >
              <ChevronLeft size={18} />
            </button>
            <span className="text-sm font-medium px-4">{currentPage} / {totalPages}</span>
            <button 
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(p => p + 1)}
              className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
