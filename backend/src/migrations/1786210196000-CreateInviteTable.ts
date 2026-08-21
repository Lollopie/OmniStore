import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateInviteTable1786210196000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "invite" (
                  invite_id     uuid        NOT NULL    DEFAULT uuidv7(),
                  email         text        NOT NULL,
                  org_id        uuid,
                  warehouse_id  uuid,
                  role          text,
                  token_hash    text        NOT NULL    UNIQUE,
                  expires_at    timestamptz NOT NULL,
                  consumed_at   timestamptz,
                  created_at    timestamptz             DEFAULT NOW(),
                  CONSTRAINT "PK_invite" PRIMARY KEY (invite_id),
                  CONSTRAINT "FK_org" FOREIGN KEY (org_id) REFERENCES organization (org_id) ON DELETE CASCADE ON UPDATE CASCADE,
                  CONSTRAINT "FK_warehouse_org" FOREIGN KEY (warehouse_id, org_id) REFERENCES warehouse (warehouse_id, org_id) ON DELETE CASCADE ON UPDATE CASCADE
       )`,
    );
    await queryRunner.query(`
            ALTER TABLE "invite" ENABLE ROW LEVEL SECURITY;
    `);
    await queryRunner.query(`
        CREATE OR REPLACE FUNCTION consume_invite(
          raw_token_hash TEXT,
          require_org BOOLEAN DEFAULT NULL
        )
        RETURNS invite
        LANGUAGE plpgsql
        SECURITY DEFINER
        AS $$
        DECLARE
          found_invite invite;
        BEGIN
          SELECT * INTO found_invite
          FROM invite
          WHERE token_hash = raw_token_hash
            AND consumed_at IS NULL
            AND expires_at > now()
            AND (
                require_org IS NULL 
                OR (require_org IS TRUE AND org_id IS NOT NULL)
                OR (require_org IS FALSE AND org_id IS NULL)
            )
          FOR UPDATE;
        
          IF NOT FOUND THEN
            RAISE EXCEPTION 'invite_invalid_or_expired';
          END IF;
        
          UPDATE invite SET consumed_at = now() WHERE invite_id = found_invite.invite_id;
        
          RETURN found_invite;
        END;
        $$;
        
        REVOKE ALL ON FUNCTION consume_invite FROM PUBLIC;
        GRANT EXECUTE ON FUNCTION consume_invite TO nestjs_app_user;
    `);
    await queryRunner.query(`
        CREATE OR REPLACE FUNCTION grant_invite_role(new_user_id UUID, invite_org_id UUID, invite_warehouse_id UUID, invite_role TEXT)
        RETURNS user_org_role
        LANGUAGE plpgsql
        SECURITY DEFINER
        AS $$
        DECLARE
          new_user_org_role user_org_role;
        BEGIN        
          INSERT INTO user_org_role (user_id, org_id, role)
          VALUES (new_user_id, invite_org_id, 'MEMBER') RETURNING * INTO new_user_org_role;
          
          IF invite_warehouse_id IS NOT NULL AND invite_role IS NOT NULL THEN
            INSERT INTO user_warehouse_role (user_id, warehouse_id, role)
            VALUES (new_user_id, invite_warehouse_id, invite_role)
            ON CONFLICT (user_id, warehouse_id) DO UPDATE SET role = EXCLUDED.role;
          END IF;
          RETURN new_user_org_role;
        END;
        $$;
        
        REVOKE ALL ON FUNCTION grant_invite_role FROM PUBLIC;
        GRANT EXECUTE ON FUNCTION grant_invite_role TO nestjs_app_user;
    `);
    await queryRunner.query(`
        CREATE OR REPLACE FUNCTION is_org_admin(check_user_id UUID, check_org_id UUID)
        RETURNS BOOLEAN
        LANGUAGE sql
        SECURITY DEFINER
        STABLE
        AS $$
          SELECT EXISTS (
            SELECT 1 FROM user_org_role
            WHERE user_id = check_user_id
              AND org_id = check_org_id
              AND role IN ('OWNER', 'ADMIN')
          );
        $$;
        
        -- lock the function down so it can't be called arbitrarily to probe other users
        REVOKE ALL ON FUNCTION is_org_admin FROM PUBLIC;
        GRANT EXECUTE ON FUNCTION is_org_admin TO nestjs_app_user;
    `);
    await queryRunner.query(`
        CREATE OR REPLACE FUNCTION create_org_registration(reg_email TEXT, reg_token_hash TEXT, reg_expires_at TIMESTAMPTZ)
        RETURNS invite
        LANGUAGE plpgsql
        SECURITY DEFINER
        AS $$
        DECLARE
          new_invite invite;
        BEGIN        
          INSERT INTO invite (email, token_hash, expires_at)
          VALUES (reg_email, reg_token_hash, reg_expires_at)
          RETURNING * INTO new_invite;
          
          RETURN new_invite;
        END;
        $$;
    `);
    await queryRunner.query(`
        CREATE OR REPLACE FUNCTION validate_invite(invite_token_hash TEXT)
        RETURNS invite
        LANGUAGE plpgsql
        SECURITY DEFINER
        AS $$
        DECLARE
          found_invite invite;
        BEGIN        
          SELECT * FROM invite WHERE token_hash = invite_token_hash AND consumed_at IS NULL INTO found_invite;
          
          RETURN found_invite;
        END;
        $$;
    `);
    await queryRunner.query(`
        CREATE POLICY invite_org_and_org_admin ON "invite"
            USING (
                org_id = current_setting('app.current_org_id', true)::uuid
                AND is_org_admin(
                     current_setting('app.current_user_id', true)::uuid,
                     current_setting('app.current_org_id', true)::uuid
                   )
            );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP POLICY "invite_org_and_org_admin" ON "invite";
    `);
    await queryRunner.query(`DROP TABLE "invite"`);
  }
}
