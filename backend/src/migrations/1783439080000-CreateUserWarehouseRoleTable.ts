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
        STABLE
        AS $$
          SELECT role FROM user_warehouse_role
          WHERE user_id = check_user_id AND warehouse_id = check_warehouse_id;
        $$;
        
        REVOKE ALL ON FUNCTION get_user_warehouse_role FROM PUBLIC;
        GRANT EXECUTE ON FUNCTION get_user_warehouse_role TO nestjs_app_user;
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
          CREATE POLICY uwr_self_or_org_admin ON user_warehouse_role
              USING (
                  user_id = current_setting('app.current_user_id', true)::uuid
                  OR is_org_admin(
                       current_setting('app.current_user_id', true)::uuid,
                       (SELECT org_id FROM warehouse WHERE warehouse_id = user_warehouse_role.warehouse_id)
                     )
              );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
        DROP POLICY "uwr_self_or_org_admin" ON "user_warehouse_role";
    `);
    await queryRunner.query(`
        DROP TABLE "user_warehouse_role";
    `);
  }
}
