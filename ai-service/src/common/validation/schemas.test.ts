import assert from 'node:assert/strict';
import test from 'node:test';
import { SearchQuerySchema } from './schemas';

test('SearchQuerySchema rejects empty query', () => {
  assert.equal(SearchQuerySchema.safeParse({ query: '   ', limit: 12 }).success, false);
});

test('SearchQuerySchema rejects too-long query', () => {
  assert.equal(SearchQuerySchema.safeParse({ query: 'x'.repeat(301), limit: 12 }).success, false);
});

test('SearchQuerySchema rejects excessive limit', () => {
  assert.equal(SearchQuerySchema.safeParse({ query: 'diamond', limit: 51 }).success, false);
});

test('SearchQuerySchema rejects invalid price range', () => {
  assert.equal(
    SearchQuerySchema.safeParse({
      query: 'diamond',
      limit: 12,
      filters: {
        minPrice: 5000,
        maxPrice: 1000,
      },
    }).success,
    false,
  );
});

test('SearchQuerySchema accepts valid filters', () => {
  const parsed = SearchQuerySchema.parse({
    query: ' diamond ',
    filters: {
      isActive: true,
      category: 'Necklace',
      minPrice: 1000,
      maxPrice: 5000,
    },
  });

  assert.equal(parsed.query, 'diamond');
  assert.equal(parsed.limit, 12);
  assert.deepEqual(parsed.filters, {
    isActive: true,
    category: 'Necklace',
    minPrice: 1000,
    maxPrice: 5000,
  });
});
