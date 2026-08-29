import jsPDF from 'jspdf';
import { SalaryReport } from '@/types';

export function generatePaystub(report: SalaryReport, month: string) {
  const doc = new jsPDF();

  doc.setFontSize(22);
  doc.text('THE GOLDEN FORK', 20, 20);
  
  doc.setFontSize(16);
  doc.text('Official Paystub', 20, 30);
  
  doc.setFontSize(12);
  doc.text(`Employee: ${report.employeeName}`, 20, 45);
  doc.text(`Employee ID: ${report.employeeId}`, 20, 52);
  doc.text(`Month: ${month}`, 20, 59);

  // Financial Breakdown
  doc.setFontSize(11);
  doc.text("Earnings Breakdown", 20, 75);
  doc.text("Base Payout", 30, 85);
  doc.text(`₹${report.baseSalary.toLocaleString()}`, 150, 85);
  
  doc.text("Performance Bonus", 30, 95);
  doc.text(`₹${report.commission.toLocaleString()}`, 150, 95);

  doc.setLineWidth(0.5);
  doc.line(20, 105, 190, 105);

  doc.setFontSize(14);
  doc.text("NET PAYOUT", 30, 115);
  doc.text(`₹${report.totalPayout.toLocaleString()}`, 150, 115);

  doc.setFontSize(9);
  doc.setTextColor(150, 150, 150);
  doc.text("This document serves as an official contractor paystub for The Golden Fork.", 20, 140);

  doc.save(`Paystub_${report.employeeName}_${month}.pdf`);
}

