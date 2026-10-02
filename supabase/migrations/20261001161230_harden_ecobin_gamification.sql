/*
# EcoBin — Complete public write hardening

1. Permission changes
- `waste_items` is read-only for browser roles; catalog changes stay outside the public app.
- `user_activity` is append-only for browser roles; public users may read leaderboard data and add new activity events.

2. Security
- Revoke INSERT, UPDATE, and DELETE on `waste_items` from anon and authenticated.
- Revoke UPDATE and DELETE on `user_activity` from anon and authenticated.
- Existing RLS policies remain unchanged and continue to allow only the intended SELECT and INSERT operations.

3. Important notes
- No rows are deleted or modified.
- This is a no-login public demo, so activity events remain publicly readable by design.
*/

REVOKE INSERT, UPDATE, DELETE ON waste_items FROM anon, authenticated;
REVOKE UPDATE, DELETE ON user_activity FROM anon, authenticated;

GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON TABLE public.waste_items TO anon, authenticated;
GRANT SELECT, INSERT ON TABLE public.user_activity TO anon, authenticated;
