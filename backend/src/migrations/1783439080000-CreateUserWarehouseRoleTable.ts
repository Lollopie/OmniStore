import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateUserWarehouseRoleTable1783439080000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE user_warehouse_role (
                 user_id        uuid    NOT NULL,
                 warehouse_id   uuid    NOT NULL,
                 role           text    NOT NULL,
                 CONSTRAINT "PK_user_warehouse_role" PRIMARY KEY (user_id, warehouse_id),
                 CONSTRAINT "FK_user" FOREIGN KEY (user_id) REFERENCES "user"(user_id) ON DELETE CASCADE,
                 CONSTRAINT "FK_warehouse" FOREIGN KEY (warehouse_id) REFERENCES "warehouse"(warehouse_id) ON DELETE CASCADE
       )`,
    );
    await queryRunner.query(`
            ALTER TABLE "user_warehouse_role" ENABLE ROW LEVEL SECURITY;
    `);
    await queryRunner.query(`
        CREATE OR REPLACE FUNCTION get_user_warehouse_role(check_user_id UUID, check_warehouse_id UUID)
        RETURNS TEXT
        LANGUAGE sql
        SECURITY DEFINER
        SET search_path = pg_catalog, public, pg_temp
        STABLE
        AS $$
          SELECT role FROM user_warehouse_role
          WHERE user_id = check_user_id AND warehouse_id = check_warehouse_id;
        $$;
        
        REVOKE ALL ON FUNCTION get_user_warehouse_role FROM PUBLIC;
        GRANT EXECUTE ON FUNCTION get_user_warehouse_role TO nestjs_app_user;
    `);
    await queryRunner.query(`
        CREATE OR REPLACE FUNCTION is_warehouse_admin(check_user_id UUID, check_warehouse_id UUID)
        RETURNS BOOLEAN
        LANGUAGE sql
        SECURITY DEFINER
        SET search_path = pg_catalog, public, pg_temp
        STABLE
        AS $$
          SELECT EXISTS (
            SELECT 1 FROM user_warehouse_role
            WHERE user_id = check_user_id
              AND warehouse_id = check_warehouse_id
              AND role IN ('admin', 'manager')
          );
        $$;
        
        -- lock the function down so it can't be called arbitrarily to probe other users
        REVOKE ALL ON FUNCTION is_warehouse_admin FROM PUBLIC;
        GRANT EXECUTE ON FUNCTION is_warehouse_admin TO nestjs_app_user;
    `);
    // Mirrors ORG_WAREHOUSE_INVITATION_PERMISSIONS and
    // WAREHOUSE_INVITATION_PERMISSIONS. RLS is bypassed here, so the join on
    // warehouse checks that the target warehouse belongs to the actor's org.
    await queryRunner.query(`
        CREATE OR REPLACE FUNCTION can_manage_warehouse_role(
          actor_id UUID,
          actor_org_id UUID,
          actor_warehouse_id UUID,
          target_warehouse_id UUID,
          target_role TEXT
        )
        RETURNS BOOLEAN
        LANGUAGE sql
        SECURITY DEFINER
        SET search_path = pg_catalog, public, pg_temp
        STABLE
        AS $$
          SELECT target_role IN ('admin', 'manager', 'staff') AND (
            EXISTS (
              SELECT 1
              FROM user_org_role uor
              JOIN warehouse w ON w.org_id = uor.org_id
              WHERE uor.user_id = actor_id
                AND uor.org_id = actor_org_id
                AND w.warehouse_id = target_warehouse_id
                AND uor.role IN ('owner', 'admin')
            )
            OR (
              target_warehouse_id = actor_warehouse_id
              AND EXISTS (
                SELECT 1 FROM user_warehouse_role
                WHERE user_id = actor_id
                  AND warehouse_id = target_warehouse_id
                  AND (role = 'admin' OR (role = 'manager' AND target_role = 'staff'))
              )
            )
          );
        $$;

        REVOKE ALL ON FUNCTION can_manage_warehouse_role FROM PUBLIC;
        GRANT EXECUTE ON FUNCTION can_manage_warehouse_role TO nestjs_app_user;
    `);
    await queryRunner.query(`
        CREATE OR REPLACE FUNCTION is_warehouse_org_member(check_user_id UUID, check_warehouse_id UUID)
        RETURNS BOOLEAN
        LANGUAGE sql
        SECURITY DEFINER
        SET search_path = pg_catalog, public, pg_temp
        STABLE
        AS $$
          SELECT EXISTS (
            SELECT 1
            FROM user_org_role uor
            JOIN warehouse w ON w.org_id = uor.org_id
            WHERE uor.user_id = check_user_id
              AND w.warehouse_id = check_warehouse_id
          );
        $$;

        REVOKE ALL ON FUNCTION is_warehouse_org_member FROM PUBLIC;
        GRANT EXECUTE ON FUNCTION is_warehouse_org_member TO nestjs_app_user;
    `);
    // A row is visible to an admin of the org that owns its warehouse (the
    // warehouse RLS policy limits the subquery to the current org) or to an
    // admin/manager of the active warehouse. Rows are deleted only via FK
    // cascades, so there is no DELETE policy.
    const canSeeRow = `(
              (
                  EXISTS (
                      SELECT 1 FROM warehouse w
                      WHERE w.warehouse_id = user_warehouse_role.warehouse_id
                  )
                  AND is_org_admin(
                       (NULLIF(current_setting('app.current_user_id', true), ''))::uuid,
                       (NULLIF(current_setting('app.current_org_id', true), ''))::uuid
                     )
              )
              OR (
                  warehouse_id = (NULLIF(current_setting('app.current_warehouse_id', true), ''))::uuid
                  AND is_warehouse_admin(
                       (NULLIF(current_setting('app.current_user_id', true), ''))::uuid,
                       warehouse_id
                     )
              )
          )`;
    await queryRunner.query(`
          CREATE POLICY uwr_select ON user_warehouse_role
              FOR SELECT
              USING (
                  user_id = (NULLIF(current_setting('app.current_user_id', true), ''))::uuid
                  OR ${canSeeRow}
              );
    `);
    // Writes check the role being assigned. On UPDATE, USING sees the old role
    // and WITH CHECK the new one, so the actor must be allowed to manage both.
    const canManageRole = `can_manage_warehouse_role(
                  (NULLIF(current_setting('app.current_user_id', true), ''))::uuid,
                  (NULLIF(current_setting('app.current_org_id', true), ''))::uuid,
                  (NULLIF(current_setting('app.current_warehouse_id', true), ''))::uuid,
                  warehouse_id,
                  role
              )`;
    await queryRunner.query(`
          CREATE POLICY uwr_insert ON user_warehouse_role
              FOR INSERT
              WITH CHECK (
                  ${canManageRole}
                  AND is_warehouse_org_member(user_id, warehouse_id)
              );
    `);
    await queryRunner.query(`
          CREATE POLICY uwr_update ON user_warehouse_role
              FOR UPDATE
              USING (${canManageRole})
              WITH CHECK (
                  ${canManageRole}
                  AND is_warehouse_org_member(user_id, warehouse_id)
              );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
        DROP POLICY "uwr_update" ON "user_warehouse_role";
        DROP POLICY "uwr_insert" ON "user_warehouse_role";
        DROP POLICY "uwr_select" ON "user_warehouse_role";
        DROP FUNCTION is_warehouse_org_member;
        DROP FUNCTION can_manage_warehouse_role;
    `);
    await queryRunner.query(`
        DROP TABLE "user_warehouse_role";
    `);
  }
}
