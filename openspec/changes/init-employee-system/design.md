# Design: Employee Management System

## Technical Approach
We will build a Next.js application using the App Router. The application will be deployed on Vercel.
For the database, we will use a Google Service Account to authenticate with the Google Sheets API. The spreadsheet will act as our relational database with distinct sheets for Employees, Leads, and Salaries.

## Architecture Decisions

### Decision: Google Sheets as Database
Using Google Sheets because:
- The requirements specify Google Sheets.
- It provides a built-in admin UI for non-technical users to manually override or audit data.
- Easy to set up without managing traditional database infrastructure.

### Decision: Vercel for Hosting
Using Vercel because:
- Native support for Next.js and serverless functions (for secure Google Sheets API calls).
- Zero-configuration deployments via GitHub integration.

## Data Flow
Client (Next.js UI) 
       | (REST / Next.js Server Actions)
       v
Vercel Serverless Functions 
       | (Google Sheets API via googleapis)
       v
Google Sheets (Employees, Leads, Salaries)

## Schema (Google Sheets Tabs)
1. **Employees**: ID, Name, Role, Email, BaseSalary, CommissionRate
2. **Leads**: LeadID, EmployeeID, Date, Status (Pending/Converted)
3. **Salaries**: PayoutID, EmployeeID, Month, Base, Commission, Total
"@;

Set-Content -Path "f:\SDD\openspec\changes\init-employee-system\tasks.md" -Value @"
# Tasks

## 1. Project Initialization
- [ ] 1.1 Initialize Next.js project with Tailwind CSS.
- [ ] 1.2 Initialize Git repository.
- [ ] 1.3 Push initial codebase to GitHub repository.
- [ ] 1.4 Connect GitHub repository to Vercel for CI/CD.

## 2. Database Integration
- [ ] 2.1 Set up Google Cloud Console project and enable Google Sheets API.
- [ ] 2.2 Create Service Account and generate credentials.
- [ ] 2.3 Create the target Google Sheet and share it with the Service Account email.
- [ ] 2.4 Implement googleapis client in Next.js to read/write from Sheets.

## 3. UI Implementation
- [ ] 3.1 Build Employee Dashboard (List, Add, Edit).
- [ ] 3.2 Build Performance Tracker (Log leads and conversions).
- [ ] 3.3 Build Salary Report View (Calculate and display monthly payouts).

## 4. Verification
- [ ] 4.1 Test adding a new employee.
- [ ] 4.2 Test logging a conversion and verifying the commission updates.
- [ ] 4.3 Verify data persists correctly in Google Sheets.
