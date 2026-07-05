#!/bin/bash
set -e

# Run psql with the environment variable injected safely
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    CREATE ROLE nestjs_app_user WITH LOGIN PASSWORD '$APP_PASSWORD';
    GRANT CONNECT ON DATABASE "$POSTGRES_DB" TO nestjs_app_user;
    GRANT CREATE, USAGE ON SCHEMA public TO nestjs_app_user;
    GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO nestjs_app_user;
EOSQL