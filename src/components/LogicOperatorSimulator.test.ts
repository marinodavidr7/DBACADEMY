import { describe, expect, it } from 'vitest';
import {
  COMPARISON_OPERATOR_OPTIONS,
  evaluateComparison,
  parseComparisonNumber,
} from './LogicOperatorSimulator';

describe('LogicOperatorSimulator helpers', () => {
  it('exposes all 6 Excel comparison operators', () => {
    expect(COMPARISON_OPERATOR_OPTIONS.map((o) => o.op)).toEqual([
      '=',
      '>',
      '<',
      '>=',
      '<=',
      '<>',
    ]);
  });

  it('evaluates equality and inequality accurately', () => {
    expect(evaluateComparison(5, '=', 5)).toBe(true);
    expect(evaluateComparison(5, '=', 3)).toBe(false);
    expect(evaluateComparison(5, '<>', 3)).toBe(true);
    expect(evaluateComparison(5, '<>', 5)).toBe(false);
  });

  it('evaluates greater/less comparisons including negatives and decimals', () => {
    expect(evaluateComparison(10, '>', 2)).toBe(true);
    expect(evaluateComparison(2, '>', 10)).toBe(false);
    expect(evaluateComparison(-5, '<', 0)).toBe(true);
    expect(evaluateComparison(70, '>=', 70)).toBe(true);
    expect(evaluateComparison(69.9, '>=', 70)).toBe(false);
    expect(evaluateComparison(15, '<=', 15)).toBe(true);
    expect(evaluateComparison(16, '<=', 15)).toBe(false);
  });

  it('parses transient or invalid numeric input safely as 0', () => {
    expect(parseComparisonNumber('')).toBe(0);
    expect(parseComparisonNumber('-')).toBe(0);
    expect(parseComparisonNumber('.')).toBe(0);
    expect(parseComparisonNumber('abc')).toBe(0);
    expect(parseComparisonNumber(' 42.5 ')).toBe(42.5);
    expect(parseComparisonNumber('-12')).toBe(-12);
  });
});
