# Game

The Game context manages a nine-hole pub golf game. It owns players, scores, the course,
gameplay events, and the pub route.

## Language

**Game**:
The consistency boundary for a shared pub golf session, including its host and players.

**Host**:
The player who creates a game and controls its course, pub route, gameplay events, and completion.

**Hole**:
One of nine numbered stages in a game. Each hole has a par and drink choices.

**Score**:
The recorded strokes for a player on a hole, including any penalty adjustment.
Zero is a valid played score; an absent score means the hole is unplayed.

**Par**:
The target number of strokes for a hole.

**Course**:
The nine holes with their pars and drink choices. A game uses the default course until the host changes it.

**DrinkTrack**:
A named sequence of drink choices across the course, such as Track A or Track B.
_Avoid_: Drink route, route

**PubRoute**:
The ordered nine pubs for a game, with optional walking geometry.
_Avoid_: DrinkTrack, course

**GameplayEvent**:
A game modifier with a title and description. A definition can become the active gameplay event;
the host can also activate a custom gameplay event.
_Avoid_: DomainEvent, generic event

**DomainEvent**:
A fact about a completed game change, such as GameCreated, PlayerJoined, ScoreSubmitted,
CourseChanged, or GameplayEventActivated.
_Avoid_: GameplayEvent, event-kind payload

**Randomise**:
A player's one-time random outcome, assigned to their first unplayed hole.

**Penalty**:
A score adjustment for a hole. SKIP records five strokes; CHUNDER records ten.

The public API retains existing field names such as `activeEvent` and `routes`.
These compatibility names do not change the domain terms above.
