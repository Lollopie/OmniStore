import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Stores hashed refresh tokens. Refreshing runs without a valid access token,
 * so there is no RLS context: the table has RLS enabled without policies and is
 * only reachable through the SECURITY DEFINER functions below.
 */
export class CreateRefreshTokens1795000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "refresh_tokens" (
        "token_id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "user_id" UUID NOT NULL REFERENCES "user"("user_id") ON DELETE CASCADE,
        "token_hash" TEXT NOT NULL UNIQUE,
        "expires_at" TIMESTAMPTZ NOT NULL,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "rotated_at" TIMESTAMPTZ
      );
      CREATE INDEX "refresh_tokens_user_id_idx" ON "refresh_tokens" ("user_id");
      ALTER TABLE "refresh_tokens" ENABLE ROW LEVEL SECURITY;
    `);
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION create_refresh_token(check_user_id UUID, new_hash TEXT, new_expires_at TIMESTAMPTZ)
      RETURNS VOID
      LANGUAGE sql
      SECURITY DEFINER
      SET search_path = pg_catalog, public, pg_temp
      AS $$
        DELETE FROM refresh_tokens WHERE user_id = check_user_id AND expires_at <= now();
        INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
        VALUES (check_user_id, new_hash, new_expires_at);
      $$;

      REVOKE ALL ON FUNCTION create_refresh_token FROM PUBLIC;
      GRANT EXECUTE ON FUNCTION create_refresh_token TO nestjs_app_user;
    `);
    // Rotated tokens are kept until they expire so a replayed token can be
    // detected. Tabs sharing the cookie may refresh at the same moment, so a
    // token rotated within the last 30 seconds is rotated again instead.
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION rotate_refresh_token(old_hash TEXT, new_hash TEXT, new_expires_at TIMESTAMPTZ)
      RETURNS TABLE (token_user_id UUID, reused BOOLEAN)
      LANGUAGE plpgsql
      SECURITY DEFINER
      SET search_path = pg_catalog, public, pg_temp
      AS $$
      DECLARE
        current_token refresh_tokens%ROWTYPE;
      BEGIN
        SELECT * INTO current_token FROM refresh_tokens
        WHERE token_hash = old_hash
        FOR UPDATE;
        IF NOT FOUND OR current_token.expires_at <= now() THEN
          RETURN;
        END IF;
        IF current_token.rotated_at IS NOT NULL
           AND current_token.rotated_at <= now() - interval '30 seconds' THEN
          RETURN QUERY SELECT current_token.user_id, TRUE;
          RETURN;
        END IF;
        UPDATE refresh_tokens SET rotated_at = COALESCE(rotated_at, now())
        WHERE token_id = current_token.token_id;
        INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
        VALUES (current_token.user_id, new_hash, new_expires_at);
        RETURN QUERY SELECT current_token.user_id, FALSE;
      END;
      $$;

      REVOKE ALL ON FUNCTION rotate_refresh_token FROM PUBLIC;
      GRANT EXECUTE ON FUNCTION rotate_refresh_token TO nestjs_app_user;
    `);
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION delete_refresh_token(old_hash TEXT)
      RETURNS VOID
      LANGUAGE sql
      SECURITY DEFINER
      SET search_path = pg_catalog, public, pg_temp
      AS $$
        DELETE FROM refresh_tokens WHERE token_hash = old_hash;
      $$;

      REVOKE ALL ON FUNCTION delete_refresh_token FROM PUBLIC;
      GRANT EXECUTE ON FUNCTION delete_refresh_token TO nestjs_app_user;
    `);
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION revoke_user_refresh_tokens(check_user_id UUID)
      RETURNS VOID
      LANGUAGE sql
      SECURITY DEFINER
      SET search_path = pg_catalog, public, pg_temp
      AS $$
        DELETE FROM refresh_tokens WHERE user_id = check_user_id;
      $$;

      REVOKE ALL ON FUNCTION revoke_user_refresh_tokens FROM PUBLIC;
      GRANT EXECUTE ON FUNCTION revoke_user_refresh_tokens TO nestjs_app_user;
    `);
    // Rebuilds the token claims on refresh, so they reflect the current membership
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION get_user_session(check_user_id UUID)
      RETURNS TABLE (username TEXT, org_id UUID, org_role TEXT)
      LANGUAGE sql
      SECURITY DEFINER
      SET search_path = pg_catalog, public, pg_temp
      STABLE
      AS $$
        SELECT u.username::TEXT, r.org_id, r.role::TEXT
        FROM "user" u
        JOIN user_org_role r ON r.user_id = u.user_id
        WHERE u.user_id = check_user_id;
      $$;

      REVOKE ALL ON FUNCTION get_user_session FROM PUBLIC;
      GRANT EXECUTE ON FUNCTION get_user_session TO nestjs_app_user;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP FUNCTION get_user_session;
      DROP FUNCTION revoke_user_refresh_tokens;
      DROP FUNCTION delete_refresh_token;
      DROP FUNCTION rotate_refresh_token;
      DROP FUNCTION create_refresh_token;
      DROP TABLE "refresh_tokens";
    `);
  }
}
