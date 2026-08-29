# Delta for Data Management

## ADDED Requirements

### Requirement: Employee Data Storage
The system SHALL store employee profiles in a central database (Google Sheets).

#### Scenario: Viewing employee list
- GIVEN the manager accesses the employee dashboard
- WHEN the system fetches data
- THEN a list of employees with their roles and base salaries is displayed.

### Requirement: Lead and Conversion Tracking
The system MUST record leads generated and successful conversions per employee.

#### Scenario: Logging a new conversion
- GIVEN an employee makes a successful sale
- WHEN the conversion is submitted through the system
- THEN the system increments the employee's conversion count for the current month.

### Requirement: Salary and Commission Calculation
The system SHALL calculate total salary based on base pay and performance commissions.

#### Scenario: End of month payout calculation
- GIVEN an employee with a base salary of $3000 and 10 conversions (at $50 each)
- WHEN the monthly salary report is generated
- THEN the total calculated payout is $3500.
