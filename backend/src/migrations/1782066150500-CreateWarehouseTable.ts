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
                  CONSTRAINT "FK_org_id" FOREIGN KEY (org_id) REFERENCES "organization"(org_id) ON DELETE CASCADE
      )`,
    );
    await queryRunner.query(`
            ALTER TABLE "warehouse" ENABLE ROW LEVEL SECURITY;
    `);
    await queryRunner.query(`
        CREATE OR REPLACE FUNCTION create_warehouse(
          wh_org_id UUID,
          wh_name TEXT,
          creator_user_id UUID,
          user_role TEXT
        )
        RETURNS warehouse
        LANGUAGE plpgsql
        SECURITY DEFINER
        AS $$
        DECLARE
          new_wh warehouse;
        BEGIN
          INSERT INTO warehouse (org_id, name)
          VALUES (wh_org_id, wh_name)
          RETURNING * INTO new_wh;
        
          INSERT INTO user_warehouse_role (user_id, warehouse_id, role)
          VALUES (creator_user_id, new_wh.warehouse_id, user_role);
        
          RETURN new_wh;
        END;
        $$;
        
        REVOKE ALL ON FUNCTION create_warehouse FROM PUBLIC;
        GRANT EXECUTE ON FUNCTION create_warehouse TO nestjs_app_user;
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
