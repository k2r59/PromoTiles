-- Bind sessions to the account ID, not just an email that may later be reused.
ALTER TABLE auth_sessions ADD COLUMN player TEXT REFERENCES players(id) ON DELETE CASCADE;
UPDATE auth_sessions SET player=(SELECT id FROM players WHERE players.email=auth_sessions.email);
DELETE FROM auth_sessions WHERE player IS NULL;
CREATE INDEX auth_sessions_player ON auth_sessions(player);
CREATE TRIGGER revoke_deleted_player_auth AFTER DELETE ON players BEGIN
 DELETE FROM auth_sessions WHERE email=OLD.email;
 DELETE FROM auth_codes WHERE email=OLD.email;
END;
