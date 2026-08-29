'use client';
import { addExpense, addPTO } from '../actions';
import { useRef, useState } from 'react';
import { Employee } from '@/types';
import toast from 'react-hot-toast';

export default function ExpensePTOForms({ employeeId }: { employeeId: string }) {
  const expRef = useRef<HTMLFormElement>(null);
  const ptoRef = useRef<HTMLFormElement>(null);
  const [expAmount, setExpAmount] = useState('');

  const handleExpSubmit = async (formData: FormData) => {
    formData.append('employeeId', employeeId);
    await addExpense(formData);
    expRef.current?.reset();
    setExpAmount('');
    toast.success('Expense Logged Successfully!');
  };

  const handlePTOSubmit = async (formData: FormData) => {
    formData.append('employeeId', employeeId);
    await addPTO(formData);
    ptoRef.current?.reset();
    toast.success('PTO Requested!');
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      {/* Expense Form */}
      <section className="bg-white/80 dark:bg-gray-900/50 backdrop-blur-xl p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800">
        <details className="group">
          <summary className="text-xl font-bold text-gray-800 dark:text-gray-100 flex justify-between items-center cursor-pointer list-none">
            Log Business Expense
            <span className="transition group-open:rotate-180">
              <svg fill="none" height="24" shapeRendering="geometricPrecision" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="24"><path d="M6 9l6 6 6-6"></path></svg>
            </span>
          </summary>
          <form ref={expRef} action={handleExpSubmit} className="space-y-4 mt-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date</label>
              <input type="date" name="date" required className="w-full px-4 py-2 border dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none dark:bg-gray-800 dark:text-white" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex justify-between">
                Amount (₹)
                {expAmount && Number(expAmount) > 0 && <span className="text-green-500 text-xs font-bold">Valid Format ✓</span>}
              </label>
              <input type="number" step="0.01" name="amount" required value={expAmount} onChange={e => setExpAmount(e.target.value)} className={`w-full px-4 py-2 border rounded-lg focus:ring-2 outline-none dark:bg-gray-800 dark:text-white ${expAmount && Number(expAmount) <= 0 ? 'border-red-500 focus:ring-red-500' : 'dark:border-gray-700 focus:ring-blue-500'}`} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
              <input type="text" name="description" required placeholder="Client lunch..." className="w-full px-4 py-2 border dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none dark:bg-gray-800 dark:text-white" />
            </div>
            <button type="submit" className="w-full bg-indigo-600 text-white font-medium py-2.5 rounded-lg hover:bg-indigo-700 transition-colors">
              Submit Expense
            </button>
          </form>
        </details>
      </section>

      {/* PTO Form */}
      <section className="bg-white/80 dark:bg-gray-900/50 backdrop-blur-xl p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800">
        <details className="group">
          <summary className="text-xl font-bold text-gray-800 dark:text-gray-100 flex justify-between items-center cursor-pointer list-none">
            Request PTO
            <span className="transition group-open:rotate-180">
              <svg fill="none" height="24" shapeRendering="geometricPrecision" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="24"><path d="M6 9l6 6 6-6"></path></svg>
            </span>
          </summary>
          <form ref={ptoRef} action={handlePTOSubmit} className="space-y-4 mt-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Start Date</label>
              <input type="date" name="startDate" required className="w-full px-4 py-2 border dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none dark:bg-gray-800 dark:text-white" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">End Date</label>
              <input type="date" name="endDate" required className="w-full px-4 py-2 border dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none dark:bg-gray-800 dark:text-white" />
            </div>
            <button type="submit" className="w-full bg-indigo-600 text-white font-medium py-2.5 rounded-lg hover:bg-indigo-700 transition-colors">
              Submit Request
            </button>
          </form>
        </details>
      </section>
    </div>
  );
}


