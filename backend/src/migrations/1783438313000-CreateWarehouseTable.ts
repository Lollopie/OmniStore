import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateWarehouseTable1783438313000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "warehouse" (  
                  warehouse_id  uuid        NOT NULL    DEFAULT uuidv7(), 
                  org_id        uuid        NOT NULL, 
                  name          text        NOT NULL, 
                  created_at    timestamptz NOT NULL,
                  CONSTRAINT "PK_warehouse" PRIMARY KEY (warehouse_id),
                  CONSTRAINT "FK_org_id" FOREIGN KEY (org_id) REFERENCES "organization"(org_id) ON DELETE CASCADE
      )`,
    );
    await queryRunner.query(`
            ALTER TABLE "warehouse" ENABLE ROW LEVEL SECURITY;
    `);
    await queryRunner.query(`
            ALTER TABLE "warehouse" FORCE ROW LEVEL SECURITY;
    `);
    await queryRunner.query(`
      CREATE POLICY "warehouse_isolation_policy" ON "warehouse"
      FOR ALL
      USING (org_id = current_setting('app.current_org_id')::uuid);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP POLICY "warehouse_isolation_policy" ON "warehouse";
    `);
    await queryRunner.query(`DROP TABLE "warehouse"`);
  }
}
