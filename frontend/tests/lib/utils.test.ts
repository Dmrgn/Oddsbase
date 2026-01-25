import { describe, it, expect } from 'vitest';
import { cn, formatPercent, formatCurrency, formatCompactNumber, formatTimestamp } from '@/lib/utils';

describe('cn (classname merge)', () => {
    it('merges class names', () => {
        expect(cn('foo', 'bar')).toBe('foo bar');
    });

    it('handles conditional classes', () => {
        expect(cn('base', false && 'hidden', true && 'visible')).toBe('base visible');
    });
});

describe('formatPercent', () => {
    it('formats decimal to percentage', () => {
        expect(formatPercent(0.5)).toBe('50.00%');
        expect(formatPercent(0.123, 1)).toBe('12.3%');
    });

    it('returns dash for NaN', () => {
        expect(formatPercent(NaN)).toBe('—');
    });
});

describe('formatCurrency', () => {
    it('formats USD by default', () => {
        expect(formatCurrency(1234.56)).toBe('$1,234.56');
    });

    it('returns dash for non-finite values', () => {
        expect(formatCurrency(Infinity)).toBe('—');
        expect(formatCurrency(-Infinity)).toBe('—');
    });
});

describe('formatCompactNumber', () => {
    it('formats large numbers compactly', () => {
        expect(formatCompactNumber(1500)).toBe('1.5K');
        expect(formatCompactNumber(1000000)).toBe('1M');
    });

    it('returns dash for non-finite values', () => {
        expect(formatCompactNumber(Infinity)).toBe('—');
    });
});

describe('formatTimestamp', () => {
    it('formats valid date string', () => {
        const result = formatTimestamp('2024-01-15T10:30:00Z');
        expect(result).toContain('Jan');
        expect(result).toContain('15');
        expect(result).toContain('2024');
    });

    it('returns dash for invalid date', () => {
        expect(formatTimestamp('not-a-date')).toBe('—');
    });
});
