'use server';

import { google } from 'googleapis';
import { prisma } from '@/lib/prisma';
import { derivePayrollContext } from '@/lib/payroll';
import { calculateMonthlyCompensation } from '@/lib/compensation';
import { getEmployees } from '@/lib/db/employees';
import { getLeads } from '@/lib/db/leads';

export async function generateAndStoreInvoice(employeeId: string, month: string) {
  try {
    // 1. Calculate payroll data for the month
    const employees = await getEmployees();
    const leads = await getLeads();
    
    const emp = employees.find(e => e.id === employeeId);
    if (!emp) throw new Error('Employee not found');

    const [year, monthNum] = month.split('-');
    // Create a date in the middle of the target month
    const targetDate = new Date(parseInt(year), parseInt(monthNum) - 1, 15);

    const { conversions, lastMonthSales, teamSales, isMonthOne } = derivePayrollContext(
      emp,
      leads,
      employees,
      targetDate
    );

    const compensation = calculateMonthlyCompensation(
      conversions,
      isMonthOne,
      0,
      lastMonthSales,
      teamSales
    );

    // 2. Prepare Google Sheets Data
    const rowData = [
      month, // Month
      emp.name, // Name
      (emp as any).panNumber || 'N/A', // PAN
      (emp as any).aadhaarNumber || 'N/A', // Aadhaar
      conversions.toString(), // Conversions
      compensation.basePayout.toString(), // Base Salary
      (compensation.performanceBonus + compensation.milestoneBonus + compensation.leadershipBonus).toString(), // Total Bonus
      compensation.totalPayout.toString(), // Net Payout
      new Date().toISOString() // Generated At
    ];

    // 3. Connect to Google Sheets
    const credentialsBase64 = process.env.GOOGLE_SERVICE_ACCOUNT_JSON_BASE64;
    const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
    const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');

    let auth;
    
    if (credentialsBase64) {
      const credentials = JSON.parse(Buffer.from(credentialsBase64, 'base64').toString('utf-8'));
      auth = new google.auth.GoogleAuth({
        credentials,
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
      });
    } else if (clientEmail && privateKey) {
      auth = new google.auth.GoogleAuth({
        credentials: {
          client_email: clientEmail,
          private_key: privateKey,
        },
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
      });
    } else {
      throw new Error('Google Sheets credentials missing. Please configure GOOGLE_CLIENT_EMAIL and GOOGLE_PRIVATE_KEY in .env, and share your sheet with the client email.');
    }

    const sheets = google.sheets({ version: 'v4', auth });
    const spreadsheetId = '1KfrhCvh9ENdLq8pkkDb42wPiQJfyVPd9tDTwHzX3g2A';

    // 4. Append to Sheet
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: 'Sheet1!A1', 
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [rowData],
      },
    });

    // 5. Store in local DB
    await prisma.invoice.create({
      data: {
        employeeId,
        month,
        sheetUrl: `https://docs.google.com/spreadsheets/d/${spreadsheetId}`,
        amount: compensation.totalPayout,
        status: 'Generated & Stored in Google Sheets'
      }
    });

    return { success: true };
  } catch (error: any) {
    console.error('Invoice Generation Error:', error);
    return { success: false, error: error.message };
  }
}
