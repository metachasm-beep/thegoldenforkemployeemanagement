import jsPDF from 'jspdf';
import { SalaryReport } from '@/types';

export function generatePaystub(report: SalaryReport, month: string) {
  const doc = new jsPDF();

  doc.setFontSize(22);
  doc.text('METACHASM ENTERPRISES', 20, 20);
  
  doc.setFontSize(16);
  doc.text('Official Paystub', 20, 30);
  
  doc.setFontSize(12);
  doc.text(`Employee: ${report.employeeName}`, 20, 45);
  doc.text(`Employee ID: ${report.employeeId}`, 20, 52);
  doc.text(`Month: ${month}`, 20, 59);
  
  doc.line(20, 65, 190, 65);
  
  doc.text('Earnings', 20, 75);
  
  doc.text('Base Service Fee:', 20, 85);
  doc.text(`$${report.baseSalary.toLocaleString()}`, 150, 85);
  
  doc.text(`Performance Commission (${report.conversions} sales):`, 20, 95);
  doc.text(`$${report.commission.toLocaleString()}`, 150, 95);
  
  doc.line(20, 105, 190, 105);
  
  doc.setFontSize(14);
  doc.text('Net Payout:', 20, 115);
  doc.text(`$${report.totalPayout.toLocaleString()}`, 150, 115);
  
  doc.setFontSize(10);
  doc.text('Generated automatically by the Employee Management System', 20, 280);
  
  doc.save(`Paystub_${report.employeeName}_${month}.pdf`);
}
