import { WinGoSelectionType, WinGoSelectionValue, WinGoRoundOutcome } from './types.ts';
import { roundCurrency } from '../../database/db.ts';

export interface PayoutEvaluation {
  isWon: boolean;
  multiplier: number;
  payoutAmount: number;
}

export class PayoutEngine {
  /**
   * Determine winning status, return multiplier, and calculated payout.
   * Multiplier is total return including the original stake.
   */
  public static evaluateBet(
    selectionType: WinGoSelectionType,
    selectionValue: WinGoSelectionValue,
    stakeAmount: number,
    outcome: WinGoRoundOutcome
  ): PayoutEvaluation {
    let isWon = false;
    let grossMultiplier = 0.0;

    switch (selectionType) {
      case 'NUMBER': {
        const betNum = parseInt(selectionValue, 10);
        if (betNum === outcome.number) {
          isWon = true;
          grossMultiplier = 9.0;
        }
        break;
      }

      case 'COLOR': {
        if (selectionValue === 'RED') {
          if (outcome.number === 0) {
            // Special Rule: Number 0 gives Red 1.5x gross payout
            isWon = true;
            grossMultiplier = 1.5;
          } else if (outcome.colors.includes('RED')) {
            // Standard Red: 2.0x gross payout (1.96x net after 2% rake)
            isWon = true;
            grossMultiplier = 2.0;
          }
        } else if (selectionValue === 'GREEN') {
          if (outcome.number === 5) {
            // Special Rule: Number 5 gives Green 1.5x gross payout
            isWon = true;
            grossMultiplier = 1.5;
          } else if (outcome.colors.includes('GREEN')) {
            // Standard Green: 2.0x gross payout (1.96x net after 2% rake)
            isWon = true;
            grossMultiplier = 2.0;
          }
        } else if (selectionValue === 'VIOLET') {
          // Violet wins on 0 and 5: 4.5x gross
          if (outcome.colors.includes('VIOLET')) {
            isWon = true;
            grossMultiplier = 4.5;
          }
        }
        break;
      }

      case 'SIZE': {
        if (selectionValue === 'SMALL' && outcome.size === 'SMALL') {
          isWon = true;
          grossMultiplier = 2.0;
        } else if (selectionValue === 'BIG' && outcome.size === 'BIG') {
          isWon = true;
          grossMultiplier = 2.0;
        }
        break;
      }
    }

    // 2% Platform Handling Fee (Rake) deducted on winning payouts
    const RAKE_RATE = 0.02;
    const netMultiplier = isWon ? roundCurrency(grossMultiplier * (1 - RAKE_RATE)) : 0.0;
    const payoutAmount = isWon ? roundCurrency(stakeAmount * netMultiplier) : 0.0;

    return {
      isWon,
      multiplier: netMultiplier,
      payoutAmount,
    };
  }

  /**
   * Static lookup of default advertised multipliers for the UI display.
   */
  public static getAdvertisedMultiplier(type: WinGoSelectionType, value: WinGoSelectionValue): string {
    switch (type) {
      case 'NUMBER':
        return '8.82X (9X - 2% fee)';
      case 'COLOR':
        if (value === 'VIOLET') return '4.41X (4.5X - 2% fee)';
        if (value === 'RED' || value === 'GREEN') return '1.96X';
        return '1.96X';
      case 'SIZE':
        return '1.96X';
      default:
        return '1X';
    }
  }
}
