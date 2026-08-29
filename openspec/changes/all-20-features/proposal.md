# Proposal: Implement 20 Feature Expansion & Contract-Based Compensation

## Intent
Transform the basic Employee Management System into a comprehensive CRM, HR, and Payroll suite, implementing all 20 proposed features. Crucially, the system will accurately model the Metachasm Sales Contractor Agreement compensation rules.

## Scope
In scope:
- Full authentication and role-based access control (Manager vs. Employee).
- Advanced Lead CRM (stages, notes, assignments, follow-ups).
- Real-time and historical analytics, leaderboards, and PDF exports.
- Complex payroll calculation based on the Contractor Agreement:
  - Month 1: 15k fixed fee (conditional on 5 sales), terminated if <5.
  - Month 2+: 45k fixed for 5 sales, prorated at 9k/sale if <5.
  - Bonus: 5k for every sale >5 in a month.
  - Milestone: 100k for every cumulative 100 sales.
- Google Apps Script automation for emails, Slack webhooks, and audit logging.

Out of scope:
- Processing actual bank transfers.
