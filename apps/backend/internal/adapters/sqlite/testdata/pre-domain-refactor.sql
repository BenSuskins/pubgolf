BEGIN TRANSACTION;
CREATE TABLE games (
 id TEXT PRIMARY KEY,
 code TEXT NOT NULL COLLATE NOCASE UNIQUE,
 status TEXT NOT NULL,
 host_player_id TEXT NOT NULL,
 version INTEGER NOT NULL,
 active_event TEXT,
 route TEXT
);
INSERT INTO "games" VALUES('compat-game','PAR123','ACTIVE','compat-host',1,'{"ID":"custom","Title":"Custom","Description":"Hello","ActivatedAt":"1970-01-01T00:00:44Z"}','{"Type":"LineString","Coordinates":[[-0.1,51.5],[-0.2,51.6]]}');
CREATE TABLE goose_db_version (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		version_id INTEGER NOT NULL,
		is_applied INTEGER NOT NULL,
		tstamp TIMESTAMP DEFAULT (datetime('now'))
	);
INSERT INTO "goose_db_version" VALUES(1,0,1,'2026-11-01 16:46:55');
INSERT INTO "goose_db_version" VALUES(2,1,1,'2026-11-01 16:46:55');
CREATE TABLE holes (
 game_id TEXT NOT NULL REFERENCES games(id) ON DELETE CASCADE,
 hole INTEGER NOT NULL,
 par INTEGER NOT NULL,
 drinks TEXT NOT NULL,
 PRIMARY KEY(game_id,hole)
);
INSERT INTO "holes" VALUES('compat-game',1,1,'[{"Route":"Route A","Name":"Tequila"},{"Route":"Route B","Name":"Sambuca"}]');
INSERT INTO "holes" VALUES('compat-game',2,3,'[{"Route":"Route A","Name":"Beer"},{"Route":"Route B","Name":"Double Vodka \u0026 Single Vodka w/ Mixer"}]');
INSERT INTO "holes" VALUES('compat-game',3,2,'[{"Route":"Route A","Name":"Wine"},{"Route":"Route B","Name":"Double Gin w/ Mixer"}]');
INSERT INTO "holes" VALUES('compat-game',4,2,'[{"Route":"Route A","Name":"Cider"},{"Route":"Route B","Name":"Double Rum w/ Mixer"}]');
INSERT INTO "holes" VALUES('compat-game',5,2,'[{"Route":"Route A","Name":"Cocktail"},{"Route":"Route B","Name":"Cocktail"}]');
INSERT INTO "holes" VALUES('compat-game',6,2,'[{"Route":"Route A","Name":"Spirit w/ Mixer"},{"Route":"Route B","Name":"Spirit w/ Mixer"}]');
INSERT INTO "holes" VALUES('compat-game',7,4,'[{"Route":"Route A","Name":"Guinness"},{"Route":"Route B","Name":"2 x Double Whiskey w/ Mixer"}]');
INSERT INTO "holes" VALUES('compat-game',8,1,'[{"Route":"Route A","Name":"Jägerbomb"},{"Route":"Route B","Name":"Jägerbomb"}]');
INSERT INTO "holes" VALUES('compat-game',9,1,'[{"Route":"Route A","Name":"VK"},{"Route":"Route B","Name":"Smirnoff Ice"}]');
CREATE TABLE players (
 id TEXT PRIMARY KEY,
 game_id TEXT NOT NULL REFERENCES games(id) ON DELETE CASCADE,
 position INTEGER NOT NULL,
 name TEXT NOT NULL,
 randomise TEXT
);
INSERT INTO "players" VALUES('compat-host','compat-game',0,'Alice',NULL);
INSERT INTO "players" VALUES('compat-bob','compat-game',1,'Bob','{"Hole":1,"Result":"Tequila"}');
CREATE TABLE pubs (
 game_id TEXT NOT NULL REFERENCES games(id) ON DELETE CASCADE,
 hole INTEGER NOT NULL,
 name TEXT NOT NULL,
 latitude REAL NOT NULL,
 longitude REAL NOT NULL,
 PRIMARY KEY(game_id,hole)
);
INSERT INTO "pubs" VALUES('compat-game',1,'Test pub',51.5,-0.1);
INSERT INTO "pubs" VALUES('compat-game',2,'Test pub',51.5,-0.1);
INSERT INTO "pubs" VALUES('compat-game',3,'Test pub',51.5,-0.1);
INSERT INTO "pubs" VALUES('compat-game',4,'Test pub',51.5,-0.1);
INSERT INTO "pubs" VALUES('compat-game',5,'Test pub',51.5,-0.1);
INSERT INTO "pubs" VALUES('compat-game',6,'Test pub',51.5,-0.1);
INSERT INTO "pubs" VALUES('compat-game',7,'Test pub',51.5,-0.1);
INSERT INTO "pubs" VALUES('compat-game',8,'Test pub',51.5,-0.1);
INSERT INTO "pubs" VALUES('compat-game',9,'Test pub',51.5,-0.1);
CREATE TABLE scores (
 player_id TEXT NOT NULL REFERENCES players(id) ON DELETE CASCADE,
 hole INTEGER NOT NULL CHECK(hole BETWEEN 1 AND 9),
 score INTEGER NOT NULL CHECK(score BETWEEN -10 AND 10),
 modified TEXT NOT NULL,
 penalty TEXT NOT NULL,
 PRIMARY KEY(player_id,hole)
);
INSERT INTO "scores" VALUES('compat-host',1,0,'1970-01-01T00:00:42Z','');
INSERT INTO "scores" VALUES('compat-bob',2,5,'1970-01-01T00:00:43Z','SKIP');
DELETE FROM "sqlite_sequence";
INSERT INTO "sqlite_sequence" VALUES('goose_db_version',2);
COMMIT;
