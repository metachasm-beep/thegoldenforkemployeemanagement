'use client';
import { addExpense, addPTO } from '../actions';
import { useRef, useState } from 'react';
import toast from 'react-hot-toast';
import SubmitButton from './SubmitButton';

const EXPENSE_CAPS: Record<string, number> = {
  Travel: 50000,
  Meals: 5000,
  Software: 15000,
  Other: 10000
};

export default function ExpensePTOForms({ employeeId }: { employeeId: string }) {
  const expRef = useRef<HTMLFormElement>(null);
  const ptoRef = useRef<HTMLFormElement>(null);
  const [expAmount, setExpAmount] = useState('');
  const [category, setCategory] = useState('Travel');

  const cap = EXPENSE_CAPS[category];
  const isOverCap = Number(expAmount) > cap;

  const handleExpSubmit = async (formData: FormData) => {
    if (isOverCap) {
      toast.error(`Amount exceeds ${category} cap of ₹${cap.toLocaleString()}`);
      return;
    }
    
    // Prefix description with category
    const desc = formData.get('description');
    formData.set('description', `[${category}] ${desc}`);
    
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
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:p-8">
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
              <input type="date" name="date" required className="text-black dark:text-white w-full px-4 py-2 border dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none dark:bg-gray-800 dark:text-white" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
              <select 
                value={category} 
                onChange={e => setCategory(e.target.value)}
                className="w-full px-4 py-2 border dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none dark:bg-gray-800 dark:text-white"
              >
                {Object.keys(EXPENSE_CAPS).map(cat => (
                  <option key={cat} value={cat}>{cat} (Cap: ₹{EXPENSE_CAPS[cat].toLocaleString()})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex justify-between">
                Amount (₹)
                {isOverCap && <span className="text-red-500 text-xs font-bold">Exceeds Cap!</span>}
              </label>
              <input 
                type="number" step="0.01" name="amount" required 
                value={expAmount} onChange={e => setExpAmount(e.target.value)} 
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 outline-none dark:bg-gray-800 dark:text-white ${isOverCap ? 'border-red-500 focus:ring-red-500 bg-red-50 dark:bg-red-900/20' : 'dark:border-gray-700 focus:ring-blue-500'}`} 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
              <input type="text" name="description" required placeholder="Client lunch..." className="text-black dark:text-white w-full px-4 py-2 border dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none dark:bg-gray-800 dark:text-white" />
            </div>
            <SubmitButton 
              text="Submit Expense" 
              loadingText="Submitting..." 
              disabled={isOverCap} 
              className="w-full py-2.5" 
            />
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
              <input type="date" name="startDate" required className="text-black dark:text-white w-full px-4 py-2 border dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none dark:bg-gray-800 dark:text-white" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">End Date</label>
              <input type="date" name="endDate" required className="text-black dark:text-white w-full px-4 py-2 border dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none dark:bg-gray-800 dark:text-white" />
            </div>
            <SubmitButton 
              text="Submit Request" 
              loadingText="Submitting..." 
              className="w-full py-2.5" 
            />
          </form>
        </details>
      </section>
    </div>
  );
}
