'use client';

import { addExpense, addPTO } from '../actions';
import { useRef } from 'react';
import { Employee } from '@/types';

export default function ExpensePTOForms({ employeeId }: { employeeId: string }) {
  const expRef = useRef<HTMLFormElement>(null);
  const ptoRef = useRef<HTMLFormElement>(null);

  const handleExpSubmit = async (formData: FormData) => {
    formData.append('employeeId', employeeId);
    await addExpense(formData);
    expRef.current?.reset();
  };

  const handlePTOSubmit = async (formData: FormData) => {
    formData.append('employeeId', employeeId);
    await addPTO(formData);
    ptoRef.current?.reset();
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      {/* Expense Form */}
      <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h2 className="text-xl font-semibold mb-6 border-b pb-2">Log Business Expense</h2>
        <form ref={expRef} action={handleExpSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
            <input type="date" name="date" required className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Amount ($)</label>
            <input type="number" step="0.01" name="amount" required className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <input type="text" name="description" required placeholder="Client lunch..." className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
          <button type="submit" className="w-full bg-gray-900 text-white font-medium py-2.5 rounded-lg hover:bg-gray-800 transition-colors">
            Submit Expense
          </button>
        </form>
      </section>

      {/* PTO Form */}
      <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h2 className="text-xl font-semibold mb-6 border-b pb-2">Request PTO</h2>
        <form ref={ptoRef} action={handlePTOSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <input type="date" name="startDate" required className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <input type="date" name="endDate" required className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
          <button type="submit" className="w-full bg-gray-900 text-white font-medium py-2.5 rounded-lg hover:bg-gray-800 transition-colors">
            Submit Request
          </button>
        </form>
      </section>
    </div>
  );
}
