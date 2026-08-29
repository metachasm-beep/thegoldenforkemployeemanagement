'use client';

import { SalaryReport } from '@/types';
import jsPDF from 'jspdf';
import { Trophy, Medal, Star, DownloadCloud, Target, TrendingUp, AlertCircle } from 'lucide-react';
import Avatar from 'boring-avatars';

export default function EmployeeDashboard({ report }: { report: SalaryReport | undefined }) {
  if (!report) return (
    <div className="bg-red-50 p-6 rounded-xl border border-red-100 text-red-600 font-medium flex items-center gap-2">
      <AlertCircle /> No compensation data found for your account.
    </div>
  );

  const downloadPaystub = () => {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(22);
    doc.setTextColor(30, 41, 59);
    doc.text("THE GOLDEN FORK", 105, 20, { align: "center" });
    
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text("Official Contractor Compensation Statement", 105, 28, { align: "center" });

    doc.setLineWidth(0.5);
    doc.line(20, 35, 190, 35);

    // Employee Details
    doc.setFontSize(12);
    doc.setTextColor(30, 41, 59);
    doc.text(`Contractor: ${report.employeeName}`, 20, 50);
    doc.text(`ID Reference: ${report.employeeId}`, 20, 58);
    doc.text(`Date Generated: ${new Date().toLocaleDateString()}`, 20, 66);

    // Financial Breakdown
    doc.setFontSize(14);
    doc.text("Earnings Breakdown", 20, 85);
    
    doc.setFontSize(11);
    doc.text(`Base Fee: $${report.baseSalary.toLocaleString()}`, 30, 95);
    doc.text(`Performance Bonus: $${report.commission.toLocaleString()}`, 30, 103);
    doc.text(`Total Sales Conversions: ${report.conversions}`, 30, 111);

    // Total Line
    doc.setLineWidth(1);
    doc.line(20, 120, 190, 120);
    
    doc.setFontSize(16);
    doc.text(`NET PAYOUT: $${report.totalPayout.toLocaleString()}`, 20, 132);

    doc.save(`paystub_${report.employeeName.replace(/\s+/g, '_')}.pdf`);
  };

  const progress = Math.min((report.conversions / 5) * 100, 100);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Earnings Card */}
        <div className="lg:col-span-2 bg-gradient-to-br from-indigo-900 to-slate-900 p-8 rounded-3xl shadow-xl text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10"><Target size={120} /></div>
          
          <h2 className="text-xl font-medium text-indigo-200 mb-2">Estimated Earnings</h2>
          <p className="text-5xl font-black mb-8">${report.totalPayout.toLocaleString()}</p>
          
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10">
              <p className="text-indigo-200 text-sm">Base Fee</p>
              <p className="text-xl font-bold">${report.baseSalary.toLocaleString()}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10">
              <p className="text-indigo-200 text-sm">Bonuses</p>
              <p className="text-xl font-bold">${report.commission.toLocaleString()}</p>
            </div>
          </div>

          <div className="mb-4">
            <div className="flex justify-between text-sm font-medium text-indigo-200 mb-2">
              <span>Quota Progress ({report.conversions}/5 Sales)</span>
              <span>{progress}%</span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden border border-white/5">
              <div 
                className="bg-gradient-to-r from-emerald-400 to-emerald-500 h-3 rounded-full transition-all duration-1000" 
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>

          <button 
            onClick={downloadPaystub}
            className="w-full mt-6 bg-white/10 hover:bg-white/20 text-white border border-white/20 font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            <DownloadCloud size={20} /> Download PDF Paystub
          </button>
        </div>

        {/* Gamification Podium */}
        <div className="bg-white/80 dark:bg-gray-900/50 backdrop-blur-xl p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800">
          <h3 className="text-xl font-bold mb-6 text-gray-800 dark:text-gray-100 flex items-center gap-2">
            <Trophy className="text-amber-500" /> Leaderboard
          </h3>
          
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-4 bg-amber-50 dark:bg-amber-900/20 p-3 rounded-xl border border-amber-100 dark:border-amber-900/50 relative overflow-hidden">
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-500"></div>
              <Medal className="text-amber-500" size={28} />
              <div className="flex-1">
                <p className="font-bold text-gray-900 dark:text-gray-100 text-sm">Sarah Jenkins</p>
                <p className="text-xs text-amber-600 dark:text-amber-500 font-medium">12 Conversions</p>
              </div>
              <Avatar size={32} name="Sarah Jenkins" variant="beam" />
            </div>

            <div className="flex items-center gap-4 bg-gray-50 dark:bg-gray-800/50 p-3 rounded-xl border border-gray-200 dark:border-gray-700 relative overflow-hidden">
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-gray-400"></div>
              <Medal className="text-gray-400" size={28} />
              <div className="flex-1">
                <p className="font-bold text-gray-900 dark:text-gray-100 text-sm">Michael Chen</p>
                <p className="text-xs text-gray-500 font-medium">8 Conversions</p>
              </div>
              <Avatar size={32} name="Michael Chen" variant="beam" />
            </div>

            <div className="flex items-center gap-4 bg-orange-50 dark:bg-orange-900/20 p-3 rounded-xl border border-orange-100 dark:border-orange-900/50 relative overflow-hidden">
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-orange-500"></div>
              <Medal className="text-orange-500" size={28} />
              <div className="flex-1">
                <p className="font-bold text-gray-900 dark:text-gray-100 text-sm">You</p>
                <p className="text-xs text-orange-600 dark:text-orange-500 font-medium">{report.conversions} Conversions</p>
              </div>
              <Avatar size={32} name={report.employeeName} variant="beam" />
            </div>
          </div>
          
          <div className="mt-6 text-center text-xs text-gray-500">
            You need 4 more sales to pass Michael! 🚀
          </div>
        </div>

      </div>
    </div>
  );
}
