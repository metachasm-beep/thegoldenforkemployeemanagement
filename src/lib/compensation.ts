/**
 * Calculates compensation based on the Metachasm Sales Contractor Agreement.
 * 
 * Rules:
 * - Month 1: 
 *   - >= 5 sales: 15k fixed.
 *   - 2-4 sales: 15k fixed (but terminated, we just return payout).
 *   - < 2 sales: 0 payout.
 * - Month 2+:
 *   - >= 5 sales: 45k fixed.
 *   - < 5 sales: 9k per sale prorated.
 * - Performance Bonus:
 *   - 5k for every sale > 5 in the given month.
 * - Milestone Bonus:
 *   - 100k for every 100 cumulative sales.
 */

export function calculateMonthlyCompensation(
  salesThisMonth: number,
  isMonthOne: boolean,
  previousCumulativeSales: number,
  lastMonthSales: number = 0,
  teamSales: number = 0
) {
  let basePayout = 0;
  let willTerminate = false;
  
  // Calculate target debt
  // Base target is 5. If they missed target last month, add debt.
  let target = 5;
  if (isMonthOne && lastMonthSales < 5) {
    target = 5 + (5 - lastMonthSales);
  }

  if (isMonthOne) {
    // Probation Rules
    if (salesThisMonth >= target) {
      basePayout = 45000; // If they hit their total target + debt, they unlock full base!
    } else if (salesThisMonth >= 2) {
      basePayout = 15000;
      willTerminate = true; // Still fired because they missed the full target, but gets some pay
    } else {
      basePayout = 0;
      willTerminate = true;
    }
  } else {
    // Standard Month Rules
    if (salesThisMonth >= 5) {
      basePayout = 45000;
    } else if (salesThisMonth >= 2) {
      basePayout = salesThisMonth * 9000;
      // Relegation triggers because salesThisMonth < 5
    } else {
      basePayout = 0;
      // Also relegation
    }
  }

  // Bonus for > 5 sales in the month
  let performanceBonus = 0;
  if (salesThisMonth > 5) {
    performanceBonus = (salesThisMonth - 5) * 5000;
  }

  // Cumulative Milestone Bonus
  const totalSalesAfterThisMonth = previousCumulativeSales + salesThisMonth;
  const previousMilestonesHit = Math.floor(previousCumulativeSales / 100);
  const currentMilestonesHit = Math.floor(totalSalesAfterThisMonth / 100);
  const milestonesAchievedThisMonth = currentMilestonesHit - previousMilestonesHit;
  const milestoneBonus = milestonesAchievedThisMonth * 100000;
  
  // Team Lead Override
  const leadershipBonus = teamSales * 1000;

  return {
    basePayout,
    performanceBonus,
    milestoneBonus,
    leadershipBonus,
    totalPayout: basePayout + performanceBonus + milestoneBonus + leadershipBonus,
    willTerminate: willTerminate || (!isMonthOne && salesThisMonth < 5) // Expose relegation intent via willTerminate flag for now
  };
}


