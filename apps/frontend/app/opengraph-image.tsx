import { ImageResponse } from 'next/og';

export const alt = 'Pub Golf — 9 Holes. 9 Drinks. 1 Champion.';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#0d1410',
          backgroundImage: 'radial-gradient(circle at 50% 30%, #1a2a1f 0%, #0d1410 65%)',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textTransform: 'uppercase',
          }}
        >
          <div
            style={{
              fontSize: 160,
              fontWeight: 800,
              lineHeight: 1,
              color: '#f4f7f4',
              letterSpacing: -4,
            }}
          >
            Pub Golf
          </div>
          <div
            style={{
              marginTop: 36,
              fontSize: 40,
              color: '#c9b458',
              letterSpacing: 6,
            }}
          >
            9 Holes · 9 Drinks · 1 Champion
          </div>
          <div
            style={{
              marginTop: 48,
              fontSize: 30,
              color: '#8fa396',
              letterSpacing: 2,
            }}
          >
            Free score tracker for your pub crawl — pubgolf.me
          </div>
        </div>
      </div>
    ),
    size
  );
}
