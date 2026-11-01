import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
  async redirects() {
    return [
      {
        source: '/',
        has: [{ type: 'query', key: 'gameCode', value: '(?<gameCode>.+)' }],
        destination: '/play?gameCode=:gameCode',
        permanent: false,
      },
      {
        source: '/how-to-play',
        has: [{ type: 'query', key: 'from', value: 'game' }],
        destination: '/game/rules',
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
