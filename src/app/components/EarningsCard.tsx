import { SalaryReport } from '@/types';
import jsPDF from 'jspdf';
import { Target, DownloadCloud } from 'lucide-react';
import { useCallback, useMemo } from 'react';

export default function EarningsCard({ report }: { report: SalaryReport }) {
  const downloadPaystub = useCallback(() => {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(24);
    doc.setTextColor(15, 23, 42); // Slate 900
    doc.text("METACHASM ENTERPRISES", 105, 20, { align: "center" });
    
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text("Parent Company of The Golden Fork", 105, 26, { align: "center" });

    doc.setFontSize(14);
    doc.setTextColor(30, 41, 59);
    doc.text("OFFICIAL PAYSTUB & INVOICE STATEMENT", 105, 36, { align: "center" });

    doc.setLineWidth(0.5);
    doc.line(20, 42, 190, 42);

    // Company Details
    doc.setFontSize(10);
    doc.setTextColor(71, 85, 105);
    doc.text("Company PAN: DRPPM2400H", 20, 50);
    doc.text(`Date Generated: ${new Date().toLocaleDateString()}`, 190, 50, { align: "right" });

    // Contractor Details
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.text("Contractor Information", 20, 65);
    
    doc.setFontSize(10);
    doc.setTextColor(71, 85, 105);
    doc.text(`Name: ${report.employeeName}`, 20, 72);
    doc.text(`ID Reference: ${report.employeeId}`, 20, 78);
    doc.text(`Contractor PAN: ${report.panNumber || 'Not Provided'}`, 20, 84);
    doc.text(`Contractor Aadhaar: ${report.aadhaarNumber || 'Not Provided'}`, 20, 90);

    doc.setLineWidth(0.2);
    doc.line(20, 96, 190, 96);

    // Financial Breakdown
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.text("Earnings Breakdown", 20, 108);
    
    doc.setFontSize(10);
    doc.setTextColor(71, 85, 105);
    doc.text("Description", 20, 116);
    doc.text("Amount (INR)", 190, 116, { align: "right" });
    
    doc.setLineWidth(0.1);
    doc.line(20, 119, 190, 119);

    doc.text("Base Fee", 20, 126);
    doc.text(`Rs. ${report.baseSalary.toLocaleString()}`, 190, 126, { align: "right" });
    
    doc.text("Performance Bonuses", 20, 134);
    doc.text(`Rs. ${report.commission.toLocaleString()}`, 190, 134, { align: "right" });
    
    doc.text("Total Sales Conversions", 20, 142);
    doc.text(`${report.conversions}`, 190, 142, { align: "right" });

    // Total Line
    doc.setLineWidth(0.5);
    doc.line(20, 150, 190, 150);
    
    doc.setFontSize(14);
    doc.setTextColor(15, 23, 42);
    doc.text("NET PAYOUT:", 20, 160);
    doc.text(`Rs. ${report.totalPayout.toLocaleString()}`, 190, 160, { align: "right" });

    doc.setLineWidth(0.2);
    doc.line(20, 166, 190, 166);

    // Invoice Section
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.text("Submitted Invoice Reference", 20, 178);

    doc.setFontSize(10);
    doc.setTextColor(71, 85, 105);
    
    if (report.invoiceLink) {
      doc.text("The contractor has provided the following invoice for this billing cycle:", 20, 185);
      
      // Split URL into multiple lines if it's too long
      doc.setTextColor(37, 99, 235); // Blue link color
      const splitUrl = doc.splitTextToSize(report.invoiceLink, 170);
      doc.text(splitUrl, 20, 193);
    } else {
      doc.text("No invoice provided for this billing cycle.", 20, 185);
      doc.text("Please submit your Google Sheet invoice link via the dashboard.", 20, 191);
    }

    // Footer
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text("This is an electronically generated document and does not require a physical signature.", 105, 280, { align: "center" });
    doc.text("Confidential - For intended recipient only.", 105, 285, { align: "center" });

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
          <span>{Math.round(progress)}%</span>
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
