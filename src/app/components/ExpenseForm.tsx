'use client';
import { addExpense } from '../actions';
import { useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import SubmitButton from './SubmitButton';

const EXPENSE_CAPS: Record<string, number> = {
  Travel: 50000,
  Meals: 5000,
  Software: 15000,
  Other: 10000
};

export default function ExpenseForm({ employeeId }: { employeeId: string }) {
  const expRef = useRef<HTMLFormElement>(null);
  const [expAmount, setExpAmount] = useState('');
  const [category, setCategory] = useState('Travel');
  const router = useRouter();

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
    router.push('/');
    router.refresh();
  };

  return (
    <form ref={expRef} action={handleExpSubmit} className="space-y-6 mt-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date</label>
        <input type="date" name="date" required className="text-black dark:text-white w-full px-4 py-2 border dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none dark:bg-gray-800" />
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
        <input type="text" name="description" required placeholder="Client lunch..." className="text-black dark:text-white w-full px-4 py-2 border dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none dark:bg-gray-800" />
      </div>
      <SubmitButton 
        text="Submit Expense" 
        loadingText="Submitting..." 
        disabled={isOverCap} 
        className="w-full py-3 text-base" 
      />
    </form>
  );
}
