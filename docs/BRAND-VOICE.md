# Pub Golf voice

Pub Golf sounds like a friendly host who knows the rules and keeps the round moving. It is playful and clear. Use a little golf and pub language when it fits; make the next action easy to understand.

## Principles

- **Clear first.** Use short, direct sentences and familiar words. Name the action and the result.
- **Playful in the right places.** A welcome or result can have a light golf reference. Keep instructions, errors, and accessibility labels direct.
- **Friendly to everyone.** Never pressure someone to drink or make a player the joke. A round can include non-alcoholic drinks.
- **Honest about the game.** Describe what the app actually does. A penalty records a score for the hole; it does not add sips to a drink.

## Words to use

| Term | Use |
| --- | --- |
| Round | The shared experience: host, join, resume, and complete a round. |
| Game code | The code players enter to join. Keep the existing API term in technical contexts. |
| Leaderboard | The screen that shows players and scores. |
| Hole, par, score | The stage, target, and recorded strokes. Use “sips” only for the number of sips taken. |
| Wildcard | The one-time wheel action. Reserve “randomise” for existing API and code names. |
| Course | The nine holes, drinks, and pars. A drink route is a set of drink choices; a pub route is the places visited. |
| Host | The player who sets up and manages a round. |

Use sentence case for new prose and controls. Preserve established display typography where the interface uses it. Address the player as “you” when useful. Use an imperative for actions, such as “Join a round” or “Log your sips.”

## Tone by moment

- **Welcome and success:** Warm and upbeat. “Your round is ready” is enough; avoid piling on puns.
- **Instructions and rules:** Explain the action and its outcome. Use the same terms as the controls.
- **Errors:** Say what happened and, when possible, what the player can do next. Do not joke about a failure or expose internal details unnecessarily.
- **Legal and privacy:** Use precise, plain language. Do not trade accuracy for personality.

## Server-provided copy

Preset events, penalty labels, and wheel outcomes come from the backend and are part of the public API. Keep their language consistent with this guide when changing the catalog, and assess API compatibility before changing existing values. The frontend may translate known server errors into clear player-facing messages without changing the wire contract. Keep unknown errors useful and preserve user-written event titles, descriptions, player names, and course names as entered.

## Examples

| Instead of | Use |
| --- | --- |
| “Invalid player identity” | “You’re not part of this round. Rejoin to continue.” |
| “Randomise already used” | “You’ve already used your Wildcard this round.” |
| “15 sips” for a total that includes penalties | “15 strokes” |
