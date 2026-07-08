import { MigrationInterface, QueryRunner } from 'typeorm';

export class InventoryRefactoring1783438667000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP POLICY "user_isolation_policy" ON "inventory";`,
    );
    await queryRunner.query(`ALTER TABLE "inventory" DROP COLUMN "user_id";`);

    await queryRunner.query(
      `ALTER TABLE "inventory" ADD COLUMN "warehouse_id" uuid NOT NULL;`,
    );

    await queryRunner.query(
      `ALTER TABLE "inventory" ADD CONSTRAINT "FK_inventory_warehouse" 
       FOREIGN KEY ("warehouse_id") REFERENCES "warehouse"("warehouse_id") ON DELETE CASCADE;`,
    );

    await queryRunner.query(`
      CREATE POLICY "warehouse_isolation_policy" ON "inventory"
      FOR ALL
      USING ("warehouse_id" = current_setting('app.current_warehouse_id')::uuid);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP POLICY "warehouse_isolation_policy" ON "inventory";`,
    );

    await queryRunner.query(
      `ALTER TABLE "inventory" DROP CONSTRAINT "FK_inventory_warehouse";`,
    );
    await queryRunner.query(
      `ALTER TABLE "inventory" DROP COLUMN "warehouse_id";`,
    );

    await queryRunner.query(
      `ALTER TABLE "inventory" ADD COLUMN "user_id" uuid NOT NULL;`,
    );
    await queryRunner.query(
      `ALTER TABLE "inventory" ADD CONSTRAINT "FK_inventory_user" 
       FOREIGN KEY ("user_id") REFERENCES "user"("user_id") ON DELETE CASCADE;`,
    );

    await queryRunner.query(`
      CREATE POLICY "user_isolation_policy" ON "inventory"
      FOR ALL
      USING ("user_id" = current_setting('app.current_user_id')::uuid);
    `);
  }
}
