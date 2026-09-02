export function calculateMonthlyCompensation(
  empBaseSalary: number,
  empProbationSalary: number,
  empTarget: number,
  empCommissionRate: number,
  salesThisMonth: number,
  isMonthOne: boolean,
  previousCumulativeSales: number,
  lastMonthSales: number = 0,
  teamSales: number = 0
) {
  let basePayout = 0;
  let willTerminate = false;
  
  // Calculate target debt
  let target = empTarget;
  if (isMonthOne && lastMonthSales < empTarget) {
    target = empTarget + (empTarget - lastMonthSales);
  }

  if (isMonthOne) {
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
  }

  const totalSalesAfterThisMonth = previousCumulativeSales + salesThisMonth;
  const previousMilestonesHit = Math.floor(previousCumulativeSales / 100);
  const currentMilestonesHit = Math.floor(totalSalesAfterThisMonth / 100);
  const milestonesAchievedThisMonth = currentMilestonesHit - previousMilestonesHit;
  const milestoneBonus = milestonesAchievedThisMonth * 100000;
  
  const leadershipBonus = teamSales * 1000;

  const grossPayout = basePayout + performanceBonus + milestoneBonus + leadershipBonus;
  
  // Standard Indian TDS under 194J (Professional Services) is 10%
  const tdsDeduction = 0; // TDS disabled as per company tax slab
  const netPayout = grossPayout;

  return {
    basePayout,
    performanceBonus,
    milestoneBonus,
    leadershipBonus,
    grossPayout,
    tdsDeduction,
    totalPayout: netPayout,
    willTerminate: willTerminate || (!isMonthOne && salesThisMonth < empTarget)
  };
}
