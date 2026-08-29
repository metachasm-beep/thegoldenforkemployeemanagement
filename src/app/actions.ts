'use server';

import { Employee, Lead, SalaryReport } from '@/types';
import { calculateMonthlyCompensation } from '@/lib/compensation';
import { revalidatePath } from 'next/cache';

const getAppsScriptUrl = () => {
  const url = process.env.APPS_SCRIPT_URL;
  if (!url) {
    throw new Error('APPS_SCRIPT_URL environment variable is not set.');
  }
  return url;
};

// -- EMPLOYEES --

export async function getEmployees(): Promise<Employee[]> {
  try {
    const res = await fetch(`${getAppsScriptUrl()}?action=getEmployees`, { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to fetch employees');
    
    const rows = await res.json();
    if (!rows || rows.length === 0) return [];

    return rows.map((row: any) => ({
      id: row[0],
      name: row[1],
      role: row[2],
      email: row[3],
      startDate: row[4],
      baseSalary: parseFloat(row[5]) || 0,
      commissionRate: parseFloat(row[6]) || 0,
      target: parseInt(row[7]) || 5,
      probationDuration: parseInt(row[8]) || 1,
      managerId: row[9] || undefined,
    }));
  } catch (error) {
    console.error('Error fetching employees:', error);
    return [];
  }
}

export async function addEmployee(data: FormData) {
  try {
    const newEmployee = [
      Date.now().toString(), // ID
      data.get('name') as string,
      data.get('role') as string,
      data.get('email') as string,
      new Date().toISOString().split('T')[0], // StartDate
      data.get('baseSalary') as string,
      data.get('commissionRate') as string,
      data.get('target') as string || '5',
      data.get('probationDuration') as string || '1',
      data.get('managerId') as string || '',
      data.get('password') as string, // Will be intercepted by apps script
    ];

    const res = await fetch(getAppsScriptUrl(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'addEmployee', data: newEmployee })
    });

    if (!res.ok) throw new Error('Failed to add employee');

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
    const res = await fetch(`${getAppsScriptUrl()}?action=getLeads`, { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to fetch leads');

    const rows = await res.json();
    if (!rows || rows.length === 0) return [];

    return rows.map((row: any) => ({
      leadId: String(row[0]),
      employeeId: String(row[1]),
      date: row[2],
      status: row[3],
      notes: row[4],
      followUp: row[5],
      assignee: row[6],
    }));
  } catch (error) {
    console.error('Error fetching leads:', error);
    return [];
  }
}

export async function addLead(data: FormData) {
  try {
    const newLead = [
      Date.now().toString(), // LeadID
      data.get('employeeId') as string,
      new Date().toISOString().split('T')[0], // Date (YYYY-MM-DD)
      data.get('status') as string, // Stage
      data.get('notes') as string || '',
      data.get('followUp') as string || '',
      data.get('assignee') as string || '',
    ];

    const res = await fetch(getAppsScriptUrl(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'addLead', data: newLead })
    });

    if (!res.ok) throw new Error('Failed to add lead');

    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error('Error adding lead:', error);
    return { success: false, error: 'Failed to add lead' };
  }
}

export async function updateLead(leadId: string, updates: Partial<Lead>) {
  try {
    const res = await fetch(getAppsScriptUrl(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'updateLead', leadId, updates })
    });

    if (!res.ok) throw new Error('Failed to update lead');

    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error('Error updating lead:', error);
    return { success: false, error: 'Failed to update lead' };
  }
}

export async function addExpense(data: FormData) {
  try {
    const newExpense = [
      Date.now().toString(),
      data.get('employeeId') as string,
      data.get('date') as string,
      data.get('amount') as string,
      data.get('description') as string,
      'Pending'
    ];
    const res = await fetch(getAppsScriptUrl(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'addExpense', data: newExpense })
    });
    if (!res.ok) throw new Error();
    revalidatePath('/');
    return { success: true };
  } catch (error) {
    return { success: false };
  }
}

export async function getExpenses() {
  try {
    const res = await fetch(`${getAppsScriptUrl()}?action=getExpenses`, { cache: 'no-store' });
    if (!res.ok) throw new Error();
    const rows = await res.json();
    return rows.map((r: any) => ({
      expenseId: r[0], employeeId: r[1], date: r[2], amount: r[3], description: r[4], status: r[5]
    }));
  } catch (e) {
    return [];
  }
}

export async function addPTO(data: FormData) {
  try {
    const newPTO = [
      Date.now().toString(),
      data.get('employeeId') as string,
      data.get('startDate') as string,
      data.get('endDate') as string,
      'Pending'
    ];
    const res = await fetch(getAppsScriptUrl(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'addPTO', data: newPTO })
    });
    if (!res.ok) throw new Error();
    revalidatePath('/');
    return { success: true };
  } catch (error) {
    return { success: false };
  }
}

export async function getPTO() {
  try {
    const res = await fetch(`${getAppsScriptUrl()}?action=getPTO`, { cache: 'no-store' });
    if (!res.ok) throw new Error();
    const rows = await res.json();
    return rows.map((r: any) => ({
      ptoId: r[0], employeeId: r[1], startDate: r[2], endDate: r[3], status: r[4]
    }));
  } catch (e) {
    return [];
  }
}

// -- SALARY REPORTS --

export async function generateSalaryReport(): Promise<SalaryReport[]> {
  const employees = await getEmployees();
  const leads = await getLeads();

  return employees.map(emp => {
    const conversions = leads.filter(
      l => l.employeeId === emp.id && l.status === 'Converted'
    ).length;

    // Probation Math (Auto Relegation)
    const startDate = new Date(emp.startDate).getTime();
    const probationEnd = startDate + (emp.probationDuration * 30 * 24 * 60 * 60 * 1000); // Rough month estimate
    let isMonthOne = Date.now() < probationEnd;

    // Auto-relegate if they missed their target after probation!
    if (!isMonthOne && conversions < emp.target) {
      isMonthOne = true; 
    }

    const compensation = calculateMonthlyCompensation(
      conversions,
      isMonthOne, // Uses the auto-relegation math
      0      // previousCumulativeSales
    );

    return {
      employeeId: emp.id,
      employeeName: emp.name,
      baseSalary: compensation.basePayout, // Using calculated base
      conversions,
      commission: compensation.performanceBonus + compensation.milestoneBonus,
      totalPayout: compensation.totalPayout,
      target: emp.target
    };
  });
}

export async function getSystemSettings(): Promise<Record<string, string>> {
  try {
    const res = await fetch(`${getAppsScriptUrl()}?action=getSettings`, { cache: 'no-store' });
    if (!res.ok) return {};
    const rows = await res.json();
    const settings: Record<string, string> = {};
    rows.forEach((row: any) => {
      settings[row[0]] = row[1];
    });
    return settings;
  } catch (e) {
    return {};
  }
}

export async function updateSystemSetting(key: string, value: string) {
  try {
    const res = await fetch(getAppsScriptUrl(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'updateSetting', key, value })
    });
    if (!res.ok) throw new Error();
    revalidatePath('/');
    return { success: true };
  } catch (e) {
    return { success: false };
  }
}

export async function triggerExportAudit() {
  try {
    await fetch(getAppsScriptUrl(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'exportAudit' })
    });
    return { success: true };
  } catch (e) {
    return { success: false };
  }
}

export async function offboardEmployee(employeeId: string) {
  try {
    const res = await fetch(getAppsScriptUrl(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'offboardEmployee', employeeId })
    });
    if (!res.ok) throw new Error();
    revalidatePath('/team');
    return { success: true };
  } catch (e) {
    return { success: false };
  }
}


