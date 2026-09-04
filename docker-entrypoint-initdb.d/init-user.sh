#!/bin/bash
set -e

# Run psql with the environment variable injected safely
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    CREATE ROLE nestjs_migrator WITH LOGIN PASSWORD '$MIGRATOR_PASSWORD';
    GRANT CREATE, USAGE ON SCHEMA public TO nestjs_migrator;

    CREATE ROLE nestjs_app_user WITH LOGIN PASSWORD '$APP_PASSWORD';
    GRANT USAGE ON SCHEMA public TO nestjs_app_user;
    GRANT CONNECT ON DATABASE "$POSTGRES_DB" TO nestjs_app_user;
    \c "$POSTGRES_DB"

    GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO nestjs_app_user;
    ALTER DEFAULT PRIVILEGES FOR ROLE nestjs_migrator IN SCHEMA public
      GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO nestjs_app_user;

    CREATE DATABASE test_db;
    \c test_db

    GRANT CONNECT ON DATABASE "test_db" TO nestjs_app_user;
    GRANT CREATE, USAGE ON SCHEMA public TO nestjs_app_user;
    GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO nestjs_app_user;
    ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO nestjs_app_user;
EOSQL