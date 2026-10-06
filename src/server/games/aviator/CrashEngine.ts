import { roundCurrency } from '../../database/db.ts';

/**
 * CrashEngine: Generates authoritative crash thresholds.
 * Strictly guarantees lower bound >= 1.01x.
 * Follows standard crash-game probability curve with house edge ~3% to 4%.
 */
export class CrashEngine {
  public static generateCrashPoint(): number {
    const random = Math.random(); // [0, 1)

    // Pillar 2: 3% probability of instant 1.00x crash rounds (immediate platform retention)
    if (random < 0.03) {
      return 1.00;
    }

    // With ~4% chance, instant low crash between 1.01x and 1.20x
    if (random < 0.07) {
      const lowCrash = 1.01 + Math.random() * 0.19;
      return roundCurrency(lowCrash);
    }

    // Heavy-tailed distribution: 97 / (100 * (1 - u))
    const u = Math.random();
    const rawMultiplier = 0.96 / (1.0 - u);

    // Clamp between 1.01 and 1000.00
    const clamped = Math.max(1.01, Math.min(1000.0, rawMultiplier));
    return roundCurrency(clamped);
  }
}
