#!/bin/bash
set -e

# Run psql with the environment variable injected safely
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    CREATE ROLE nestjs_migrator WITH LOGIN PASSWORD '$MIGRATOR_PASSWORD';
    GRANT CREATE, USAGE ON SCHEMA public TO nestjs_migrator;

    CREATE ROLE nestjs_app_user WITH LOGIN PASSWORD '$APP_PASSWORD';
    GRANT USAGE ON SCHEMA public TO nestjs_app_user;
    GRANT CONNECT ON DATABASE "$POSTGRES_DB" TO nestjs_app_user;

    -- Table and function grants come from the McpReadonlyGrants migration
    CREATE ROLE mcp_readonly WITH LOGIN PASSWORD '$MCP_READONLY_PASSWORD';
    ALTER ROLE mcp_readonly SET statement_timeout = '5s';
    ALTER ROLE mcp_readonly SET default_transaction_read_only = on;
    GRANT USAGE ON SCHEMA public TO mcp_readonly;
    GRANT CONNECT ON DATABASE "$POSTGRES_DB" TO mcp_readonly;
    \c "$POSTGRES_DB"

    GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO nestjs_app_user;
    ALTER DEFAULT PRIVILEGES FOR ROLE nestjs_migrator IN SCHEMA public
      GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO nestjs_app_user;

    CREATE DATABASE test_db;
    \c test_db
    GRANT CREATE, USAGE ON SCHEMA public TO nestjs_migrator;
    GRANT USAGE ON SCHEMA public TO nestjs_app_user;
    GRANT CONNECT ON DATABASE "test_db" TO nestjs_app_user;
    GRANT USAGE ON SCHEMA public TO mcp_readonly;
    GRANT CONNECT ON DATABASE "test_db" TO mcp_readonly;
    ALTER DEFAULT PRIVILEGES FOR ROLE nestjs_migrator IN SCHEMA public
      GRANT SELECT, INSERT, UPDATE, DELETE, TRUNCATE ON TABLES TO nestjs_app_user;
EOSQL