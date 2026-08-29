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
  previousCumulativeSales: number
) {
  let basePayout = 0;
  
  if (isMonthOne) {
    if (salesThisMonth >= 2) {
      basePayout = 15000;
    } else {
      basePayout = 0;
    }
  } else {
    if (salesThisMonth >= 5) {
      basePayout = 45000;
    } else {
      basePayout = salesThisMonth * 9000;
    }
  }

  // Bonus for > 5 sales in the month (applicable to both Month 1 and Month 2+)
  // Contract implies "For every closed annual subscription exceeding the monthly target of 5 sales..."
  let performanceBonus = 0;
  if (salesThisMonth > 5) {
    performanceBonus = (salesThisMonth - 5) * 5000;
  }

  // Cumulative Milestone Bonus
  const totalSalesAfterThisMonth = previousCumulativeSales + salesThisMonth;
  // Calculate how many times they crossed a 100 multiple this month
  const previousMilestonesHit = Math.floor(previousCumulativeSales / 100);
  const currentMilestonesHit = Math.floor(totalSalesAfterThisMonth / 100);
  
  const milestonesAchievedThisMonth = currentMilestonesHit - previousMilestonesHit;
  const milestoneBonus = milestonesAchievedThisMonth * 100000;

  return {
    basePayout,
    performanceBonus,
    milestoneBonus,
    totalPayout: basePayout + performanceBonus + milestoneBonus,
    willTerminate: isMonthOne && salesThisMonth < 5
  };
}


