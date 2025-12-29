# Complete Game Feature Specification

## Overview

Add the ability for the host (the first player to join the game) to mark the game as complete. Once complete, the game is permanently locked - no further score submissions or player joins are allowed.

## Host Identity

- **Host assignment**: The first player to join a game becomes the host
- **Host persistence**: Once assigned, the host cannot be changed or transferred
- **Host visibility**: A crown icon is displayed next to the host's name on the leaderboard, visible to all players
- **Model change**: Add `hostPlayerId` field to the Game model, set when the first player joins

## Game Status

- **Model representation**: Use a `GameStatus` enum with values: `ACTIVE`, `COMPLETED`
- **Irreversibility**: Once a game is marked `COMPLETED`, it cannot be reopened
- **Data retention**: Completed games persist indefinitely

## Completing a Game

### API Endpoint

```
POST /api/v1/games/{gameCode}/complete
```

**Request body**:
```json
{
  "playerId": "<hostPlayerId>"
}
```

**Authorization**: Only the host (identified by `playerId` matching `hostPlayerId`) can complete the game.

**Error responses**:
- `403 Forbidden` with message "Only the host can complete this game" if `playerId` does not match `hostPlayerId`
- `404 Not Found` if game does not exist
- `409 Conflict` if game is already completed

**Success response**: Returns the updated game state.

### Completion Rules

- **No restrictions**: Host can complete the game at any time, regardless of how many players have joined or how many scores have been submitted
- **Race conditions**: If a player submits a score while the host is completing the game, the submission is silently rejected with a generic "game ended" message

## Host UI

### Complete Game Button

- **Location**: Visible button on the host's game view
- **Confirmation**: Modal dialog asking "Are you sure you want to complete this game?" with Cancel and Complete buttons
- **Visibility**: Only shown to the host (based on current player's `playerId` matching `hostPlayerId`)

## Completed Game Experience

### Celebration Screen

- **Display**: Shows every time any player opens a completed game
- **Content**: Clean winner announcement with large text and trophy icon (no animations)
- **Tie handling**: If multiple players are tied for first place, all tied players are announced as joint winners
- **Winner calculation**: Frontend calculates the winner(s) from the scores array
- **Navigation**: Tap anywhere on the celebration screen to proceed to full results

### Results View

- **Banner**: "Game Complete" banner displayed at the top of the leaderboard
- **Leaderboard**: Same appearance as active game, but with disabled action buttons
- **Host indicator**: Crown icon next to host's name remains visible

### Blocked Actions

When a game is complete:
- **Score submission**: Disabled, buttons hidden or greyed out
- **Spin wheel**: Disabled
- **Join game**: Blocked - show "This game has ended" with no access to view results

## Notifications

- **None**: Players are not notified when a game is completed. They discover the completed state when they next interact with the app.

## Backend Changes Required

1. **Game model**: Add `hostPlayerId: PlayerId?` field
2. **Game model**: Add `status: GameStatus` enum field (default: `ACTIVE`)
3. **GameStatus enum**: Create with values `ACTIVE`, `COMPLETED`
4. **Join game logic**: Set `hostPlayerId` to the joining player's ID if `hostPlayerId` is currently null
5. **Complete game endpoint**: New `POST /{gameCode}/complete` endpoint
6. **Score submission**: Check game status, reject if `COMPLETED`
7. **Join game**: Check game status, reject if `COMPLETED`
8. **Failure types**: Add `GameAlreadyCompleted`, `NotHostPlayer` failure types

## Frontend Changes Required

1. **API client**: Add `completeGame(gameCode, playerId)` function
2. **Game state**: Handle `status` field from API response
3. **Host detection**: Compare current player ID with `hostPlayerId` from game state
4. **Complete button**: Render for host only, with modal confirmation
5. **Celebration screen**: New component shown when game is completed
6. **Results view**: Add "Game Complete" banner
7. **Crown icon**: Display next to host name in leaderboard
8. **Disable actions**: Hide/disable score submission and wheel buttons when complete
9. **Join flow**: Handle "game ended" response for completed games

## E2E Test Scenarios

1. Host can complete a game via the complete button with confirmation
2. Non-host player does not see complete button
3. Completed game shows celebration screen with winner
4. Completed game with tie shows multiple winners
5. Completed game shows "Game Complete" banner on results
6. Score submission is blocked on completed game
7. Joining a completed game shows "game ended" error
8. Host crown is visible on leaderboard
