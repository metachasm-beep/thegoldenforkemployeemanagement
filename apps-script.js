function doGet(e) {
  const action = e.parameter.action;
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  if (action === 'getEmployees') {
    const sheet = ss.getSheetByName('Employees');
    if (!sheet) return ContentService.createTextOutput(JSON.stringify([])).setMimeType(ContentService.MimeType.JSON);
    
    const data = sheet.getDataRange().getValues();
    if (data.length > 0) data.shift(); // remove header
    return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
  }
  
  if (action === 'getLeads') {
    const sheet = ss.getSheetByName('Leads');
    if (!sheet) return ContentService.createTextOutput(JSON.stringify([])).setMimeType(ContentService.MimeType.JSON);

    const data = sheet.getDataRange().getValues();
    if (data.length > 0) data.shift(); // remove header
    return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
  }
  
  return ContentService.createTextOutput(JSON.stringify({error: "Invalid action"})).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // Try to parse the payload. Since Google Apps script often receives JSON as text.
  let payload;
  try {
    payload = JSON.parse(e.postData.contents);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({error: "Invalid JSON payload"})).setMimeType(ContentService.MimeType.JSON);
  }
  
  const action = payload.action;
  
  if (action === 'addEmployee') {
    const sheet = ss.getSheetByName('Employees') || ss.insertSheet('Employees');
    // Ensure header exists
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(['ID', 'Name', 'Role', 'Email', 'BaseSalary', 'CommissionRate']);
    }
    sheet.appendRow(payload.data);
    return ContentService.createTextOutput(JSON.stringify({success: true})).setMimeType(ContentService.MimeType.JSON);
  }
  
  if (action === 'addLead') {
    const sheet = ss.getSheetByName('Leads') || ss.insertSheet('Leads');
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(['LeadID', 'EmployeeID', 'Date', 'Status']);
    }
    sheet.appendRow(payload.data);
    return ContentService.createTextOutput(JSON.stringify({success: true})).setMimeType(ContentService.MimeType.JSON);
  }
  
  if (action === 'convertLead') {
    const sheet = ss.getSheetByName('Leads');
    if (!sheet) return ContentService.createTextOutput(JSON.stringify({success: false, error: "No leads sheet"})).setMimeType(ContentService.MimeType.JSON);
    
    const data = sheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      // payload.leadId is a string, data might have it as a number or string. loose comparison.
      if (String(data[i][0]) === String(payload.leadId)) {
        sheet.getRange(i + 1, 4).setValue('Converted');
        return ContentService.createTextOutput(JSON.stringify({success: true})).setMimeType(ContentService.MimeType.JSON);
      }
    }
    return ContentService.createTextOutput(JSON.stringify({success: false, error: "Lead not found"})).setMimeType(ContentService.MimeType.JSON);
  }
  
  return ContentService.createTextOutput(JSON.stringify({error: "Invalid action"})).setMimeType(ContentService.MimeType.JSON);
}

// NOTE: To handle CORS preflight requests correctly in some fetch environments,
// adding a doOptions function returning HTTP 200 is sometimes needed, though ContentService often handles it.
function doOptions(e) {
  return ContentService.createTextOutput("OK").setMimeType(ContentService.MimeType.TEXT);
}
