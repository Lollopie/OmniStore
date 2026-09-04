import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateWarehouseTable1782066150500 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "warehouse" (  
                  warehouse_id  uuid        NOT NULL    DEFAULT uuidv7(), 
                  org_id        uuid        NOT NULL, 
                  name          text        NOT NULL, 
                  created_at    timestamptz             DEFAULT NOW(),
                  CONSTRAINT "PK_warehouse" PRIMARY KEY (warehouse_id),
                  CONSTRAINT "FK_org_id" FOREIGN KEY (org_id) REFERENCES "organization"(org_id) ON DELETE CASCADE,
                  CONSTRAINT "UQ_warehouse_id_org" UNIQUE (warehouse_id, org_id)
      )`,
    );
    await queryRunner.query(`
            ALTER TABLE "warehouse" ENABLE ROW LEVEL SECURITY;
    `);
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION get_warehouse(check_warehouse_id UUID)
      RETURNS TEXT
      LANGUAGE sql
      SECURITY DEFINER
      STABLE
      AS $$
        SELECT name FROM warehouse
        WHERE warehouse_id = check_warehouse_id;
      $$;
      
      REVOKE ALL ON FUNCTION get_warehouse FROM PUBLIC;
      GRANT EXECUTE ON FUNCTION get_warehouse TO nestjs_app_user;
    `);
    await queryRunner.query(`
      CREATE POLICY "warehouse_isolation_policy" ON "warehouse"
      FOR ALL
      USING (org_id = current_setting('app.current_org_id', true)::uuid);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP POLICY "warehouse_isolation_policy" ON "warehouse";
    `);
    await queryRunner.query(`DROP TABLE "warehouse"`);
  }
}
