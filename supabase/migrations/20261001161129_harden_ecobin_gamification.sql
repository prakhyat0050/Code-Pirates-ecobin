/*
# EcoBin — Gamification fields and safer public data access

1. New columns on `user_activity`
- `player_name` (text, not null, default `Eco Explorer`) — public nickname shown on the community leaderboard.
- `source` (text, not null, default `text`) — whether the activity came from text or image scanning.

2. Security changes
- `waste_items` remains publicly readable, but anonymous users can no longer insert, update, or delete catalog rows.
- `user_activity` remains publicly readable for the community leaderboard and accepts new activity events.
- Existing update and delete access on activity is removed so points cannot be edited or erased through the browser.
- This app has no sign-in screen, so leaderboard entries are public and nicknames are user-provided rather than verified identities.

3. Important notes
- Existing rows receive the default nickname and source values.
- No existing user data is deleted or renamed.
*/

ALTER TABLE user_activity
  ADD COLUMN IF NOT EXISTS player_name text NOT NULL DEFAULT 'Eco Explorer';

ALTER TABLE user_activity
  ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'text' CHECK (source IN ('text', 'image'));

DROP POLICY IF EXISTS "anon_insert_waste_items" ON waste_items;
DROP POLICY IF EXISTS "anon_update_waste_items" ON waste_items;
DROP POLICY IF EXISTS "anon_delete_waste_items" ON waste_items;

DROP POLICY IF EXISTS "anon_update_user_activity" ON user_activity;
DROP POLICY IF EXISTS "anon_delete_user_activity" ON user_activity;

CREATE INDEX IF NOT EXISTS idx_user_activity_player_name ON user_activity (lower(player_name));
