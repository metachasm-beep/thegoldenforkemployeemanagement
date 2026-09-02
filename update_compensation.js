const fs = require('fs');

let comp = fs.readFileSync('src/lib/compensation.ts', 'utf8');

comp = comp.replace('export function calculateMonthlyCompensation(', `export function calculateMonthlyCompensation(
  empBaseSalary: number,
  empProbationSalary: number,
  empTarget: number,
  empCommissionRate: number,`);

comp = comp.replace(/let target = 5;/g, 'let target = empTarget;');
comp = comp.replace(/if \(isMonthOne && lastMonthSales < 5\) {/g, 'if (isMonthOne && lastMonthSales < empTarget) {');
comp = comp.replace(/target = 5 \+ \(5 - lastMonthSales\);/g, 'target = empTarget + (empTarget - lastMonthSales);');

const oldLogic = `  if (isMonthOne) {
    if (salesThisMonth >= target) {
      basePayout = 45000;
    } else if (salesThisMonth >= 2) {
      basePayout = 15000;
      willTerminate = true;
    } else {
      basePayout = 0;
      willTerminate = true;
    }
  } else {
    if (salesThisMonth >= 5) {
      basePayout = 45000;
    } else if (salesThisMonth >= 2) {
      basePayout = salesThisMonth * 9000;
    } else {
      basePayout = 0;
    }
  }

  let performanceBonus = 0;
  if (salesThisMonth > 5) {
    performanceBonus = (salesThisMonth - 5) * 5000;
  }`;

const newLogic = `  if (isMonthOne) {
    if (salesThisMonth >= target) {
      basePayout = empBaseSalary;
    } else if (salesThisMonth >= 2) {
      basePayout = empProbationSalary;
      willTerminate = true;
    } else {
      basePayout = 0;
      willTerminate = true;
    }
  } else {
    if (salesThisMonth >= empTarget) {
      basePayout = empBaseSalary;
    } else if (salesThisMonth >= 2) {
      basePayout = salesThisMonth * 9000;
    } else {
      basePayout = 0;
    }
  }

  let performanceBonus = 0;
  if (salesThisMonth > empTarget) {
    performanceBonus = (salesThisMonth - empTarget) * empCommissionRate;
  }`;

comp = comp.replace(oldLogic, newLogic);
comp = comp.replace('(!isMonthOne && salesThisMonth < 5)', '(!isMonthOne && salesThisMonth < empTarget)');
fs.writeFileSync('src/lib/compensation.ts', comp);
