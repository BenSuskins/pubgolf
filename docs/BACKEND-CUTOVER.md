# Backend cutover

> Replace Kotlin and STOMP with Go and SSE as one coordinated release.

## Before cutover

1. Confirm backend tests, OpenAPI checks, frontend build, and browser tests pass for the release commit.
2. Save the exact old frontend and backend image digests.
3. Back up the old SQLite volume while its writer is stopped. Keep the backup and volume unchanged.
4. Create a separate Go database volume. The updated compose file uses `pubgolf-go-data`.
5. Set `DATABASE_PATH=/data/pubgolf-go.db`. Do not point Go at `pubgolf.db`.
6. Confirm volume ownership permits the container's `pubgolf` user to write.
7. Schedule the cutover when no game needs to continue. Old games and player sessions do not transfer.

## Proxy validation

Route `/api/v1` to Go, including the stream path. Disable response buffering and caching for
streams. Set the upstream read timeout above 30 seconds. Retain normal REST timeouts.
Enable HTTP/2 on the browser-facing TLS listener to avoid the HTTP/1.1 browser connection limit.

Example Nginx location, within the existing TLS server:

```nginx
location ~ ^/api/v1/games/[^/]+/stream$ {
    proxy_pass http://pubgolf-backend:8080;
    proxy_http_version 1.1;
    proxy_set_header Connection "";
    proxy_buffering off;
    proxy_cache off;
    proxy_read_timeout 60s;
}
```

Check the real proxy before cutover. Create a test game on the candidate backend, then run:

```bash
curl --http2 -N -i "https://<candidate-api>/api/v1/games/<code>/stream"
```

Confirm HTTP/2 at the TLS listener. Confirm a `game-state` event arrives immediately and heartbeat
comments arrive every 15 seconds. Submit a score from a second browser. Confirm the first browser
updates without reloading. Disconnect and reconnect it. Confirm its state recovers.
The repository's local proxy test proves flushing through an HTTP reverse proxy. It does not prove
production TLS, HTTP/2, buffering, or timeout configuration.

## Cutover

1. Stop old game writes.
2. Start the Go backend on the new volume.
3. Switch the API route and publish the SSE frontend in the same maintenance window.
4. Ask existing browser clients to refresh. Old cached STOMP clients cannot use the Go backend.
5. Clear the old game session through the normal join/create flow and start a new game.
6. Check `/actuator/health`, `/actuator/prometheus`, logs, and the browser live-update flow.
7. Confirm the metrics scrape and game dashboard use `pubgolf_game_started_total` for created games.

## Rollback

1. Stop Go writes.
2. Restore both old frontend and backend image digests.
3. Restore the old API route and mount the retained Kotlin database volume.
4. Ask clients to refresh again.

Games created after the Go cutover remain in the Go volume. They do not appear in the old stack.
Rollback does not merge databases. Do not delete either volume during the rollback window.

## Deployment status

This repository change does not deploy the release. Production proxy and device behavior require
verification during the separate cutover.
