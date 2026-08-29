'use client';

import { useState } from 'react';
import { Download } from 'lucide-react';
import { Employee, Lead, Expense, SalaryReport } from '@/types';

export default function ReportBuilder({
  employees, leads, expenses, reports
}: {
  employees: Employee[], leads: Lead[], expenses: Expense[], reports: SalaryReport[]
}) {
  const [dataset, setDataset] = useState('employees');
  const [columns, setColumns] = useState<string[]>(['name', 'role', 'baseSalary']);

  const datasets: Record<string, { label: string, data: any[], availableCols: string[] }> = {
    employees: {
      label: 'Employees Directory',
      data: employees,
      availableCols: ['id', 'name', 'email', 'role', 'baseSalary', 'commissionRate', 'isProbation']
    },
    leads: {
      label: 'Leads Pipeline',
      data: leads,
      availableCols: ['leadId', 'assignee', 'status', 'date', 'notes']
    },
    expenses: {
      label: 'Expenses Logs',
      data: expenses,
      availableCols: ['expenseId', 'employeeId', 'amount', 'description', 'status', 'date']
    },
    payroll: {
      label: 'Payroll Ledgers',
      data: reports,
      availableCols: ['employeeName', 'target', 'conversions', 'baseSalary', 'commission', 'totalPayout']
    }
  };

  const handleToggleCol = (col: string) => {
    setColumns(prev => 
      prev.includes(col) ? prev.filter(c => c !== col) : [...prev, col]
    );
  };

  const handleDatasetChange = (ds: string) => {
    setDataset(ds);
    setColumns(datasets[ds].availableCols.slice(0, 4)); // Default select first 4
  };

  const currentDataset = datasets[dataset];

  const exportCSV = () => {
    if (columns.length === 0) return;
    
    // Header row
    let csv = columns.join(',') + '\n';
    
    // Data rows
    currentDataset.data.forEach(row => {
      const rowData = columns.map(col => {
        let val = row[col];
        if (typeof val === 'string') {
          return `"${val.replace(/"/g, '""')}"`;
        }
        return val;
      });
      csv += rowData.join(',') + '\n';
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${dataset}_report_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 md:p-10 shadow-sm flex flex-col lg:flex-row gap-10">
      
      {/* Left Sidebar controls */}
      <div className="w-full lg:w-72 shrink-0 space-y-8">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-3">1. Select Data</h3>
          <select 
            value={dataset} 
            onChange={(e) => handleDatasetChange(e.target.value)}
            className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white"
          >
            {Object.entries(datasets).map(([key, ds]) => (
              <option key={key} value={key}>{ds.label}</option>
            ))}
          </select>
        </div>

        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-3">2. Choose Columns</h3>
          <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
            {currentDataset.availableCols.map(col => (
              <label key={col} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors">
                <input 
                  type="checkbox" 
                  checked={columns.includes(col)}
                  onChange={() => handleToggleCol(col)}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{col}</span>
              </label>
            ))}
          </div>
        </div>

        <button 
          onClick={exportCSV}
          disabled={columns.length === 0}
          className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-colors"
        >
          <Download size={18} />
          Export to CSV
        </button>
      </div>

      {/* Right Preview */}
      <div className="flex-1 min-w-0 bg-gray-50 dark:bg-gray-950 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden flex flex-col">
        <div className="p-4 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 font-bold text-gray-700 dark:text-gray-200">
          Data Preview ({currentDataset.data.length} rows)
        </div>
        <div className="p-0 flex-1 overflow-auto">
          {columns.length === 0 ? (
            <div className="h-full flex items-center justify-center text-gray-400 italic p-10 text-center">
              Select at least one column to preview data.
            </div>
          ) : (
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-gray-100/50 dark:bg-gray-800/50 sticky top-0">
                <tr>
                  {columns.map(col => (
                    <th key={col} className="p-3 font-semibold text-gray-600 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {currentDataset.data.slice(0, 10).map((row, idx) => (
                  <tr key={idx} className="hover:bg-gray-100/50 dark:hover:bg-gray-800/50">
                    {columns.map(col => (
                      <td key={col} className="p-3 text-gray-700 dark:text-gray-300 truncate max-w-[200px]">
                        {String(row[col] ?? '')}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {currentDataset.data.length > 10 && (
            <div className="p-3 text-center text-xs text-gray-400 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 sticky bottom-0">
              Showing first 10 rows. Export to see all data.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
