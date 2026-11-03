# Milestone 1 database

Authoritative schema: `backend/nest-api/prisma/schema.prisma`. Initial migration: `202611030001_projects/migration.sql`. PostgreSQL only; verified on real PostgreSQL 17.10. No existing SQLite database is altered.

The `projects` table has a UUID primary key, server-derived owner UUID, name, project type, story prompt, duration preset, resolution/style preferences, enabled language array, selected legacy character IDs, JSONB metadata, optimistic version, UTC timestamps and nullable archive timestamp. Owner/archive/update/id composite indexing supports scoped active project listing. Names cannot be blank; type/resolution/languages and positive versions have database checks. Metadata must be an object.

All application reads/writes include owner scoping; there is no database row-level security policy yet. The personal-edition token configuration supplies owner identities; no users table or user FK is claimed. Legacy character IDs are stored as strings because the character catalog remains in the existing service. Language references use `km`, `en`, `zh-CN`; the API normalizes incoming legacy `zh`.

PATCH and archive predicate on current version and increment it atomically. DELETE archives rather than removing rows. `updated_at` is supplied by Prisma; creation times default in PostgreSQL. Migrations are applied with `migrate deploy`; a second deploy was verified harmless. Schema migration/reset of existing owner data, backups, restore APIs and full user/session persistence require separate reviewed work.
