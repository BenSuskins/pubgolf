# Frontend Error Handling & Reliability Audit

## Summary

22 findings across four categories. The most impactful issues are: (1) `fetchWithRetry` exists but is only wired to one non-critical call, (2) the WebSocket "polling fallback" is advertised but never implemented, and (3) several silent failures on critical paths (score submission setup, pub route saving, par data loading).

---

## (a) Poor Error Messages

| # | File | Line | Issue |
|---|------|------|-------|
| 1 | `lib/api.ts` | 21 | `'Request failed'` generic fallback — no context about which operation or what to do |
| 2 | `app/game/page.tsx` | 94 | `'Failed to load game'` — no guidance (check connection? wrong code?) |
| 3 | `app/game/[code]/host/page.tsx` | 76 | `'Failed to load host panel'` — exposes raw server message including 403/404 text |
| 4 | `app/randomise/page.tsx` | 83 | `'Something went wrong'` catch-all — no context |
| 5 | `hooks/useOptimisticGameState.ts` | 108 | Score conflict toast says "Server has different score" but gives no recovery action |
| 6 | `app/how-to-play/page.tsx` | 77, 82 | Silent empty sections when penalties/holes fail to load — looks like a blank page |

**Recommended fixes:**
- Replace `'Request failed'` with operation-specific messages (e.g., `'Failed to save score — check your connection and try again'`)
- Add a "Retry" or "Go Home" link alongside error messages
- Normalize error display: distinguish user errors (bad input, wrong code) from transient errors (network, server) in message tone
- Score conflict toast should say: "Your score for Hole X was adjusted by the server — tap to re-enter if incorrect"

---

## (b) Missing Retry Logic

| # | File | Line | Issue |
|---|------|------|-------|
| 7 | `lib/api.ts` | 51–70 | `fetchWithRetry` exists but only used for `getRoutes` — all mutations (`submitScore`, `createGame`, `joinGame`, `spinWheel`) call plain `fetch` |
| 8 | `hooks/useGameWebSocket.ts` | 72–74 | After 5 reconnect attempts, sets `connectionError` with "Using polling fallback" — but no polling fallback is implemented anywhere |
| 9 | `app/game/page.tsx` | 91 | `getGameState` called once on mount with no retry; a single transient failure drops the user to an error screen |

**Recommended fixes:**
- Apply `fetchWithRetry` to all read operations (`getGameState`, `getActiveEvent`, `getAvailableEvents`, etc.)
- For mutations, retry once on network error only (not on 4xx), or surface a "Retry" button
- Either implement a polling fallback for WebSocket (e.g., poll `getGameState` every 10s when disconnected) or remove the misleading message
- Add a "Refresh" button to the game error state

---

## (c) Silent Failures

| # | File | Line | Issue |
|---|------|------|-------|
| 10 | `app/game/page.tsx` | 107 | `.catch(() => {})` on `getRoutes()` — par data silently wrong, under/over-par display incorrect |
| 11 | `app/game/page.tsx` | 122–130 | Route check failure silently hides "See Route" button with no explanation |
| 12 | `components/CreateGameForm.tsx` | 59–64 | `setPubs` failure is caught but user is redirected anyway; pub route silently not saved |
| 13 | `hooks/useGameWebSocket.ts` | 56–60 | Malformed WebSocket messages silently discarded; scoreboard silently freezes |
| 14 | `components/ShareModal.tsx` | 63–69 | `setCopied(true)` fires even when clipboard copy fails — user sees "Copied!" for nothing |
| 15 | `app/submit-score/page.tsx` | 64–66 | Failed parallel fetch (`Promise.all`) silently uses empty defaults — no pars, no penalties shown |

**Recommended fixes:**
- Replace `.catch(() => {})` with at minimum a `console.warn` and a visible fallback indicator
- `setPubs` failure: either block redirect and show error ("Route not saved — continue anyway?") or show a toast warning after redirect
- Clipboard failure: show "Copy failed — code is [XXX]" instead of false "Copied!" confirmation
- `submit-score` parallel fetch failure: surface a retry button rather than showing an empty form

---

## (d) Reliability Gaps

| # | File | Line | Issue |
|---|------|------|-------|
| 16 | `lib/api.ts` | 83–88+ | No `AbortController` on any fetch — stalled mobile requests hang indefinitely; submit button locks forever |
| 17 | `lib/api.ts` | 24–30 | 401 clears localStorage and redirects silently — user mid-game gets unexplained redirect |
| 18 | `app/game/page.tsx` | 74–79 | `isConnected` and `connectionError` from `useGameWebSocket` are never consumed — users have no visibility into live update status |
| 19 | `app/game/page.tsx` | 78 | WebSocket disabled during initial HTTP load — updates arriving in that window are missed |
| 20 | `hooks/useOptimisticGameState.ts` | 127 | `cellStates` used inside effect without being a dependency (suppressed lint warning) — stale closure causes flicker or lost pending indicators on rapid updates |
| 21 | `components/CreateGameForm.tsx` | 37 | `handlePubRemove(index)` uses `slice(0, index)` — removes all pubs from index onwards, not just the one targeted |
| 22 | `app/game/[code]/host/page.tsx` | 85–130 | Stale error state not cleared before retrying host actions — old error message persists even after subsequent success |

**Recommended fixes:**
- Add a 15–30s `AbortController` timeout to all fetch calls, surface a "Request timed out" message
- On 401: show a toast ("Your session expired") before redirecting
- Display a connection indicator on the scoreboard (green/amber dot) using `isConnected`
- Fix `handlePubRemove`: `selectedPubs.filter((_, i) => i !== index)`
- Clear `error` state at the start of each host action handler
- Add `cellStates` to effect dependencies or restructure to avoid stale closure

---

## Priority Order

1. **High — data correctness**: `handlePubRemove` data loss bug (#21), silent `setPubs` failure (#12), silent par data fallback (#10)
2. **High — user trust**: fetch timeouts (#16), 401 silent redirect (#17), false "Copied!" (#14)
3. **Medium — reliability**: apply `fetchWithRetry` to mutations (#7), real WS polling fallback or honest error message (#8)
4. **Medium — visibility**: show connection status on scoreboard (#18), clear stale error state (#22)
5. **Low — UX polish**: improve all error message text (#1–6), add Retry buttons (#9, #15)
