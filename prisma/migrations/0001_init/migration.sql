-- Migration: 0001_init
-- This file documents the manual SQL applied after schema push.

-- Enable btree_gist extension required for date range exclusion constraints.
-- The actual exclusion constraint is added in Phase 3 when siteId column is introduced.
-- Phase 3 will add:
--   ALTER TABLE reservations
--     ADD CONSTRAINT no_overlap
--     EXCLUDE USING gist (
--       site_id WITH =,
--       daterange(check_in, check_out, '[)') WITH &&
--     );
CREATE EXTENSION IF NOT EXISTS btree_gist;
