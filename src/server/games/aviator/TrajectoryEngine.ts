import { roundCurrency } from '../../database/db.ts';

/**
 * TrajectoryEngine: Implements the PRD specification:
 * multiplier(t) = exp(0.065 * t)
 * where t is elapsed time in seconds from round start.
 */
export class TrajectoryEngine {
  private static readonly GROWTH_RATE = 0.065;

  /**
   * Calculate multiplier at elapsed time t (seconds)
   */
  public static getMultiplierAtTime(elapsedSeconds: number): number {
    if (elapsedSeconds <= 0) return 1.0;
    const raw = Math.exp(this.GROWTH_RATE * elapsedSeconds);
    return roundCurrency(raw);
  }

  /**
   * Inverse calculation: elapsed seconds required to reach target multiplier
   */
  public static getTimeForMultiplier(targetMultiplier: number): number {
    if (targetMultiplier <= 1.0) return 0;
    return Math.log(targetMultiplier) / this.GROWTH_RATE;
  }
}
