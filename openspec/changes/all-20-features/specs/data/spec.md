# Delta for Data Management

## ADDED Requirements

### Requirement: Complex Contractor Compensation
The system SHALL calculate commissions exactly per the Metachasm Sales Contractor Agreement.
- **Month 1**: 15k fixed if >= 5 sales; 15k but terminated if 2-4 sales; 0 payout if <2 sales.
- **Month 2+**: 45k fixed for >=5 sales; prorated 9k/sale if <5 sales.
- **Bonus**: 5k for each sale > 5 in a month.
- **Milestone**: 100k bonus for every 100 cumulative sales.

### Requirement: Expanded CRM Schema
The system SHALL track lead stages (Contacted, Meeting Scheduled, Proposal Sent, Converted, Lost), assignees, notes, and follow-up dates.

### Requirement: Apps Script Automations
The system SHALL send automated welcome emails (GmailApp), weekly summaries, and Slack/Discord webhooks upon lead conversion. An Audit Log sheet SHALL track all modifications.
