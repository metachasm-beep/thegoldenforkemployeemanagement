'use client';
import { SalaryReport } from '@/types';
import jsPDF from 'jspdf';
import { DownloadCloud } from 'lucide-react';
import { useCallback } from 'react';

export default function DownloadPaystubButton({ report }: { report: SalaryReport }) {
  const downloadPaystub = useCallback(() => {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(24);
    doc.setTextColor(15, 23, 42);
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
    
    // Aadhaar Masking for Indian DPDP compliance
    let maskedAadhaar = 'Not Provided';
    if (report.aadhaarNumber && report.aadhaarNumber.length >= 4) {
      maskedAadhaar = `XXXX-XXXX-${report.aadhaarNumber.slice(-4)}`;
    }
    doc.text(`Contractor Aadhaar: ${maskedAadhaar}`, 20, 90);

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
    doc.text("System Generated Invoice Record", 20, 178);

    doc.setFontSize(10);
    doc.setTextColor(71, 85, 105);
    
    if (report.invoiceId) {
      doc.text("An official invoice has been recorded in the Golden Fork system.", 20, 185);
      doc.text(`Invoice ID Reference: ${report.invoiceId}`, 20, 193);
      doc.text("This ID can be used for financial tracking and audit purposes.", 20, 199);
    } else {
      doc.text("No invoice record found for this billing cycle.", 20, 185);
      doc.text("Please use the 'Generate Invoice' portal on your dashboard.", 20, 191);
    }

    // Footer
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text("This is an electronically generated document and does not require a physical signature.", 105, 280, { align: "center" });
    doc.text("Confidential - For intended recipient only.", 105, 285, { align: "center" });

    doc.save(`paystub_${report.employeeName.replace(/\s+/g, '_')}.pdf`);
  }, [report]);

  return (
    <button 
      onClick={downloadPaystub}
      className="w-full mt-6 bg-blue-50 dark:bg-white/10 hover:bg-blue-100 dark:hover:bg-white/20 text-blue-600 dark:text-white border border-blue-200 dark:border-white/20 font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2 focus:ring-2 focus:ring-blue-400 outline-none"
    >
      <DownloadCloud size={20} /> Download PDF Paystub
    </button>
  );
}
