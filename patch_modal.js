const fs = require('fs');
let code = fs.readFileSync('src/app/components/AuditLogsWidget.tsx', 'utf8');

const oldModalContent = `              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Payload JSON</p>
                <div className="bg-slate-950 rounded-xl p-4 overflow-x-auto">
                  <pre className="text-xs text-green-400 font-mono leading-relaxed">
                    {(() => {
                      try {
                        return JSON.stringify(JSON.parse(selectedLog.details), null, 2);
                      } catch {
                        return selectedLog.details;
                      }
                    })()}
                  </pre>
                </div>
              </div>`;

const newModalContent = `              {(() => {
                let parsed: any = null;
                try {
                  parsed = JSON.parse(selectedLog.details);
                } catch {}

                return (
                  <>
                    {parsed?.leadDetails && (
                      <div className="mb-4">
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Lead Snapshot</p>
                        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 border border-gray-100 dark:border-gray-700">
                          <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-sm">
                            <div>
                              <span className="text-gray-500 dark:text-gray-400 block text-xs">Assignee</span>
                              <span className="font-medium text-gray-900 dark:text-white">{parsed.leadDetails.assignee || '—'}</span>
                            </div>
                            <div>
                              <span className="text-gray-500 dark:text-gray-400 block text-xs">Status</span>
                              <span className="font-medium text-gray-900 dark:text-white">{parsed.leadDetails.status || '—'}</span>
                            </div>
                            <div>
                              <span className="text-gray-500 dark:text-gray-400 block text-xs">Owner</span>
                              <span className="font-medium text-gray-900 dark:text-white">{getEmployeeName(parsed.leadDetails.employeeId)}</span>
                            </div>
                            <div>
                              <span className="text-gray-500 dark:text-gray-400 block text-xs">Date</span>
                              <span className="font-medium text-gray-900 dark:text-white">{parsed.leadDetails.date || '—'}</span>
                            </div>
                            {parsed.leadDetails.notes && (
                              <div className="col-span-2">
                                <span className="text-gray-500 dark:text-gray-400 block text-xs">Notes</span>
                                <span className="text-gray-700 dark:text-gray-300 italic">"{parsed.leadDetails.notes}"</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Raw Payload JSON</p>
                      <div className="bg-slate-950 rounded-xl p-4 overflow-x-auto">
                        <pre className="text-xs text-green-400 font-mono leading-relaxed">
                          {parsed ? JSON.stringify(parsed, null, 2) : selectedLog.details}
                        </pre>
                      </div>
                    </div>
                  </>
                );
              })()}`;

code = code.replace(oldModalContent, newModalContent);
fs.writeFileSync('src/app/components/AuditLogsWidget.tsx', code);
console.log("Patched AuditLogsWidget.tsx");
