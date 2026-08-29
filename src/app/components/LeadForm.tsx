'use client';

import { useRef, useState } from 'react';
import { addLead } from '../actions';
import { Employee } from '@/types';

export default function LeadForm({ employees }: { employees: Employee[] }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    await addLead(formData);
    formRef.current?.reset();
    setLoading(false);
  }

  if (employees.length === 0) {
    return <p className="text-sm text-gray-500">Please add an employee first.</p>;
  }

  return (
    <form ref={formRef} action={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Employee</label>
        <select name="employeeId" required className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500">
          <option value="">Select an employee...</option>
          {employees.map(emp => (
            <option key={emp.id} value={emp.id}>{emp.name}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Status</label>
        <select name="status" required className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500">
          <option value="Pending">Pending</option>
          <option value="Converted">Converted</option>
        </select>
      </div>
      <button 
        type="submit" 
        disabled={loading}
        className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50"
      >
        {loading ? 'Logging...' : 'Log Lead'}
      </button>
    </form>
  );
}
