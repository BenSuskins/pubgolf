CREATE TABLE pubs (
    game_id BLOB NOT NULL,
    hole INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    latitude DOUBLE NOT NULL,
    longitude DOUBLE NOT NULL,
    PRIMARY KEY (game_id, hole),
    CONSTRAINT fk_pub_game FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE
);

ALTER TABLE games ADD COLUMN route_geometry TEXT;
