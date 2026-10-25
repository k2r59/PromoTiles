-- Existing players retain their scores and confirm a unique nickname once.
ALTER TABLE players ADD COLUMN nickname_key TEXT;
CREATE UNIQUE INDEX players_nickname_unique ON players(nickname_key);
CREATE TABLE auth_codes (
 id TEXT PRIMARY KEY,
 email TEXT NOT NULL,
 digest TEXT NOT NULL,
 expires INTEGER NOT NULL,
 attempts INTEGER NOT NULL DEFAULT 0,
 consumed INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX auth_codes_expiry ON auth_codes(expires);
CREATE INDEX auth_codes_email ON auth_codes(email);
CREATE TABLE auth_sessions (
 digest TEXT PRIMARY KEY,
 email TEXT NOT NULL,
 created INTEGER NOT NULL,
 expires INTEGER NOT NULL
);
CREATE INDEX auth_sessions_expiry ON auth_sessions(expires);
