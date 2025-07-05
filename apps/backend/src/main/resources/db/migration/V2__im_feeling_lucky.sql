ALTER TABLE scores ADD COLUMN modified TIMESTAMP NOT NULL DEFAULT now();

CREATE TABLE player_lucky (
    game_id UUID NOT NULL REFERENCES games(id),
    player_id UUID NOT NULL REFERENCES players(id),
    hole INTEGER NOT NULL,
    outcome TEXT NOT NULL,
    created TIMESTAMP NOT NULL DEFAULT now(),
    UNIQUE (game_id, player_id)
);