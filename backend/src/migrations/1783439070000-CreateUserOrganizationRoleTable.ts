import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateUserOrganizationRoleTable1783439070000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE user_org_role (
                  user_id   uuid,
                  org_id    uuid,
                  role      text    NOT NULL,
                  CONSTRAINT "PK_user_organization_role" PRIMARY KEY (user_id, org_id),
                  CONSTRAINT "FK_user" FOREIGN KEY (user_id) REFERENCES "user"(user_id) ON DELETE CASCADE,
                  CONSTRAINT "FK_organization" FOREIGN KEY (org_id) REFERENCES "organization"(org_id) ON DELETE CASCADE
       );`,
    );
    await queryRunner.query(`
            ALTER TABLE "user_org_role" ENABLE ROW LEVEL SECURITY;
    `);
    await queryRunner.query(`
        CREATE OR REPLACE FUNCTION get_user_org_role(check_user_id UUID, check_org_id UUID)
        RETURNS TEXT
        LANGUAGE sql
        SECURITY DEFINER
        SET search_path = pg_catalog, public, pg_temp
        STABLE
        AS $$
          SELECT role FROM user_org_role
          WHERE user_id = check_user_id AND org_id = check_org_id;
        $$;
        
        REVOKE ALL ON FUNCTION get_user_org_role FROM PUBLIC;
        GRANT EXECUTE ON FUNCTION get_user_org_role TO nestjs_app_user;
    `);
    await queryRunner.query(`
        CREATE OR REPLACE FUNCTION is_org_admin(check_user_id UUID, check_org_id UUID)
        RETURNS BOOLEAN
        LANGUAGE sql
        SECURITY DEFINER
        SET search_path = pg_catalog, public, pg_temp
        STABLE
        AS $$
          SELECT EXISTS (
            SELECT 1 FROM user_org_role
            WHERE user_id = check_user_id
              AND org_id = check_org_id
              AND role IN ('owner', 'admin')
          );
        $$;

        REVOKE ALL ON FUNCTION is_org_admin FROM PUBLIC;
        GRANT EXECUTE ON FUNCTION is_org_admin TO nestjs_app_user;
    `);
    // Mirrors ORG_INVITATION_PERMISSIONS: owners manage every role, admins
    // only admins and members
    await queryRunner.query(`
        CREATE OR REPLACE FUNCTION can_manage_org_role(actor_id UUID, check_org_id UUID, target_role TEXT)
        RETURNS BOOLEAN
        LANGUAGE sql
        SECURITY DEFINER
        SET search_path = pg_catalog, public, pg_temp
        STABLE
        AS $$
          SELECT EXISTS (
            SELECT 1 FROM user_org_role
            WHERE user_id = actor_id
              AND org_id = check_org_id
              AND (
                (role = 'owner' AND target_role IN ('owner', 'admin', 'member'))
                OR (role = 'admin' AND target_role IN ('admin', 'member'))
              )
          );
        $$;

        REVOKE ALL ON FUNCTION can_manage_org_role FROM PUBLIC;
        GRANT EXECUTE ON FUNCTION can_manage_org_role TO nestjs_app_user;
    `);
    // Rows are inserted only through SECURITY DEFINER functions and deleted via
    // FK cascades, so there are no INSERT or DELETE policies.
    await queryRunner.query(`
        CREATE POLICY uor_select ON user_org_role
            FOR SELECT
            USING (
                user_id = (NULLIF(current_setting('app.current_user_id', true), ''))::uuid
                OR (
                    org_id = (NULLIF(current_setting('app.current_org_id', true), ''))::uuid
                    AND is_org_admin(
                         (NULLIF(current_setting('app.current_user_id', true), ''))::uuid,
                         org_id
                       )
                )
            );
    `);
    // USING checks the old role and WITH CHECK the new one, so the actor must
    // be allowed to manage both
    await queryRunner.query(`
        CREATE POLICY uor_update_org_admin ON user_org_role
            FOR UPDATE
            USING (
                org_id = (NULLIF(current_setting('app.current_org_id', true), ''))::uuid
                AND can_manage_org_role(
                     (NULLIF(current_setting('app.current_user_id', true), ''))::uuid,
                     org_id,
                     role
                   )
            )
            WITH CHECK (
                org_id = (NULLIF(current_setting('app.current_org_id', true), ''))::uuid
                AND can_manage_org_role(
                     (NULLIF(current_setting('app.current_user_id', true), ''))::uuid,
                     org_id,
                     role
                   )
            );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP POLICY "uor_update_org_admin" ON "user_org_role";
      DROP POLICY "uor_select" ON "user_org_role";
      DROP FUNCTION can_manage_org_role;
    `);
    await queryRunner.query(`DROP TABLE "user_org_role"`);
  }
}
