PRAGMA foreign_keys = ON;
CREATE TABLE players (
 id TEXT PRIMARY KEY,
 email TEXT NOT NULL COLLATE NOCASE UNIQUE,
 name TEXT NOT NULL CHECK(length(name) BETWEEN 2 AND 24),
 created INTEGER NOT NULL,
 CHECK(email = lower(trim(email))),
 CHECK(length(email) > 10 AND email LIKE '%@promo.dev' AND instr(email, '@') = length(email) - 9)
);
CREATE TABLE rounds (
 id TEXT PRIMARY KEY,
 player TEXT NOT NULL REFERENCES players(id),
 song TEXT NOT NULL,
 mode TEXT NOT NULL CHECK(mode IN ('facile','normal','difficile')),
 revision TEXT NOT NULL,
 started INTEGER NOT NULL,
 used INTEGER NOT NULL DEFAULT 0 CHECK(used IN (0,1))
);
CREATE INDEX rounds_player_started ON rounds(player, started);
CREATE TABLE performances (
 round_id TEXT PRIMARY KEY REFERENCES rounds(id),
 player TEXT NOT NULL REFERENCES players(id),
 song TEXT NOT NULL,
 mode TEXT NOT NULL,
 revision TEXT NOT NULL,
 score INTEGER NOT NULL CHECK(score >= 0),
 accuracy INTEGER NOT NULL CHECK(accuracy BETWEEN 0 AND 100),
 combo INTEGER NOT NULL,
 holds INTEGER NOT NULL,
 played INTEGER NOT NULL,
 result_json TEXT NOT NULL
);
CREATE INDEX performances_player_played ON performances(player, played DESC);
CREATE TABLE scores (
 player TEXT NOT NULL REFERENCES players(id),
 song TEXT NOT NULL,
 mode TEXT NOT NULL,
 revision TEXT NOT NULL,
 score INTEGER NOT NULL,
 accuracy INTEGER NOT NULL,
 combo INTEGER NOT NULL,
 holds INTEGER NOT NULL,
 played INTEGER NOT NULL,
 PRIMARY KEY(player,song,mode)
);
-- A submission, round consumption and best-score update are one atomic statement.
CREATE TRIGGER store_best_score AFTER INSERT ON performances BEGIN
 UPDATE rounds SET used = 1 WHERE id = NEW.round_id;
 INSERT INTO scores(player,song,mode,revision,score,accuracy,combo,holds,played)
 VALUES(NEW.player,NEW.song,NEW.mode,NEW.revision,NEW.score,NEW.accuracy,NEW.combo,NEW.holds,NEW.played)
 ON CONFLICT(player,song,mode) DO UPDATE SET
 revision=excluded.revision,score=excluded.score,accuracy=excluded.accuracy,
 combo=excluded.combo,holds=excluded.holds,played=excluded.played
 WHERE scores.revision != excluded.revision OR excluded.score >= scores.score;
END;
CREATE TABLE rate_limits (key TEXT PRIMARY KEY, count INTEGER NOT NULL, expires INTEGER NOT NULL);
