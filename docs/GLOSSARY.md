# Round

The Round context covers a shared nine-hole pub golf round, its players, course, scores,
events, and pub route.

## Language

**Round**:
A shared nine-hole pub golf session, including its host and players.
_Avoid_: Game

**Host**:
The player who creates a round and controls its course, pub route, events, and completion.

**Hole**:
One of nine numbered stages in a round. Each hole has a par and drink choices.

**Score**:
The strokes recorded for a player on a hole, including a penalty score when one is selected.
Zero is a valid played score; an absent score means the hole is unplayed.

**Par**:
The target number of strokes for a hole.

**Course**:
The nine holes with their pars and drink choices. A round uses the default course until the host changes it.

**DrinkTrack**:
A named sequence of drink choices across the course, such as Track A or Track B.
_Avoid_: Drink route, route

**PubRoute**:
The ordered nine pubs for a round, with optional walking geometry.
_Avoid_: DrinkTrack, course

**GameplayEvent**:
A round modifier with a title and description. The host can activate a preset or a custom event.
_Avoid_: DomainEvent, generic event

**DomainEvent**:
A fact about a completed round change, such as RoundCreated, PlayerJoined, ScoreSubmitted,
CourseChanged, or GameplayEventActivated.
_Avoid_: GameplayEvent, event-kind payload

**Wildcard**:
A player's one-time random outcome, assigned to their first unplayed hole.
_Avoid_: Randomise

**Penalty**:
A recorded score for a hole in place of the sip count. SKIP records five strokes; CHUNDER records ten.
