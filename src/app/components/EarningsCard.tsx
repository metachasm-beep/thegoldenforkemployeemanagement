import { SalaryReport } from '@/types';
import jsPDF from 'jspdf';
import { Target, DownloadCloud } from 'lucide-react';
import { useCallback, useMemo } from 'react';

export default function EarningsCard({ report }: { report: SalaryReport }) {
  const downloadPaystub = useCallback(() => {
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
    doc.text(`Base Fee: ₹${report.baseSalary.toLocaleString()}`, 30, 95);
    doc.text(`Performance Bonus: ₹${report.commission.toLocaleString()}`, 30, 103);
    doc.text(`Total Sales Conversions: ${report.conversions}`, 30, 111);

    // Total Line
    doc.setLineWidth(1);
    doc.line(20, 120, 190, 120);
    
    doc.setFontSize(16);
    doc.text(`NET PAYOUT: ₹${report.totalPayout.toLocaleString()}`, 20, 132);

    doc.save(`paystub_${report.employeeName.replace(/\s+/g, '_')}.pdf`);
  }, [report]);

  const progress = useMemo(() => Math.min((report.conversions / (report.target || 5)) * 100, 100), [report.conversions, report.target]);

  return (
    <div className="lg:col-span-2 bg-gradient-to-br from-indigo-900 to-slate-900 p-4 md:p-8 rounded-3xl shadow-xl text-white relative overflow-hidden">
      <div className="absolute top-0 right-0 p-4 md:p-8 opacity-10"><Target size={120} /></div>
      
      <h2 className="text-xl font-medium text-indigo-200 mb-2">Estimated Earnings</h2>
      <p className="text-5xl font-black mb-8">₹{report.totalPayout.toLocaleString()}</p>
      
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10">
          <p className="text-indigo-200 text-sm">Base Fee</p>
          <p className="text-xl font-bold">₹{report.baseSalary.toLocaleString()}</p>
        </div>
        <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10">
          <p className="text-indigo-200 text-sm">Bonuses</p>
          <p className="text-xl font-bold">₹{report.commission.toLocaleString()}</p>
        </div>
      </div>

      <div className="mb-4">
        <div className="flex justify-between text-sm font-medium text-indigo-200 mb-2">
          <span>Quota Progress ({report.conversions}/{report.target || 5} Sales)</span>
          <span>{progress}%</span>
        </div>
        <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden border border-white/5" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
          <div 
            className="bg-gradient-to-r from-emerald-400 to-emerald-500 h-3 rounded-full transition-all duration-1000" 
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>

      <button 
        onClick={downloadPaystub}
        className="w-full mt-6 bg-white/10 hover:bg-white/20 text-white border border-white/20 font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2 focus:ring-2 focus:ring-indigo-400 outline-none"
      >
        <DownloadCloud size={20} /> Download PDF Paystub
      </button>
    </div>
  );
}
