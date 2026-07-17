import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddRLSUserWarehouseRole1784213959000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user_warehouse_role" ENABLE ROW LEVEL SECURITY;`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_warehouse_role" FORCE ROW LEVEL SECURITY;`,
    );
    await queryRunner.query(`
            CREATE POLICY "select_access_policy" ON "user_warehouse_role"
            FOR SELECT
            USING (
                user_id = NULLIF(current_setting('app.current_user_id', true), '')::uuid
                OR
                warehouse_id = NULLIF(current_setting('app.current_warehouse_id', true), '')::uuid
            );
    `);
    await queryRunner.query(`
            CREATE POLICY "insert_access_policy" ON "user_warehouse_role"
            FOR INSERT
            WITH CHECK (
                user_id = NULLIF(current_setting('app.current_user_id', true), '')::uuid
                AND
                warehouse_id = NULLIF(current_setting('app.current_warehouse_id', true), '')::uuid
            );
    `);
    await queryRunner.query(`
            CREATE POLICY "update_access_policy" ON "user_warehouse_role"
            FOR UPDATE
            USING (
                user_id = NULLIF(current_setting('app.current_user_id', true), '')::uuid
                AND
                warehouse_id = NULLIF(current_setting('app.current_warehouse_id', true), '')::uuid
            )
            WITH CHECK (
                user_id = NULLIF(current_setting('app.current_user_id', true), '')::uuid
                AND
                warehouse_id = NULLIF(current_setting('app.current_warehouse_id', true), '')::uuid
            );
`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP POLICY "select_access_policy" ON "user_warehouse_role";`,
    );
    await queryRunner.query(
      `DROP POLICY "insert_access_policy" ON "user_warehouse_role";`,
    );
    await queryRunner.query(
      `DROP POLICY "update_access_policy" ON "user_warehouse_role";`,
    );
  }
}
