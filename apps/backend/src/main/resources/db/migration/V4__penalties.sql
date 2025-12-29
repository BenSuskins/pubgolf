CREATE TABLE player_penalties (
    player_id BLOB NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    hole INTEGER NOT NULL,
    penalty_type TEXT NOT NULL,
    created TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (player_id, hole)
);
