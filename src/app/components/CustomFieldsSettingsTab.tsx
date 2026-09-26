'use client';

import { useState } from 'react';
import { CustomFieldDefinition } from '@/types';
import { createCustomFieldDefinition, deleteCustomFieldDefinition } from '@/services/customFieldService';
import { toast } from 'sonner';
import SubmitButton from './SubmitButton';
import { Trash2 } from 'lucide-react';

export default function CustomFieldsSettingsTab({ initialFields }: { initialFields: CustomFieldDefinition[] }) {
  const [fields, setFields] = useState<CustomFieldDefinition[]>(initialFields);
  const [loading, setLoading] = useState(false);

  async function handleCreate(formData: FormData) {
    setLoading(true);
    const data = {
      entityType: formData.get('entityType') as 'LEAD' | 'EMPLOYEE',
      name: formData.get('name') as string,
      label: formData.get('label') as string,
      type: formData.get('type') as 'text' | 'number' | 'date' | 'select',
      options: formData.get('options') as string || null,
      required: formData.get('required') === 'on'
    };

    if (data.type === 'select' && (!data.options || data.options.trim() === '')) {
      toast.error('Select type requires comma-separated options');
      setLoading(false);
      return;
    }
    
    if (data.options) {
        // Just comma split it to JSON
        data.options = JSON.stringify(data.options.split(',').map(s => s.trim()).filter(Boolean));
    }

    const res = await createCustomFieldDefinition(data);
    if (res.success) {
      toast.success('Custom field created!');
      // Optimistic update - requires hard reload to get exact ID, but close enough
      window.location.reload();
    } else {
      toast.error(res.error || 'Failed to create field');
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this field? Existing data will not be removed, but the field will no longer be visible.')) return;
    const res = await deleteCustomFieldDefinition(id);
    if (res.success) {
      toast.success('Field deleted');
      setFields(fields.filter(f => f.id !== id));
    } else {
      toast.error(res.error || 'Failed to delete field');
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-gray-700">
        <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-gray-200">Defined Custom Fields</h2>
        {fields.length === 0 ? (
          <p className="text-gray-500">No custom fields defined yet.</p>
        ) : (
          <div className="space-y-4">
            {fields.map(f => (
              <div key={f.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-100 dark:border-gray-700">
                <div>
                  <p className="font-bold text-gray-900 dark:text-gray-100">{f.label} <span className="text-xs font-mono text-gray-500 ml-2">{f.name}</span></p>
                  <p className="text-sm text-gray-500 mt-1">Applies to: <span className="font-semibold">{f.entityType}</span> | Type: <span className="font-semibold">{f.type}</span> {f.required && <span className="text-red-500 text-xs ml-1">(Required)</span>}</p>
                </div>
                <button onClick={() => handleDelete(f.id)} className="text-red-500 hover:bg-red-50 p-2 rounded-lg">
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-gray-700">
        <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-gray-200">Create New Custom Field</h2>
        <form action={handleCreate} className="space-y-4 max-w-xl">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Entity Type</label>
              <select name="entityType" className="w-full px-3 py-2 border rounded-xl dark:bg-gray-800 dark:border-gray-700" required>
                <option value="LEAD">Lead</option>
                <option value="EMPLOYEE">Employee</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Field Type</label>
              <select name="type" className="w-full px-3 py-2 border rounded-xl dark:bg-gray-800 dark:border-gray-700" required>
                <option value="text">Text (String)</option>
                <option value="number">Number</option>
                <option value="date">Date</option>
                <option value="select">Dropdown (Select)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">UI Label</label>
              <input name="label" type="text" placeholder="e.g. Industry" required className="w-full px-3 py-2 border rounded-xl dark:bg-gray-800 dark:border-gray-700" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Internal Key</label>
              <input name="name" type="text" placeholder="e.g. industry" required className="w-full px-3 py-2 border rounded-xl dark:bg-gray-800 dark:border-gray-700" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Options (if Dropdown)</label>
            <input name="options" type="text" placeholder="Tech, Finance, Food" className="w-full px-3 py-2 border rounded-xl dark:bg-gray-800 dark:border-gray-700" />
            <p className="text-xs text-gray-500 mt-1">Comma-separated list of options</p>
          </div>

          <div className="flex items-center gap-2">
            <input type="checkbox" name="required" id="req" className="rounded" />
            <label htmlFor="req" className="text-sm text-gray-700 dark:text-gray-300">Required field?</label>
          </div>

          <SubmitButton text="Create Field" />
        </form>
      </div>
    </div>
  );
}
