-- Run as nestjs_migrator, after 1-roles.sql and before the first start of the app:
--
--   psql "<nestjs_migrator connection string>" -v ON_ERROR_STOP=1 -f neon/2-default-privileges.sql
--
-- The migrations only grant functions. Every table the migrator creates must also be usable by the app,
-- or each query fails with "permission denied". Running this as the migrator itself avoids needing
-- membership in its role, which Neon's owner role may not have.
\set ON_ERROR_STOP on

ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO nestjs_app_user;
