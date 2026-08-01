import { describe, test, expect } from 'bun:test';
import { homeStructuredData, homeStructuredDataJson } from './homeStructuredData';

type StructuredDataNode = { '@type': string; [key: string]: unknown };

const nodeOfType = (type: string): StructuredDataNode | undefined =>
  homeStructuredData['@graph'].find((node) => node['@type'] === type);

describe('homeStructuredData', () => {
  test('declares a WebSite node so Google has a site name to prefer over the domain', () => {
    expect(nodeOfType('WebSite')).toMatchObject({
      name: 'Pub Golf',
      url: 'https://pubgolf.me',
    });
  });

  test('keeps the WebApplication node describing the app itself', () => {
    expect(nodeOfType('WebApplication')).toMatchObject({
      name: 'Pub Golf',
      url: 'https://pubgolf.me',
      applicationCategory: 'GameApplication',
    });
  });

  test('uses the same url as the sitemap and canonical link', () => {
    const urls = homeStructuredData['@graph'].map((node) => node.url);

    expect(urls).toEqual(['https://pubgolf.me', 'https://pubgolf.me']);
  });

  test('serialises to valid JSON-LD', () => {
    expect(JSON.parse(homeStructuredDataJson)).toEqual(
      JSON.parse(JSON.stringify(homeStructuredData))
    );
  });

  test('escapes "<" so the payload cannot terminate the script element early', () => {
    expect(homeStructuredDataJson).not.toContain('<');
  });
});
