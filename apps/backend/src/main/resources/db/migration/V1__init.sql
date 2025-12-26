CREATE TABLE games (
    id BLOB PRIMARY KEY,
    code VARCHAR(255) UNIQUE NOT NULL
);

CREATE TABLE players (
    id BLOB PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    game_id BLOB NOT NULL,
    CONSTRAINT fk_game FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE
);

CREATE TABLE scores (
    player_id BLOB NOT NULL,
    hole INT NOT NULL,
    score INT NOT NULL,
    PRIMARY KEY (player_id, hole),
    CONSTRAINT fk_player FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE
);