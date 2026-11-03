import { describe, expect, test } from 'bun:test';
import { renderToStaticMarkup } from 'react-dom/server';
import HowToPlayPage from './page';

describe('public guide', () => {
  test('provides rules, penalties and an example course in the initial HTML', () => {
    const html = renderToStaticMarkup(<HowToPlayPage />);
    expect(html).toContain('Skip a drink');
    expect(html).toContain('Tactical chunder');
    expect(html).toContain('Tequila');
    expect(html).toContain('Smirnoff Ice');
    expect(html).toContain('example course');
  });
});
