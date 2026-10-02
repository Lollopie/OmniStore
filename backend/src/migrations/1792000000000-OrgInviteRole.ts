import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * invite.role is the org role for org-only invites (warehouse_id IS NULL) and
 * the warehouse role for warehouse invites, whose org role defaults to member.
 */
export class OrgInviteRole1792000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
        CREATE OR REPLACE FUNCTION grant_invite_role(new_user_id UUID, invite_org_id UUID, invite_warehouse_id UUID, invite_role TEXT)
        RETURNS user_org_role
        LANGUAGE plpgsql
        SECURITY DEFINER
        AS $$
        DECLARE
          new_user_org_role user_org_role;
        BEGIN
          IF invite_warehouse_id IS NULL THEN
            INSERT INTO user_org_role (user_id, org_id, role)
            VALUES (new_user_id, invite_org_id, COALESCE(invite_role, 'member')) RETURNING * INTO new_user_org_role;
          ELSE
            INSERT INTO user_org_role (user_id, org_id, role)
            VALUES (new_user_id, invite_org_id, 'member') RETURNING * INTO new_user_org_role;

            IF invite_role IS NOT NULL THEN
              INSERT INTO user_warehouse_role (user_id, warehouse_id, role)
              VALUES (new_user_id, invite_warehouse_id, invite_role)
              ON CONFLICT (user_id, warehouse_id) DO UPDATE SET role = EXCLUDED.role;
            END IF;
          END IF;
          RETURN new_user_org_role;
        END;
        $$;

        REVOKE ALL ON FUNCTION grant_invite_role FROM PUBLIC;
        GRANT EXECUTE ON FUNCTION grant_invite_role TO nestjs_app_user;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
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
          VALUES (new_user_id, invite_org_id, 'member') RETURNING * INTO new_user_org_role;

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
  }
}
