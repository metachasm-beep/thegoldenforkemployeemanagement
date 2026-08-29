/**
 * Sheets Adapter — the single seam between the app and Google Sheets.
 *
 * All data access goes through this module. Swapping the backend
 * (e.g. to Supabase or Postgres) is a one-file change here.
 */

const getAppsScriptUrl = (): string => {
  const url = process.env.APPS_SCRIPT_URL;
  if (!url) throw new Error('APPS_SCRIPT_URL environment variable is not set.');
  return url;
};

/**
 * Fetch a list of rows from the Sheets backend.
 * Returns an empty array on any error — callers never crash.
 */
export async function sheetsGet<T = unknown[]>(action: string): Promise<T[]> {
  const res = await fetch(`${getAppsScriptUrl()}?action=${action}`, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Sheets GET failed for action: ${action} (${res.status})`);
  const data = await res.json();
  return data ?? [];
}

/**
 * Post a mutation to the Sheets backend.
 * Returns { success: true } on success.
 */
export async function sheetsPost(
  action: string,
  payload: Record<string, unknown> = {}
): Promise<{ success: boolean }> {
  const res = await fetch(getAppsScriptUrl(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, ...payload }),
  });
  if (!res.ok) throw new Error(`Sheets POST failed for action: ${action} (${res.status})`);
  return res.json();
}
