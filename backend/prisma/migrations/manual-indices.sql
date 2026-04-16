-- Enable pg_trgm for trigram-based text search (requires superuser)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- products table: GIN Trigram index on Vietnamese and English names
-- This allows ILIKE '%abc%' to be indexed.
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_products_name_vi_trgm" ON "products" USING GIN ((name->>'vi') gin_trgm_ops);
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_products_name_en_trgm" ON "products" USING GIN ((name->>'en') gin_trgm_ops);

-- categories table: GIN Trigram index on Vietnamese name
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_categories_name_vi_trgm" ON "categories" USING GIN ((name->>'vi') gin_trgm_ops);

-- Standard GIN for @> (contains) queries (still useful for structured lookups)
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_products_name_gin" ON "products" USING GIN ("name");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_categories_name_gin" ON "categories" USING GIN ("name");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_attribute_name_gin" ON "Attribute" USING GIN ("name");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_attribute_value_value_gin" ON "AttributeValue" USING GIN ("value");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_variants_title_gin" ON "ProductVariant" USING GIN ("variantTitle");
