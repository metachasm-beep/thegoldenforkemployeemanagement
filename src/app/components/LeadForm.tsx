'use client';

import { useRef } from 'react';
import { addLead } from '../actions';
import { Employee } from '@/types';
import SubmitButton from './SubmitButton';

export default function LeadForm({ employees }: { employees: Employee[] }) {
  const formRef = useRef<HTMLFormElement>(null);

  const handleSubmit = async (formData: FormData) => {
    await addLead(formData);
    formRef.current?.reset();
  };

  if (employees.length === 0) {
    return <p className="text-sm text-gray-500">Please add an employee first.</p>;
  }

  return (
    <form ref={formRef} action={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Employee</label>
        <select name="employeeId" required className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white">
          <option value="">Select an employee...</option>
          {employees.map(emp => (
            <option key={emp.id} value={emp.id}>{emp.name}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Stage</label>
        <select name="status" required className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white">
          <option value="Pending">Pending</option>
          <option value="Contacted">Contacted</option>
          <option value="Meeting Scheduled">Meeting Scheduled</option>
          <option value="Proposal Sent">Proposal Sent</option>
          <option value="Converted">Converted</option>
          <option value="Lost">Lost</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Assignee / POC Name</label>
        <input type="text" name="assignee" placeholder="John Doe" className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Follow-up Date</label>
        <input type="date" name="followUp" className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
        <textarea name="notes" placeholder="Had a great meeting..." className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none h-20"></textarea>
      </div>
      
      <SubmitButton text="Log Lead" loadingText="Saving..." className="w-full py-2.5" />
    </form>
  );
}


