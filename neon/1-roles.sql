-- Production roles on Neon. The Neon counterpart of docker-entrypoint-initdb.d/init-user.sh, for a fresh,
-- empty database. Neon has no superuser: run this as the database owner (neondb_owner), then 2-default-privileges.sql.
--
--   psql "<owner connection string>" -v ON_ERROR_STOP=1 \
--        -v migrator_password=... -v app_password=... -v mcp_password=... -f neon/1-roles.sql
\set ON_ERROR_STOP on

-- Owns every table, function and policy: the migrations run as this role on each start.
CREATE ROLE nestjs_migrator WITH LOGIN PASSWORD :'migrator_password';
GRANT CREATE, USAGE ON SCHEMA public TO nestjs_migrator;

-- The app itself. It must never own tables, or row-level security wouldn't apply to it.
CREATE ROLE nestjs_app_user WITH LOGIN PASSWORD :'app_password';
GRANT USAGE ON SCHEMA public TO nestjs_app_user;
SELECT format('GRANT CONNECT ON DATABASE %I TO nestjs_app_user', current_database()) \gexec

-- Read-only access for the MCP server. Table and function grants come from the McpReadonlyGrants migration.
CREATE ROLE mcp_readonly WITH LOGIN PASSWORD :'mcp_password';
ALTER ROLE mcp_readonly SET statement_timeout = '5s';
ALTER ROLE mcp_readonly SET default_transaction_read_only = on;
GRANT USAGE ON SCHEMA public TO mcp_readonly;
SELECT format('GRANT CONNECT ON DATABASE %I TO mcp_readonly', current_database()) \gexec
