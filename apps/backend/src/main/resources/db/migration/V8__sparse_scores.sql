-- Score rows are now only written for holes a player has actually submitted.
-- Historically every player was seeded with nine zero-score rows and the UI
-- displayed a 0 as "not played", so existing zero rows are dropped to match.
DELETE FROM scores WHERE score = 0;
