import { createClient } from '@supabase/supabase-js';

const env = typeof import.meta !== 'undefined' ? (import.meta.env ?? {}) : {};
const supabaseUrl = env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const hasSupabaseConfig = Boolean(supabaseUrl && supabaseAnonKey);

const createFallbackQueryResult = <T>(data: T | null = null) => ({ data, error: null });

const createFallbackQueryChain = () => ({
  ...createFallbackQueryResult(null),
  ilike: () => ({
    ...createFallbackQueryResult(null),
    maybeSingle: () => createFallbackQueryResult(null),
  }),
  textSearch: () => ({
    ...createFallbackQueryResult(null),
    limit: () => ({
      ...createFallbackQueryResult(null),
      maybeSingle: () => createFallbackQueryResult(null),
    }),
  }),
  order: () => ({
    ...createFallbackQueryResult([]),
    limit: () => createFallbackQueryResult([]),
  }),
  limit: () => createFallbackQueryResult([]),
  maybeSingle: () => createFallbackQueryResult(null),
});

export const supabase = hasSupabaseConfig
  ? createClient(supabaseUrl!, supabaseAnonKey!)
  : {
    from: () => ({
      select: () => createFallbackQueryChain(),
      insert: async () => createFallbackQueryResult(null),
    }),
    functions: {
      invoke: async () => createFallbackQueryResult(null),
    },
  } as any;

export type WasteCategory = 'Wet' | 'Dry' | 'E-Waste';

export interface WasteItem {
  id: string;
  name: string;
  category: WasteCategory;
  disposal_instructions: string;
  eco_points: number;
  keywords: string;
  created_at: string;
}

export interface UserActivity {
  id: string;
  item_name: string;
  category: WasteCategory;
  points_earned: number;
  correct: boolean;
  player_name: string;
  source: 'text' | 'image';
  created_at: string;
}

export interface ClassificationResult {
  found: boolean;
  item: WasteItem | null;
  guessedCategory: WasteCategory | null;
  pointsEarned: number;
  source?: 'text' | 'image';
}
