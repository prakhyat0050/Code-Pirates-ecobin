import type { WasteCategory, ClassificationResult, WasteItem, UserActivity } from './supabase.ts';
import { hasSupabaseConfig, supabase } from './supabase.ts';
import { classifyWithGemini, type GeminiClassification } from './geminiClassifier.ts';

const LOCAL_ACTIVITY_STORAGE_KEY = 'ecobin-local-activity-v1';

const categoryKeywords: Record<WasteCategory, string[]> = {
  'Wet': [
    'food', 'fruit', 'vegetable', 'peel', 'meat', 'bone', 'egg', 'tea', 'coffee',
    'organic', 'compost', 'leftover', 'scrap', 'garden', 'leaf', 'leaves', 'flower',
    'banana', 'apple', 'chicken', 'fish', 'cooked', 'biodegradable',
  ],
  'Dry': [
    'plastic', 'paper', 'glass', 'metal', 'cardboard', 'carton', 'tin', 'aluminum',
    'steel', 'bottle', 'bag', 'box', 'can', 'jar', 'newspaper', 'magazine', 'foil',
    'container', 'clothes', 'fabric', 'textile', 'recyclable', 'tetra', 'cup',
  ],
  'E-Waste': [
    'phone', 'laptop', 'computer', 'battery', 'charger', 'cable', 'headphone', 'earphone',
    'electronic', 'tv', 'television', 'monitor', 'printer', 'microwave', 'refrigerator',
    'fridge', 'bulb', 'led', 'cfl', 'appliance', 'keyboard', 'mouse', 'tablet', 'watch',
    'power bank', 'circuit', 'wire', 'device',
  ],
};

const fallbackWasteItems: WasteItem[] = [
  {
    id: 'local-banana-peel',
    name: 'banana peel',
    category: 'Wet',
    disposal_instructions: 'Place banana peels in the compost or wet-organic bin. Do not mix them with recyclables or regular trash.',
    eco_points: 12,
    keywords: 'banana, fruit, organic, compost, peel',
    created_at: new Date().toISOString(),
  },
  {
    id: 'local-plastic-bottle',
    name: 'plastic bottle',
    category: 'Dry',
    disposal_instructions: 'Empty and rinse the bottle, then place it in the dry recycling bin or a plastic recycling stream as per local rules.',
    eco_points: 15,
    keywords: 'plastic, bottle, water, recycle, PET',
    created_at: new Date().toISOString(),
  },
  {
    id: 'local-cardboard-box',
    name: 'cardboard box',
    category: 'Dry',
    disposal_instructions: 'Flatten the cardboard and place it in the paper or cardboard recycling bin. Remove any tape where possible.',
    eco_points: 14,
    keywords: 'cardboard, box, packaging, carton, paper',
    created_at: new Date().toISOString(),
  },
  {
    id: 'local-old-mobile-phone',
    name: 'old mobile phone',
    category: 'E-Waste',
    disposal_instructions: 'Take the phone to an authorised e-waste drop-off or a registered recycler. Remove batteries or accessories separately.',
    eco_points: 20,
    keywords: 'phone, mobile, smartphone, gadget, electronic',
    created_at: new Date().toISOString(),
  },
  {
    id: 'local-dead-batteries',
    name: 'dead batteries',
    category: 'E-Waste',
    disposal_instructions: 'Store used batteries in a secure container and hand them to an e-waste collection point or battery recycler.',
    eco_points: 18,
    keywords: 'battery, cells, power, rechargeable, lithium',
    created_at: new Date().toISOString(),
  },
  {
    id: 'local-newspaper',
    name: 'newspaper',
    category: 'Dry',
    disposal_instructions: 'Bundle dry newspapers and place them in the paper recycling bin. Keep them away from wet waste.',
    eco_points: 10,
    keywords: 'paper, newspaper, print, magazine, dry paper',
    created_at: new Date().toISOString(),
  },
  {
    id: 'local-egg-shells',
    name: 'egg shells',
    category: 'Wet',
    disposal_instructions: 'Rinse and compost egg shells with wet organic waste where possible or dispose in the compost bin.',
    eco_points: 11,
    keywords: 'eggshell, eggs, organic, compost, food scrap',
    created_at: new Date().toISOString(),
  },
  {
    id: 'local-coffee-grounds',
    name: 'coffee grounds',
    category: 'Wet',
    disposal_instructions: 'Put coffee grounds into the compost or wet waste bin. They are a good organic soil amendment when composted.',
    eco_points: 12,
    keywords: 'coffee, grounds, tea, organic, compost',
    created_at: new Date().toISOString(),
  },
  {
    id: 'local-old-laptop',
    name: 'old laptop',
    category: 'E-Waste',
    disposal_instructions: 'Recycle the laptop through a certified e-waste collector; remove hard drives and accessories if requested.',
    eco_points: 25,
    keywords: 'laptop, computer, device, electronic, screen',
    created_at: new Date().toISOString(),
  },
  {
    id: 'local-beverage-can',
    name: 'aluminum can',
    category: 'Dry',
    disposal_instructions: 'Crush or rinse the can and place it in the metal or dry recycling stream.',
    eco_points: 13,
    keywords: 'can, aluminium, metal, beverage, recycle',
    created_at: new Date().toISOString(),
  },
];

