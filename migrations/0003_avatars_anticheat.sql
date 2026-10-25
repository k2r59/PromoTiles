ALTER TABLE players ADD COLUMN avatar TEXT NOT NULL DEFAULT '';
ALTER TABLE performances ADD COLUMN replay_hash TEXT;
ALTER TABLE performances ADD COLUMN audit_flags TEXT NOT NULL DEFAULT '[]';
CREATE UNIQUE INDEX performances_replay_unique ON performances(song,mode,revision,replay_hash) WHERE replay_hash IS NOT NULL;
CREATE TABLE anti_cheat_events (
 id TEXT PRIMARY KEY,
 player TEXT NOT NULL REFERENCES players(id),
 round_id TEXT,
 reason TEXT NOT NULL,
 created INTEGER NOT NULL
);
CREATE INDEX anti_cheat_events_player_created ON anti_cheat_events(player,created);
