export function extractCustomFields(data: FormData): Record<string, any> {
  const customFields: Record<string, any> = {};
  data.forEach((value, key) => {
    if (key.startsWith('cf_')) {
      const actualKey = key.replace('cf_', '');
      customFields[actualKey] = value;
    }
  });
  return customFields;
}