const normalizeSearchTerm = (value: string): string => value.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();

function getLocalActivityEntries(): UserActivity[] {
  if (typeof localStorage === 'undefined') return [];

  try {
    const raw = localStorage.getItem(LOCAL_ACTIVITY_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as UserActivity[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function setLocalActivityEntries(entries: UserActivity[]) {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(LOCAL_ACTIVITY_STORAGE_KEY, JSON.stringify(entries));
}

function findLocalWasteItem(query: string): WasteItem | null {
  const normalized = normalizeSearchTerm(query);
  if (!normalized) return null;

  const scored = fallbackWasteItems
    .map((item) => {
      const fullText = normalizeSearchTerm(`${item.name} ${item.keywords}`);
      const itemNameText = normalizeSearchTerm(item.name);
      const tokens = normalized.split(' ').filter(Boolean);
      let score = 0;

      if (itemNameText === normalized) score += 100;
      if (fullText.includes(normalized)) score += 60;
      if (itemNameText.includes(normalized)) score += 35;

      for (const token of tokens) {
        if (itemNameText.includes(token)) score += 12;
        if (fullText.includes(token)) score += 8;
      }

      return { item, score };
    })
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score);

  return scored[0]?.item ?? null;
}

export function guessCategory(itemName: string): WasteCategory {
  const lower = itemName.toLowerCase().trim();
  let best: WasteCategory = 'Dry';
  let bestScore = 0;

  for (const [category, keywords] of Object.entries(categoryKeywords)) {
    let score = 0;
    for (const kw of keywords) {
      if (lower.includes(kw)) score++;
    }
    if (score > bestScore) {
      bestScore = score;
      best = category as WasteCategory;
    }
  }
  return best;
}

export async function searchWasteItem(query: string): Promise<WasteItem | null> {
  const lower = query.toLowerCase().trim();
  if (!lower) return null;

  if (hasSupabaseConfig) {
    const { data: exact } = await supabase
      .from('waste_items')
      .select('*')
      .ilike('name', lower)
      .maybeSingle();

    if (exact) return exact as WasteItem;

    const { data: keywordMatch } = await supabase
      .from('waste_items')
      .select('*')
      .textSearch('keywords', lower.replace(/\s+/g, ' & '), { type: 'websearch' })
      .limit(1)
      .maybeSingle();

    if (keywordMatch) return keywordMatch as WasteItem;

    const { data: fuzzyMatch } = await supabase
      .from('waste_items')
      .select('*')
      .ilike('keywords', `%${lower}%`)
      .limit(1)
      .maybeSingle();

    if (fuzzyMatch) return fuzzyMatch as WasteItem;
  }

  return findLocalWasteItem(lower) ?? null;
}

export async function classifyWaste(itemName: string, source: 'text' | 'image' = 'text'): Promise<ClassificationResult> {
  if (source === 'text') {
    const aiResult = await classifyWithGemini({ itemName });
    if (aiResult) return saveGeminiResult(aiResult, source);
  }

  const item = await searchWasteItem(itemName);

  if (item) {
    const guessed = guessCategory(itemName);
    const correct = guessed === item.category;
    const pointsEarned = correct ? item.eco_points : Math.floor(item.eco_points / 2);

    await logActivity(item.name, item.category, pointsEarned, correct, source);

    return { found: true, item, guessedCategory: guessed, pointsEarned, source };
  }

  const guessed = guessCategory(itemName);
  await logActivity(itemName, guessed, 5, true, source);

  return {
    found: false,
    item: null,
    guessedCategory: guessed,
    pointsEarned: 5,
    source,
  };
}

export async function classifyImageWithGemini(imageBase64: string, mimeType: string): Promise<ClassificationResult | null> {
  const aiResult = await classifyWithGemini({ imageBase64, mimeType });
  return aiResult ? saveGeminiResult(aiResult, 'image') : null;
}

async function saveGeminiResult(result: GeminiClassification, source: 'text' | 'image'): Promise<ClassificationResult> {
  const item: WasteItem = {
    id: `gemini-${result.category}`,
    name: result.name,
    category: result.category,
    disposal_instructions: result.disposalInstructions,
    eco_points: 15,
    keywords: result.alternatives.join(', '),
    created_at: new Date().toISOString(),
  };
  await logActivity(item.name, item.category, item.eco_points, true, source);
  return { found: true, item, guessedCategory: item.category, pointsEarned: item.eco_points, source };
}

async function logActivity(
  itemName: string,
  category: WasteCategory,
  points: number,
  correct: boolean,
  source: 'text' | 'image',
): Promise<void> {
  const storedName = typeof localStorage === 'undefined' ? '' : localStorage.getItem('ecobin-player-name')?.trim() ?? '';
  const playerName = storedName.slice(0, 30) || 'Eco Explorer';

  if (!hasSupabaseConfig) {
    const entries = getLocalActivityEntries();
    const nextEntry: UserActivity = {
      id: `local-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      item_name: itemName,
      category,
      points_earned: points,
      correct,
      player_name: playerName,
      source,
      created_at: new Date().toISOString(),
    };
    setLocalActivityEntries([nextEntry, ...entries].slice(0, 50));
    return;
  }

  await supabase.from('user_activity').insert({
    item_name: itemName,
    category,
    points_earned: points,
    correct,
    player_name: playerName,
    source,
  });
}

export async function getTotalPoints(): Promise<number> {
  if (!hasSupabaseConfig) {
    return getLocalActivityEntries().reduce((sum, row) => sum + row.points_earned, 0);
  }

  const { data, error } = await supabase
    .from('user_activity')
    .select('points_earned');

  if (error || !data) return 0;
  return data.reduce((sum, row) => sum + row.points_earned, 0);
}

export async function getActivityHistory(limit = 50): Promise<UserActivity[]> {
  if (!hasSupabaseConfig) {
    return getLocalActivityEntries().slice(0, limit);
  }

  const { data, error } = await supabase
    .from('user_activity')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error || !data) return [];
  return data as UserActivity[];
}

export async function getActivityStats(): Promise<{
  total: number;
  correct: number;
  byCategory: Record<WasteCategory, number>;
}> {
  if (!hasSupabaseConfig) {
    const data = getLocalActivityEntries();
    const byCategory: Record<WasteCategory, number> = { 'Wet': 0, 'Dry': 0, 'E-Waste': 0 };
    let correct = 0;

    for (const row of data) {
      byCategory[row.category] = (byCategory[row.category] ?? 0) + 1;
      if (row.correct) correct++;
    }

    return { total: data.length, correct, byCategory };
  }

  const { data, error } = await supabase
    .from('user_activity')
    .select('category, correct');

  if (error || !data) return { total: 0, correct: 0, byCategory: { 'Wet': 0, 'Dry': 0, 'E-Waste': 0 } };

  const byCategory: Record<WasteCategory, number> = { 'Wet': 0, 'Dry': 0, 'E-Waste': 0 };
  let correct = 0;
  for (const row of data as UserActivity[]) {
    byCategory[row.category] = (byCategory[row.category] ?? 0) + 1;
    if (row.correct) correct++;
  }

  return { total: data.length, correct, byCategory };
}

export interface LeaderboardEntry {
  playerName: string;
  points: number;
  items: number;
  correct: number;
}

export async function getLeaderboard(): Promise<LeaderboardEntry[]> {
  if (!hasSupabaseConfig) {
    const data = getLocalActivityEntries();
    const grouped = new Map<string, LeaderboardEntry>();

    for (const row of data) {
      const playerName = row.player_name || 'Eco Explorer';
      const current = grouped.get(playerName) ?? { playerName, points: 0, items: 0, correct: 0 };
      current.points += row.points_earned;
      current.items += 1;
      if (row.correct) current.correct += 1;
      grouped.set(playerName, current);
    }

    return [...grouped.values()].sort((a, b) => b.points - a.points || b.items - a.items).slice(0, 10);
  }

  const { data, error } = await supabase
    .from('user_activity')
    .select('player_name, points_earned, correct');

  if (error || !data) return [];
  const grouped = new Map<string, LeaderboardEntry>();
  for (const row of data as Array<{ player_name: string; points_earned: number; correct: boolean }>) {
    const playerName = row.player_name || 'Eco Explorer';
    const current = grouped.get(playerName) ?? { playerName, points: 0, items: 0, correct: 0 };
    current.points += row.points_earned;
    current.items += 1;
    if (row.correct) current.correct += 1;
    grouped.set(playerName, current);
  }
  return [...grouped.values()].sort((a, b) => b.points - a.points || b.items - a.items).slice(0, 10);
}
