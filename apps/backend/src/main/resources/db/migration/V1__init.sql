CREATE TABLE games (
    id UUID PRIMARY KEY,
    code VARCHAR(255) UNIQUE NOT NULL
);

CREATE TABLE players (
    id UUID PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    game_id UUID NOT NULL,
    CONSTRAINT fk_game FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE
);

CREATE TABLE scores (
    player_id UUID NOT NULL,
    hole INT NOT NULL,
    score INT NOT NULL,
    PRIMARY KEY (player_id, hole),
    CONSTRAINT fk_player FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE
);