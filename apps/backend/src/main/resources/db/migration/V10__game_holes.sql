CREATE TABLE game_holes (
    game_id BLOB NOT NULL,
    hole INT NOT NULL,
    par INT NOT NULL,
    drinks TEXT NOT NULL,
    PRIMARY KEY (game_id, hole),
    CONSTRAINT fk_game_hole_game FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE
);
