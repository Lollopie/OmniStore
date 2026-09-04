import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateInventoryTable1782066151000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "inventory" (
                    item_id         uuid    NOT NULL    DEFAULT uuidv7(),
                    warehouse_id    uuid    NOT NULL, 
                    item_name       text    NOT NULL, 
                    amount          int     NOT NULL, 
                    CONSTRAINT "PK_inventory" PRIMARY KEY (item_id), 
                    CONSTRAINT "FK_warehouse" FOREIGN KEY (warehouse_id) REFERENCES "warehouse"(warehouse_id) ON DELETE CASCADE
      )`,
    );
    await queryRunner.query(`
            ALTER TABLE "inventory" ENABLE ROW LEVEL SECURITY;
    `);
    await queryRunner.query(`
      CREATE POLICY "warehouse_isolation_policy" ON "inventory"
      FOR ALL
      USING (warehouse_id = current_setting('app.current_warehouse_id')::uuid);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP POLICY "warehouse_isolation_policy" ON "inventory";
    `);
    await queryRunner.query(`DROP TABLE "inventory"`);
  }
}
