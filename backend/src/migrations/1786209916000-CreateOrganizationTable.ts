import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateOrganizationTable1786209916000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "organization" (
                    org_id      uuid        NOT NULL    DEFAULT uuidv7(), 
                    name        text        NOT NULL,
                    created_at  timestamptz             DEFAULT NOW(), 
                    CONSTRAINT "PK_organization" PRIMARY KEY (org_id)
      )`,
    );
    await queryRunner.query(`
            ALTER TABLE "organization" ENABLE ROW LEVEL SECURITY;
    `);
    await queryRunner.query(`
            ALTER TABLE "organization" FORCE ROW LEVEL SECURITY;
    `);
    await queryRunner.query(`
      CREATE POLICY "organization_isolation_policy" ON "organization"
      FOR ALL
      USING (org_id = current_setting('app.current_org_id')::uuid);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP POLICY "organization_isolation_policy" ON "organization";
    `);
    await queryRunner.query(`DROP TABLE "organization"`);
  }
}
