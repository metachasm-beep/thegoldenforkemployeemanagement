'use server';

import { Employee, Lead, SalaryReport } from '@/types';
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
    const newEmployee = [
      Date.now().toString(), // ID
      data.get('name') as string,
      data.get('role') as string,
      data.get('email') as string,
      data.get('baseSalary') as string,
      data.get('commissionRate') as string,
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
      status: row[3] as 'Pending' | 'Converted',
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
      data.get('status') as string, // 'Pending' or 'Converted'
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

export async function markLeadConverted(leadId: string) {
  try {
    const res = await fetch(getAppsScriptUrl(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'convertLead', leadId })
    });

    if (!res.ok) throw new Error('Failed to update lead');

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
