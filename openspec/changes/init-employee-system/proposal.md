# Proposal: Initialize Employee Management System

## Intent
Create a comprehensive Employee Management System to track employee data, lead generation performance, conversion rates, and salary payouts. 

## Scope
In scope:
- Employee Directory (basic data: name, role, contact).
- Performance tracking (leads generated, conversions logged).
- Salary management (base salary + commission based on conversions).
- Google Sheets integration as the primary database backend.
- Deployment to Vercel via GitHub.

Out of scope:
- Complex HR features (leave management, performance reviews).
- Automated payroll bank transfers.

## Approach
We will build a Next.js web application hosted on Vercel. Instead of a traditional database, we will use the Google Sheets API to read and write data. This provides a familiar interface for non-technical admins while powering a custom frontend for employees and managers.
