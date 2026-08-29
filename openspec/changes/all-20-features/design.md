# Design: 20 Feature Expansion

## Technical Approach
- **Frontend**: Next.js App Router, Tailwind CSS, Recharts for charts, jspdf and html2canvas for PDF generation.
- **Authentication**: NextAuth.js with Credentials (storing hashed passwords in Google Sheets for simplicity, or utilizing a simple passcode approach for rapid development).
- **Backend/Database**: Heavily expanded Google Apps Script Web App. 
- **Automations**: Google Apps Script Time-driven triggers for weekly emails. UrlFetchApp for Slack Webhooks.

## Architecture Decisions
- **Auth in Google Sheets**: To keep infrastructure strictly to Vercel + Google Sheets, we will store user accounts and securely hashed passwords in a new Users sheet.
- **Complex Compensation Engine**: The calculation logic will reside in the Next.js backend (Server Actions) to allow unit testing of the complex contract rules, rather than in Apps Script.
