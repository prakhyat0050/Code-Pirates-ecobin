import test from 'node:test';
import assert from 'node:assert/strict';

import { searchWasteItem, classifyWaste } from './wasteClassifier.ts';

test('searchWasteItem finds a common waste item without Supabase config', async () => {
    const item = await searchWasteItem('banana peel');
    assert.ok(item, 'banana peel should be found in the fallback catalog');
    assert.equal(item?.category, 'Wet');
});

test('classifyWaste falls back to local catalog for text search', async () => {
    const result = await classifyWaste('plastic bottle');
    assert.equal(result.found, true);
    assert.equal(result.item?.category, 'Dry');
    assert.ok(result.pointsEarned > 0);
});
