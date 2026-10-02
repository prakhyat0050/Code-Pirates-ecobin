/*
# EcoBin — Create waste_items and user_activity tables (single-tenant, no auth)

1. New Tables
- `waste_items`: A catalog of known waste items with their classification and disposal instructions.
  - `id` (uuid, primary key)
  - `name` (text, not null) — name of the waste item (e.g. "banana peel")
  - `category` (text, not null) — one of 'Wet', 'Dry', 'E-Waste'
  - `disposal_instructions` (text, not null) — how to dispose of the item properly
  - `eco_points` (int, default 10) — points awarded for correct classification
  - `keywords` (text) — comma-separated keywords for fuzzy matching
  - `created_at` (timestamptz)
- `user_activity`: Tracks each classification a user makes, including points earned.
  - `id` (uuid, primary key)
  - `item_name` (text, not null) — the waste item the user searched/classified
  - `category` (text, not null) — the classification result
  - `points_earned` (int, not null, default 0)
  - `correct` (boolean, not null, default true) — whether the classification was correct
  - `created_at` (timestamptz)

2. Security
- Enable RLS on both tables.
- Allow anon + authenticated CRUD because the app has no sign-in and data is intentionally shared/public.
*/

CREATE TABLE IF NOT EXISTS waste_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text NOT NULL CHECK (category IN ('Wet', 'Dry', 'E-Waste')),
  disposal_instructions text NOT NULL,
  eco_points int NOT NULL DEFAULT 10,
  keywords text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS user_activity (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_name text NOT NULL,
  category text NOT NULL,
  points_earned int NOT NULL DEFAULT 0,
  correct boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE waste_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_activity ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_waste_items" ON waste_items;
CREATE POLICY "anon_select_waste_items" ON waste_items FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_waste_items" ON waste_items;
CREATE POLICY "anon_insert_waste_items" ON waste_items FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_waste_items" ON waste_items;
CREATE POLICY "anon_update_waste_items" ON waste_items FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_waste_items" ON waste_items;
CREATE POLICY "anon_delete_waste_items" ON waste_items FOR DELETE
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_select_user_activity" ON user_activity;
CREATE POLICY "anon_select_user_activity" ON user_activity FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_user_activity" ON user_activity;
CREATE POLICY "anon_insert_user_activity" ON user_activity FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_user_activity" ON user_activity;
CREATE POLICY "anon_delete_user_activity" ON user_activity FOR DELETE
  TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_waste_items_name ON waste_items (name);
CREATE INDEX IF NOT EXISTS idx_user_activity_created_at ON user_activity (created_at DESC);
