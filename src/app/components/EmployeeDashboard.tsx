'use client';

import { SalaryReport } from '@/types';
import { generatePaystub } from '@/lib/pdf';
import { Download, TrendingUp, DollarSign, Target } from 'lucide-react';

type Props = {
  report: SalaryReport;
  isMonthOne: boolean; // Just for display purposes
};

export default function EmployeeDashboard({ report, isMonthOne }: Props) {
  
  const handleDownload = () => {
    const month = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });
    generatePaystub(report, month);
  };

  // Metachasm Contract Math Visuals
  const salesToNextTarget = Math.max(0, 5 - report.conversions);
  const nextMilestone = (Math.floor(report.conversions / 100) + 1) * 100;
  const salesToMilestone = nextMilestone - report.conversions;

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-gray-800 to-gray-900 rounded-xl p-8 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex justify-between items-start mb-8">
            <div>
              <h2 className="text-3xl font-bold">Welcome back, {report.employeeName}</h2>
              <p className="text-gray-400 mt-2">Live Commission Tracker • {new Date().toLocaleString('default', { month: 'long' })}</p>
            </div>
            <button 
              onClick={handleDownload}
              className="flex items-center gap-2 bg-white text-gray-900 px-4 py-2 rounded-lg font-medium hover:bg-gray-100 transition-colors"
            >
              <Download size={18} />
              Download Paystub
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white/10 rounded-lg p-6 backdrop-blur-sm border border-white/20">
              <div className="flex items-center gap-3 text-gray-300 mb-2">
                <DollarSign size={20} />
                <span className="font-medium">Net Payout</span>
              </div>
              <p className="text-4xl font-bold text-green-400">${report.totalPayout.toLocaleString()}</p>
              <p className="text-sm text-gray-400 mt-2">Base: ${report.baseSalary.toLocaleString()} | Bonus: ${report.commission.toLocaleString()}</p>
            </div>

            <div className="bg-white/10 rounded-lg p-6 backdrop-blur-sm border border-white/20">
              <div className="flex items-center gap-3 text-gray-300 mb-2">
                <Target size={20} />
                <span className="font-medium">Monthly Target (5)</span>
              </div>
              <p className="text-4xl font-bold">{report.conversions}</p>
              <p className="text-sm text-gray-400 mt-2">
                {salesToNextTarget > 0 
                  ? `${salesToNextTarget} sales left to secure fixed fee!` 
                  : `Target hit! +$5,000 per extra sale.`}
              </p>
            </div>

            <div className="bg-white/10 rounded-lg p-6 backdrop-blur-sm border border-white/20">
              <div className="flex items-center gap-3 text-gray-300 mb-2">
                <TrendingUp size={20} />
                <span className="font-medium">₹1L Milestone Progress</span>
              </div>
              <p className="text-4xl font-bold">{report.conversions} / {nextMilestone}</p>
              <p className="text-sm text-gray-400 mt-2">{salesToMilestone} sales to next ₹1,00,000 bonus</p>
            </div>
          </div>
        </div>
        
        {/* Background decorative elements */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-green-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>
        <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>
      </div>
    </div>
  );
}
