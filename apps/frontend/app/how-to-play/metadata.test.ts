import { expect, test } from 'bun:test';
import { metadata } from './layout';

test('sharing metadata identifies the rules guide', () => {
  expect(metadata.openGraph).toMatchObject({
    title: 'How to Play Pub Golf — Rules, Scoring & Penalties',
    url: 'https://pubgolf.me/how-to-play',
  });
});
