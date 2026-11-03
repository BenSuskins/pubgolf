import { afterEach, describe, expect, mock, test } from 'bun:test';
import { renderToStaticMarkup } from 'react-dom/server';
import HowToPlayPage from './page';

const originalFetch = global.fetch;
afterEach(() => { global.fetch = originalFetch; });

describe('public guide', () => {
  test('renders the backend course and penalties in the initial HTML', async () => {
    global.fetch = mock((url: string | URL | Request) => Promise.resolve(
      new Response(JSON.stringify(String(url).includes('penalty-options')
        ? { penalties: [{ type: 'SKIP', name: 'Skip a drink', points: 5 }] }
        : { holes: [{ hole: 1, par: 3, drinks: { 'House route': 'Example drink', 'Second route': 'Another drink' } }] }))
    )) as typeof fetch;
    const html = renderToStaticMarkup(await HowToPlayPage());
    expect(html).toContain('Skip a drink');
    expect(html).toContain('Example drink');
    expect(html).toContain('House route');
  });

  test('keeps the guide readable when the backend is unavailable', async () => {
    global.fetch = mock(() => Promise.reject(new Error('offline'))) as typeof fetch;
    const html = renderToStaticMarkup(await HowToPlayPage());
    expect(html).toContain('Scoring example');
    expect(html).not.toContain('unavailable');
    expect(html).not.toContain('Example drink');
  });
});
