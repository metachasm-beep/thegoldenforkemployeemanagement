const SLACK_WEBHOOK_URL = ''; // User to fill this
const MANAGER_EMAIL = ''; // User to fill this

function doGet(e) {
  const action = e.parameter.action;
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  const getSheetData = (sheetName) => {
    const sheet = ss.getSheetByName(sheetName);
    if (!sheet) return [];
    const data = sheet.getDataRange().getValues();
    if (data.length > 0) data.shift(); // remove header
    return data;
  };
  
  if (action === 'getEmployees') return ContentService.createTextOutput(JSON.stringify(getSheetData('Employees'))).setMimeType(ContentService.MimeType.JSON);
  if (action === 'getLeads') return ContentService.createTextOutput(JSON.stringify(getSheetData('Leads'))).setMimeType(ContentService.MimeType.JSON);
  if (action === 'getUsers') return ContentService.createTextOutput(JSON.stringify(getSheetData('Users'))).setMimeType(ContentService.MimeType.JSON);
  if (action === 'getExpenses') return ContentService.createTextOutput(JSON.stringify(getSheetData('Expenses'))).setMimeType(ContentService.MimeType.JSON);
  if (action === 'getPTO') return ContentService.createTextOutput(JSON.stringify(getSheetData('PTO'))).setMimeType(ContentService.MimeType.JSON);
  if (action === 'getAuditLog') return ContentService.createTextOutput(JSON.stringify(getSheetData('AuditLog'))).setMimeType(ContentService.MimeType.JSON);
  if (action === 'getSettings') return ContentService.createTextOutput(JSON.stringify(getSheetData('Settings'))).setMimeType(ContentService.MimeType.JSON);

  return ContentService.createTextOutput(JSON.stringify({error: "Invalid action"})).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let payload;
  try {
    payload = JSON.parse(e.postData.contents);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({error: "Invalid JSON payload"})).setMimeType(ContentService.MimeType.JSON);
  }
  
  const action = payload.action;
  const user = payload.user || 'System';
  
  function logAudit(actionDesc) {
    const sheet = ss.getSheetByName('AuditLog') || ss.insertSheet('AuditLog');
    if (sheet.getLastRow() === 0) sheet.appendRow(['Timestamp', 'User', 'Action']);
    sheet.appendRow([new Date().toISOString(), user, actionDesc]);
  }

  function ensureHeaders(sheetName, headers) {
    const sheet = ss.getSheetByName(sheetName) || ss.insertSheet(sheetName);
    if (sheet.getLastRow() === 0) sheet.appendRow(headers);
    return sheet;
  }

  if (action === 'addUser') {
    const sheet = ensureHeaders('Users', ['Email', 'Password']);
    sheet.appendRow(payload.data);
    logAudit(`Added user ${payload.data[0]}`);
    return ContentService.createTextOutput(JSON.stringify({success: true})).setMimeType(ContentService.MimeType.JSON);
  }

  if (action === 'addEmployee') {
    // New schema supports Target & ProbationDuration
    // data payload: [ID, Name, Role, Email, StartDate, BaseSalary, CommissionRate, Target, ProbationDuration, Password]
    const data = payload.data;
    
    // Extract password (last element) and remove it from the employee array
    const password = data.pop();
    
    const empSheet = ensureHeaders('Employees', ['ID', 'Name', 'Role', 'Email', 'StartDate', 'BaseSalary', 'CommissionRate', 'Target', 'ProbationDuration']);
    empSheet.appendRow(data);
    
    // Auto-create login
    const email = data[3];
    const userSheet = ensureHeaders('Users', ['Email', 'Password']);
    userSheet.appendRow([email, password]);
    
    logAudit(`Added employee ${data[1]} and auto-generated login credentials`);
    return ContentService.createTextOutput(JSON.stringify({success: true})).setMimeType(ContentService.MimeType.JSON);
  }
  
  if (action === 'addLead') {
    // Expanded Schema
    const sheet = ensureHeaders('Leads', ['LeadID', 'EmployeeID', 'Date', 'Stage', 'Notes', 'FollowUp', 'Assignee', 'Source', 'LastUpdated']);
    sheet.appendRow(payload.data);
    logAudit(`Added lead ${payload.data[0]} from ${payload.data[7] || 'Unknown Source'}`);
    return ContentService.createTextOutput(JSON.stringify({success: true})).setMimeType(ContentService.MimeType.JSON);
  }
  
  if (action === 'updateLead') {
    const sheet = ss.getSheetByName('Leads');
    if (!sheet) return ContentService.createTextOutput(JSON.stringify({success: false, error: "No leads sheet"})).setMimeType(ContentService.MimeType.JSON);
    
    const data = sheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][0]) === String(payload.leadId)) {
        if (payload.updates.stage) sheet.getRange(i + 1, 4).setValue(payload.updates.stage);
        if (payload.updates.notes) sheet.getRange(i + 1, 5).setValue(payload.updates.notes);
        if (payload.updates.followUp) sheet.getRange(i + 1, 6).setValue(payload.updates.followUp);
        if (payload.updates.assignee) sheet.getRange(i + 1, 7).setValue(payload.updates.assignee);
        if (payload.updates.source) sheet.getRange(i + 1, 8).setValue(payload.updates.source);
        
        sheet.getRange(i + 1, 9).setValue(new Date().toISOString()); // LastUpdated
        
        logAudit(`Updated lead ${payload.leadId} (Stage: ${payload.updates.stage})`);
        return ContentService.createTextOutput(JSON.stringify({success: true})).setMimeType(ContentService.MimeType.JSON);
      }
    }
    return ContentService.createTextOutput(JSON.stringify({success: false, error: "Lead not found"})).setMimeType(ContentService.MimeType.JSON);
  }

  if (action === 'bulkReassign') {
    const sheet = ss.getSheetByName('Leads');
    if (!sheet) return ContentService.createTextOutput(JSON.stringify({success: false, error: "No leads sheet"})).setMimeType(ContentService.MimeType.JSON);
    
    const data = sheet.getDataRange().getValues();
    let count = 0;
    for (let i = 1; i < data.length; i++) {
      if (payload.leadIds.includes(String(data[i][0]))) {
        sheet.getRange(i + 1, 2).setValue(payload.newEmployeeId);
        sheet.getRange(i + 1, 7).setValue(payload.newAssigneeName);
        sheet.getRange(i + 1, 9).setValue(new Date().toISOString());
        count++;
      }
    }
    logAudit(`Bulk reassigned ${count} leads to ${payload.newAssigneeName}`);
    return ContentService.createTextOutput(JSON.stringify({success: true, count})).setMimeType(ContentService.MimeType.JSON);
  }

  if (action === 'addExpense') {
    const sheet = ensureHeaders('Expenses', ['ExpenseID', 'EmployeeID', 'Date', 'Amount', 'Description', 'Status']);
    // Force Pending Status on Creation
    payload.data[5] = 'Pending';
    sheet.appendRow(payload.data);
    logAudit(`Requested expense $${payload.data[3]}`);
    return ContentService.createTextOutput(JSON.stringify({success: true})).setMimeType(ContentService.MimeType.JSON);
  }

  if (action === 'updateExpenseStatus') {
    const sheet = ss.getSheetByName('Expenses');
    const data = sheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][0]) === String(payload.expenseId)) {
        sheet.getRange(i + 1, 6).setValue(payload.status);
        logAudit(`${payload.status} expense ${payload.expenseId}`);
        return ContentService.createTextOutput(JSON.stringify({success: true})).setMimeType(ContentService.MimeType.JSON);
      }
    }
  }

  if (action === 'addPTO') {
    const sheet = ensureHeaders('PTO', ['PTOID', 'EmployeeID', 'StartDate', 'EndDate', 'Status']);
    // Force Pending Status
    payload.data[4] = 'Pending';
    sheet.appendRow(payload.data);
    logAudit(`Requested PTO`);
    return ContentService.createTextOutput(JSON.stringify({success: true})).setMimeType(ContentService.MimeType.JSON);
  }

  if (action === 'updatePTOStatus') {
    const sheet = ss.getSheetByName('PTO');
    const data = sheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][0]) === String(payload.ptoId)) {
        sheet.getRange(i + 1, 5).setValue(payload.status);
        logAudit(`${payload.status} PTO ${payload.ptoId}`);
        return ContentService.createTextOutput(JSON.stringify({success: true})).setMimeType(ContentService.MimeType.JSON);
      }
    }
  }

  if (action === 'updateSetting') {
    const sheet = ensureHeaders('Settings', ['Key', 'Value']);
    const data = sheet.getDataRange().getValues();
    let found = false;
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][0]) === String(payload.key)) {
        sheet.getRange(i + 1, 2).setValue(payload.value);
        found = true;
        break;
      }
    }
    if (!found) sheet.appendRow([payload.key, payload.value]);
    logAudit(`Updated system setting: ${payload.key}`);
    return ContentService.createTextOutput(JSON.stringify({success: true})).setMimeType(ContentService.MimeType.JSON);
  }
  
  return ContentService.createTextOutput(JSON.stringify({error: "Invalid action"})).setMimeType(ContentService.MimeType.JSON);
}

