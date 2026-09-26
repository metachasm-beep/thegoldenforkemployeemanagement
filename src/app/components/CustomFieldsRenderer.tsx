'use client';

import { CustomFieldDefinition } from '@/types';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/primitives";

export default function CustomFieldsRenderer({ 
  fields, 
  entityType,
  values = {} 
}: { 
  fields: CustomFieldDefinition[];
  entityType: 'LEAD' | 'EMPLOYEE';
  values?: Record<string, any>;
}) {
  const relevantFields = fields.filter(f => f.entityType === entityType);

  if (relevantFields.length === 0) return null;

  return (
    <div className="space-y-4 pt-4 border-t border-gray-100 dark:border-gray-800">
      <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Custom Fields</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {relevantFields.map((field) => (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={`cf_${field.name}`}>
              {field.label} {field.required && <span className="text-red-500">*</span>}
            </Label>
            
            {field.type === 'select' ? (
              <select 
                id={`cf_${field.name}`}
                name={`cf_${field.name}`} 
                required={field.required}
                defaultValue={values[field.name] || ''}
                className="w-full px-3 py-2 border rounded-xl dark:bg-gray-800 dark:border-gray-700 bg-white dark:text-gray-100"
              >
                <option value="" disabled>Select {field.label}</option>
                {field.options && JSON.parse(field.options).map((opt: string) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            ) : (
              <Input 
                type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'}
                id={`cf_${field.name}`}
                name={`cf_${field.name}`}
                required={field.required}
                defaultValue={values[field.name] || ''}
                placeholder={`Enter ${field.label}`}
              />
            )}
          </div>
        ))}
      </div>
      {/* Hidden input to signal the backend that custom fields are present and need to be parsed from cf_ prefix */}
      <input type="hidden" name="hasCustomFields" value="true" />
    </div>
  );
}
