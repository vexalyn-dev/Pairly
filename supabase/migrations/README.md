# 💗 Pairly — Supabase Database Migrations Roadmap

This directory contains the ordered, reproducible, and reviewable PostgreSQL migrations for **Pairly**.

## Migration Execution Order

Supabase CLI executes migrations in strict lexicographical order. Each migration builds predictably upon the previous schema layers:

| Order  | Migration File                    | Target Schema & Purpose                                                   | Dependencies           |
| :----- | :-------------------------------- | :------------------------------------------------------------------------ | :--------------------- |
| **01** | `0001_extensions.sql`             | PostgreSQL extensions (`uuid-ossp`, `pgcrypto`) & shared settings         | None                   |
| **02** | `0002_profiles.sql`               | `profiles` table & auto-creation trigger from `auth.users`                | `0001`                 |
| **03** | `0003_rooms.sql`                  | `rooms` & `room_members` tables, 2-member limit constraint                | `0002`                 |
| **04** | `0004_activities.sql`             | `activities` catalog table                                                | `0001`                 |
| **05** | `0005_activity_sessions.sql`      | `activity_sessions` table (room & activity join)                          | `0003`, `0004`         |
| **06** | `0006_activity_events.sql`        | `activity_events` append-only audit & interaction log                     | `0005`                 |
| **07** | `0007_memories.sql`               | `memories` & `memory_media` tables for shared moments                     | `0003`                 |
| **08** | `0008_notifications.sql`          | `notifications` table for user alerts                                     | `0002`                 |
| **09** | `0009_reports.sql`                | `reports` table for safety & moderation                                   | `0002`, `0003`         |
| **10** | `0010_functions_and_triggers.sql` | `set_updated_at()`, room membership helpers & validation                  | `0002` - `0009`        |
| **11** | `0011_rls.sql`                    | Row Level Security (RLS) policies for all 10 application tables           | `0010`                 |
| **12** | `0012_realtime.sql`               | Supabase Realtime publication configuration (`supabase_realtime`)         | `0003`, `0005`, `0006` |
| **13** | `0013_storage.sql`                | Supabase Storage buckets (`avatars`, `memories`, `photobooth`) & policies | `0003`, `0010`         |

---

## Migration Design Rules

1. **Idempotency**: Use `CREATE TABLE IF NOT EXISTS`, `CREATE INDEX IF NOT EXISTS`, and `OR REPLACE` for triggers/functions where applicable.
2. **Explicit Constraints**: Enforce foreign keys, `CHECK` constraints, `NOT NULL` rules, and defaults at the database layer.
3. **No Hidden Secrets**: Never commit passwords, API keys, or private secrets in migration files.
4. **Never Bypass RLS**: Authorization must rely on `auth.uid()` and verified room membership, not untrusted client input.
