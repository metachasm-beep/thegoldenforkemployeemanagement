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
  const user = payload.user || 'Unknown'; // For audit logging
  
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
    const sheet = ensureHeaders('Employees', ['ID', 'Name', 'Role', 'Email', 'StartDate']);
    sheet.appendRow(payload.data);
    logAudit(`Added employee ${payload.data[1]}`);
    
    // Welcome Email Automation
    try {
      MailApp.sendEmail(
        payload.data[3], 
        "Welcome to Metachasm Enterprises!", 
        `Hi ${payload.data[1]},\n\nWelcome to the team! Your Contractor Agreement starts on ${payload.data[4]}.\n\nBest,\nManagement`
      );
    } catch(e) {}

    return ContentService.createTextOutput(JSON.stringify({success: true})).setMimeType(ContentService.MimeType.JSON);
  }
  
  if (action === 'addLead') {
    // Expanded Schema
    const sheet = ensureHeaders('Leads', ['LeadID', 'EmployeeID', 'Date', 'Stage', 'Notes', 'FollowUp', 'Assignee']);
    sheet.appendRow(payload.data);
    logAudit(`Added lead ${payload.data[0]}`);
    return ContentService.createTextOutput(JSON.stringify({success: true})).setMimeType(ContentService.MimeType.JSON);
  }
  
  if (action === 'updateLead') {
    const sheet = ss.getSheetByName('Leads');
    if (!sheet) return ContentService.createTextOutput(JSON.stringify({success: false, error: "No leads sheet"})).setMimeType(ContentService.MimeType.JSON);
    
    const data = sheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][0]) === String(payload.leadId)) {
        // payload.updates = { stage, notes, followUp, assignee }
        if (payload.updates.stage) sheet.getRange(i + 1, 4).setValue(payload.updates.stage);
        if (payload.updates.notes) sheet.getRange(i + 1, 5).setValue(payload.updates.notes);
        if (payload.updates.followUp) sheet.getRange(i + 1, 6).setValue(payload.updates.followUp);
        if (payload.updates.assignee) sheet.getRange(i + 1, 7).setValue(payload.updates.assignee);
        
        logAudit(`Updated lead ${payload.leadId} to stage ${payload.updates.stage}`);
        
        // Slack Webhook Automation
        if (payload.updates.stage === 'Converted' && SLACK_WEBHOOK_URL) {
          try {
            UrlFetchApp.fetch(SLACK_WEBHOOK_URL, {
              method: 'post',
              contentType: 'application/json',
              payload: JSON.stringify({text: `🎉 A new lead has been CONVERTED by ${payload.updates.assignee || 'an employee'}!`})
            });
          } catch(e) {}
        }
        
        return ContentService.createTextOutput(JSON.stringify({success: true})).setMimeType(ContentService.MimeType.JSON);
      }
    }
    return ContentService.createTextOutput(JSON.stringify({success: false, error: "Lead not found"})).setMimeType(ContentService.MimeType.JSON);
  }

  if (action === 'addExpense') {
    const sheet = ensureHeaders('Expenses', ['ExpenseID', 'EmployeeID', 'Date', 'Amount', 'Description', 'Status']);
    sheet.appendRow(payload.data);
    logAudit(`Added expense ${payload.data[0]} for ${payload.data[3]}`);
    return ContentService.createTextOutput(JSON.stringify({success: true})).setMimeType(ContentService.MimeType.JSON);
  }

  if (action === 'addPTO') {
    const sheet = ensureHeaders('PTO', ['PTOID', 'EmployeeID', 'StartDate', 'EndDate', 'Status']);
    sheet.appendRow(payload.data);
    logAudit(`Added PTO request ${payload.data[0]}`);
    return ContentService.createTextOutput(JSON.stringify({success: true})).setMimeType(ContentService.MimeType.JSON);
  }
  
  return ContentService.createTextOutput(JSON.stringify({error: "Invalid action"})).setMimeType(ContentService.MimeType.JSON);
}

// Time-driven trigger for weekly summaries
function sendWeeklySummary() {
  if (!MANAGER_EMAIL) return;
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const leads = ss.getSheetByName('Leads').getDataRange().getValues();
  let convertedThisWeek = 0;
  // Basic logic to count (in production, use dates)
  
  MailApp.sendEmail(
    MANAGER_EMAIL,
    "Weekly Sales Summary",
    `Hello Manager,\n\nHere is your weekly summary.\nTotal Leads in System: ${leads.length - 1}`
  );
}

function doOptions(e) {
  return ContentService.createTextOutput("OK").setMimeType(ContentService.MimeType.TEXT);
}
