# Pub Golf Redesign 2026

## Context
Recreate the high-fidelity "clubhouse/scorecard" redesign (design handoff in
`~/Downloads/design_handoff_pubgolf_redesign/`) in the existing Next.js frontend.
Replaces the dark-dashboard look with a dark-green + brass/gold identity,
golf-native scoring (under/over par), Anton + Space Grotesk typography, and
one-handed mobile layouts.

Decisions (confirmed):
- Frontend-only — no backend changes. Event banner shows no countdown (API has no duration).
- Update all tests (component + E2E) to match the new UI.
- One pass on branch `redesign-2026`, single commit.

## What changed
1. **Tokens & fonts** — `app/globals.css` re-tokened to the handoff palette
   (bg `#0d1410`, surface `#141f18`, gold `#c9a24b`/`#e0b95d`, cream `#f4ead9`,
   under-par `#5ee38a`, over-par `#e8735f`); `.glass` is now a solid clubhouse card;
   new `.surface-inset`/`.surface-gold`/`.surface-danger`/`.eyebrow` utilities
   (component classes live in `@layer components` so Tailwind utilities can override);
   `app/layout.tsx` loads Anton (`--font-anton`) + Space Grotesk (`--font-space-grotesk`),
   restyled footer, themeColor `#0d1410`.
2. **Primitives** — Button (danger = destructive surface), Card (20px radius, gold borders),
   Input/Select (eyebrow labels, inset fields), Counter (52px circular ±, Anton digit),
   Typography (display/title/heading = Anton uppercase).
3. **New components** — `GolfBallLogo`, `ui/SegmentedControl`, `Leaderboard`
   (ranked expandable list w/ 9-hole strip, penalties 🤢/🚫, wildcard 🎲, par-relative
   totals; replaces the deleted `ScoreboardTable`), `HoleChips` (jump-to-hole strip),
   `lib/scoring.ts` (hasPlayedHole/parRelativeTotal/formatParRelative/firstUnplayedHole —
   NOTE: backend initialises every hole score to 0, so 0 is treated as "not played").
4. **Screens** — Home (hero gradient, segmented Host/Join, TEE OFF/JOIN THE ROUND, route-map
   toggle switch), Leaderboard page (Rules/Invite pills, event banner, thumb-zone LOG YOUR
   SIPS + Wildcard + Host Panel), Log sips (hole chips, stepper card, Par/Skip/Chunder cards,
   LOG IT), Wildcard (renamed from Randomise; route stays `/randomise`), Rules (phone-width
   cards, red penalty rows, 4-col course table), Host panel (Host Mode eyebrow, Anton code,
   destructive End Game, event cards w/ Active badge), Invite (`ShareModal`: cream QR card,
   gold Anton code, COPY INVITE LINK).
5. **Favicon** — `app/icon.png` + resized `public/icon-192.png`, `icon-512.png`,
   `apple-touch-icon.png` from the design bundle.
6. **Tests** — all component tests updated + new tests for SegmentedControl, Leaderboard,
   HoleChips, scoring; E2E specs updated (Host a Round/Join a Round/Tee Off/Join the Round,
   hole chips instead of `#hole` select, leaderboard list instead of `table tbody tr`).

## Verification (done)
- `bun test`: 417 pass. `bun run lint`: clean. `bun run build`: succeeds.
- `make e2e`: 78/78 pass (chromium + mobile-chrome).
