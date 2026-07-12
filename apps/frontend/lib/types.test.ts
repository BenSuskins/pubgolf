import { describe, test, expect } from 'bun:test';
import { PENALTY_EMOJI_MAP } from './types';

describe('PENALTY_EMOJI_MAP', () => {
  test('should map SKIP to prohibited emoji', () => {
    expect(PENALTY_EMOJI_MAP.SKIP).toBe('🚫');
  });

  test('should map CHUNDER to nauseated emoji', () => {
    expect(PENALTY_EMOJI_MAP.CHUNDER).toBe('🤢');
  });
});
