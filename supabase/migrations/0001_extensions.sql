-- ==============================================================================
-- 💗 PAIRLY DATABASE MIGRATION: 0001_extensions.sql
-- Purpose: Enable PostgreSQL extensions required for cryptographic operations,
--          UUID generation, and random room code generation.
-- ==============================================================================

-- 1. Enable uuid-ossp for legacy UUID utilities and v4 generation compatibility
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;

-- 2. Enable pgcrypto for cryptographically secure random bytes generation (used in room codes)
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA extensions;

-- Add descriptive comment for schema introspection
COMMENT ON EXTENSION "uuid-ossp" IS 'UUID generation functions for PostgreSQL';
COMMENT ON EXTENSION "pgcrypto" IS 'Cryptographic functions and secure random generator for Pairly';