// ----------------------------------------------------
// AUTOMATIONS (Requires Manual Trigger Setup in GAS UI)
// ----------------------------------------------------

function sendWeeklySummary() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const leads = ss.getSheetByName('Leads');
  if (!leads) return;
  const data = leads.getDataRange().getValues();
  
  let conversions = 0;
  for (let i = 1; i < data.length; i++) {
    if (data[i][3] === 'Converted') conversions++;
  }
  
  const text = `📊 *Weekly Summary*\nTotal Leads: ${data.length - 1}\nTotal Conversions: ${conversions}`;
  
  if (SLACK_WEBHOOK_URL) {
    try {
      UrlFetchApp.fetch(SLACK_WEBHOOK_URL, {
        method: 'post',
        contentType: 'application/json',
        payload: JSON.stringify({text})
      });
    } catch(e) {}
  }
  if (MANAGER_EMAIL) {
    MailApp.sendEmail(MANAGER_EMAIL, "Weekly Sales Summary", text);
  }
}

function sendNoContactReminders() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const leads = ss.getSheetByName('Leads');
  if (!leads) return;
  const data = leads.getDataRange().getValues();
  
  const now = new Date();
  let flagged = 0;
  
  for (let i = 1; i < data.length; i++) {
    const lastUpdated = new Date(data[i][8]); // Index 8 is LastUpdated
    const stage = data[i][3];
    const diffHours = (now - lastUpdated) / (1000 * 60 * 60);
    
    if (stage === 'Pending' && diffHours > 48) {
      flagged++;
    }
  }
  
  if (flagged > 0 && MANAGER_EMAIL) {
    MailApp.sendEmail(MANAGER_EMAIL, "Stagnant Leads Alert", `You have ${flagged} leads sitting in Pending for over 48 hours.`);
  }
}

function doOptions(e) {
  return ContentService.createTextOutput("OK").setMimeType(ContentService.MimeType.TEXT);
}
