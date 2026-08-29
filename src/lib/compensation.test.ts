import { calculateMonthlyCompensation } from './compensation';

describe('Metachasm Sales Contractor Compensation Engine', () => {
  describe('Month 1 (Probation)', () => {
    it('should pay 15k and NOT terminate if >= 5 sales', () => {
      const result = calculateMonthlyCompensation(5, true, 0);
      expect(result.basePayout).toBe(15000);
      expect(result.willTerminate).toBe(false);
    });

    it('should pay 15k but TERMINATE if 2-4 sales', () => {
      const result = calculateMonthlyCompensation(3, true, 0);
      expect(result.basePayout).toBe(15000);
      expect(result.willTerminate).toBe(true);
    });

    it('should pay 0 and TERMINATE if < 2 sales', () => {
      const result = calculateMonthlyCompensation(1, true, 0);
      expect(result.basePayout).toBe(0);
      expect(result.willTerminate).toBe(true);
    });
  });

  describe('Month 2+ (Standard)', () => {
    it('should pay 45k fixed if >= 5 sales', () => {
      const result = calculateMonthlyCompensation(5, false, 10);
      expect(result.basePayout).toBe(45000);
    });

    it('should pay prorated (9k per sale) if < 5 sales', () => {
      const result = calculateMonthlyCompensation(4, false, 10);
      expect(result.basePayout).toBe(36000); // 4 * 9000
    });
  });

  describe('Performance Bonuses', () => {
    it('should add 5k for every sale strictly above 5', () => {
      const result = calculateMonthlyCompensation(7, false, 20);
      // Base: 45k, Bonus: 2 * 5k = 10k
      expect(result.basePayout).toBe(45000);
      expect(result.performanceBonus).toBe(10000);
      expect(result.totalPayout).toBe(55000);
    });
  });

  describe('Cumulative Milestone Bonuses', () => {
    it('should award 100k when crossing 100 total sales', () => {
      // Previously 98 sales. They make 5 this month. Total = 103.
      // They crossed the 100 threshold once this month.
      const result = calculateMonthlyCompensation(5, false, 98);
      expect(result.milestoneBonus).toBe(100000);
      // Base 45k + 100k milestone
      expect(result.totalPayout).toBe(145000);
    });

    it('should NOT award 100k if threshold not crossed', () => {
      // Previously 90 sales. They make 5 this month. Total = 95.
      const result = calculateMonthlyCompensation(5, false, 90);
      expect(result.milestoneBonus).toBe(0);
    });

    it('should award 200k if crossing two thresholds (e.g. 100 and 200) in one massive month', () => {
      // Previously 90 sales. They make 120 this month. Total = 210.
      const result = calculateMonthlyCompensation(120, false, 90);
      expect(result.milestoneBonus).toBe(200000);
    });
  });
});


