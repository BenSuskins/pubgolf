// Google resolves the site name shown in search results from WebSite structured
// data before it considers og:site_name, <title> or headings, and falls back to
// the bare domain when none of them settle it. The WebApplication node describes
// the app; only the WebSite node names the site.
//
// Both belong on the homepage specifically, which is why this lives here rather
// than in the root layout.
const SITE_URL = 'https://pubgolf.me';

export const homeStructuredData = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebSite',
      '@id': `${SITE_URL}/#website`,
      name: 'Pub Golf',
      description:
        'Free pub golf score tracker. Host a round, share the game code, and track every sip on a live leaderboard across nine holes.',
      url: SITE_URL,
      inLanguage: 'en-GB',
    },
    {
      '@type': 'WebApplication',
      '@id': `${SITE_URL}/#webapp`,
      name: 'Pub Golf',
      description:
        'Free pub golf score tracker. Host a round, share the game code, and track every sip on a live leaderboard across nine holes.',
      url: SITE_URL,
      isPartOf: { '@id': `${SITE_URL}/#website` },
      applicationCategory: 'GameApplication',
      operatingSystem: 'Any',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'GBP',
      },
      author: {
        '@type': 'Person',
        name: 'Ben Suskins',
      },
    },
  ],
};

// Static, compile-time content; "<" is escaped as recommended for JSON-LD so the
// payload can never terminate the script element early.
export const homeStructuredDataJson = JSON.stringify(homeStructuredData).replace(
  /</g,
  '\\u003c'
);
