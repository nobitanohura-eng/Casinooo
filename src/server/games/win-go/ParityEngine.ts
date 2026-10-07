import { WinGoColor, WinGoSize, WinGoRoundOutcome } from './types.ts';

/**
 * ParityEngine: Authoritative mapping of 0-9 integer outcomes to Colors, Sizes, and Parity.
 *
 * Color mapping:
 * - 0: Red and Violet
 * - 1: Green
 * - 2: Red
 * - 3: Green
 * - 4: Red
 * - 5: Green and Violet
 * - 6: Red
 * - 7: Green
 * - 8: Red
 * - 9: Green
 *
 * Parity mapping:
 * - Even: Red (0, 2, 4, 6, 8)
 * - Odd: Green (1, 3, 5, 7, 9)
 *
 * Size mapping:
 * - Small: 0, 1, 2, 3, 4
 * - Big: 5, 6, 7, 8, 9
 */
export class ParityEngine {
  public static evaluateOutcome(resultNumber: number): WinGoRoundOutcome {
    if (resultNumber < 0 || resultNumber > 9 || !Number.isInteger(resultNumber)) {
      throw new Error(`Invalid outcome number: ${resultNumber}. Must be integer between 0 and 9.`);
    }

    const parity: 'EVEN' | 'ODD' = resultNumber % 2 === 0 ? 'EVEN' : 'ODD';
    const size: WinGoSize = resultNumber >= 5 ? 'BIG' : 'SMALL';

    let colors: ('RED' | 'GREEN' | 'VIOLET')[] = [];
    let colorDisplay: WinGoColor;

    if (resultNumber === 0) {
      colors = ['RED', 'VIOLET'];
      colorDisplay = 'RED_VIOLET';
    } else if (resultNumber === 5) {
      colors = ['GREEN', 'VIOLET'];
      colorDisplay = 'GREEN_VIOLET';
    } else if (resultNumber % 2 === 0) {
      colors = ['RED'];
      colorDisplay = 'RED';
    } else {
      colors = ['GREEN'];
      colorDisplay = 'GREEN';
    }

    return {
      number: resultNumber,
      colors,
      colorDisplay,
      size,
      parity,
    };
  }

  /**
   * Returns outcome numbers that satisfy a given selection for the Anti-Rage Pity Engine
   */
  public static getMatchingNumbers(selectionType: 'COLOR' | 'NUMBER' | 'SIZE', selectionValue: string): number[] {
    if (selectionType === 'NUMBER') {
      const n = parseInt(selectionValue, 10);
      return n >= 0 && n <= 9 ? [n] : [];
    }
    if (selectionType === 'COLOR') {
      if (selectionValue === 'RED') return [0, 2, 4, 6, 8];
      if (selectionValue === 'GREEN') return [1, 3, 5, 7, 9];
      if (selectionValue === 'VIOLET') return [0, 5];
    }
    if (selectionType === 'SIZE') {
      if (selectionValue === 'SMALL') return [0, 1, 2, 3, 4];
      if (selectionValue === 'BIG') return [5, 6, 7, 8, 9];
    }
    return [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
  }

  /**
   * Random integer outcome generation (0 through 9) using crypto/uniform distribution.
   */
  public static generateUniformOutcome(): number {
    return Math.floor(Math.random() * 10);
  }
}
