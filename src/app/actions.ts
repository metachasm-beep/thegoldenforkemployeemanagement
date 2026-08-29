'use server';

import { getGoogleSheetsClient, SPREADSHEET_ID } from '@/lib/google-sheets';
import { Employee, Lead, SalaryReport } from '@/types';
import { revalidatePath } from 'next/cache';

// -- EMPLOYEES --

export async function getEmployees(): Promise<Employee[]> {
  try {
    const sheets = await getGoogleSheetsClient();
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Employees!A2:F',
    });

    const rows = response.data.values;
    if (!rows || rows.length === 0) return [];

    return rows.map((row) => ({
      id: row[0],
      name: row[1],
      role: row[2],
      email: row[3],
      baseSalary: parseFloat(row[4]) || 0,
      commissionRate: parseFloat(row[5]) || 0,
    }));
  } catch (error) {
    console.error('Error fetching employees:', error);
    return [];
  }
}

export async function addEmployee(data: FormData) {
  try {
    const sheets = await getGoogleSheetsClient();
    
    const newEmployee = [
      Date.now().toString(), // ID
      data.get('name') as string,
      data.get('role') as string,
      data.get('email') as string,
      data.get('baseSalary') as string,
      data.get('commissionRate') as string,
    ];

    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Employees!A2:F',
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [newEmployee],
      },
    });

    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error('Error adding employee:', error);
    return { success: false, error: 'Failed to add employee' };
  }
}

// -- LEADS & CONVERSIONS --

export async function getLeads(): Promise<Lead[]> {
  try {
    const sheets = await getGoogleSheetsClient();
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Leads!A2:D',
    });

    const rows = response.data.values;
    if (!rows || rows.length === 0) return [];

    return rows.map((row) => ({
      leadId: row[0],
      employeeId: row[1],
      date: row[2],
      status: row[3] as 'Pending' | 'Converted',
    }));
  } catch (error) {
    console.error('Error fetching leads:', error);
    return [];
  }
}

export async function addLead(data: FormData) {
  try {
    const sheets = await getGoogleSheetsClient();
    
    const newLead = [
      Date.now().toString(), // LeadID
      data.get('employeeId') as string,
      new Date().toISOString().split('T')[0], // Date (YYYY-MM-DD)
      data.get('status') as string, // 'Pending' or 'Converted'
    ];

    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Leads!A2:D',
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [newLead],
      },
    });

    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error('Error adding lead:', error);
    return { success: false, error: 'Failed to add lead' };
  }
}

export async function markLeadConverted(leadId: string) {
  try {
    const sheets = await getGoogleSheetsClient();
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Leads!A:D',
    });

    const rows = response.data.values;
    if (!rows) return { success: false };

    // Find the row to update (adding 1 because rows are 0-indexed but Sheets are 1-indexed)
    const rowIndex = rows.findIndex(row => row[0] === leadId);
    if (rowIndex === -1) return { success: false, error: 'Lead not found' };

    const sheetRowNumber = rowIndex + 1;

    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `Leads!D${sheetRowNumber}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [['Converted']],
      },
    });

    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error('Error updating lead:', error);
    return { success: false, error: 'Failed to update lead' };
  }
}

// -- SALARY REPORTS --

export async function generateSalaryReport(): Promise<SalaryReport[]> {
  const employees = await getEmployees();
  const leads = await getLeads();

  return employees.map(emp => {
    // Count successful conversions for this employee
    const conversions = leads.filter(
      l => l.employeeId === emp.id && l.status === 'Converted'
    ).length;

    const commission = conversions * emp.commissionRate;
    const totalPayout = emp.baseSalary + commission;

    return {
      employeeId: emp.id,
      employeeName: emp.name,
      baseSalary: emp.baseSalary,
      conversions,
      commission,
      totalPayout
    };
  });
}
