import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateOrganizationTable1782066150000 implements MigrationInterface {
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
      CREATE OR REPLACE FUNCTION get_org(check_org_id UUID)
      RETURNS TEXT
      LANGUAGE sql
      SECURITY DEFINER
      STABLE
      AS $$
        SELECT name FROM organization
        WHERE org_id = check_org_id;
      $$;
      
      REVOKE ALL ON FUNCTION get_org FROM PUBLIC;
      GRANT EXECUTE ON FUNCTION get_org TO nestjs_app_user;
    `);
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION create_organization(org_name TEXT, owner_user_id UUID)
      RETURNS organization
      LANGUAGE plpgsql
      SECURITY DEFINER
      AS $$
      DECLARE
        new_org organization;
      BEGIN
        INSERT INTO organization (name)
        VALUES (org_name)
        RETURNING * INTO new_org;
      
        INSERT INTO user_org_role (user_id, org_id, role)
        VALUES (owner_user_id, new_org.org_id, 'owner');
      
        RETURN new_org;
      END;
      $$;
      
      REVOKE ALL ON FUNCTION create_organization FROM PUBLIC;
      GRANT EXECUTE ON FUNCTION create_organization TO nestjs_app_user;
    `);
    await queryRunner.query(`
      CREATE POLICY "organization_select_policy" ON "organization"
        FOR SELECT
        USING (org_id = current_setting('app.current_org_id', true)::uuid);
    `);
    await queryRunner.query(`
      CREATE POLICY "organization_update_policy" ON "organization"
        FOR UPDATE
        USING (org_id = current_setting('app.current_org_id', true)::uuid);
    `);
    await queryRunner.query(`
      CREATE POLICY "organization_delete_policy" ON "organization"
        FOR DELETE
        USING (org_id = current_setting('app.current_org_id', true)::uuid);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP POLICY "organization_select_policy" ON "organization";
    `);
    await queryRunner.query(`
      DROP POLICY "organization_update_policy" ON "organization";
    `);
    await queryRunner.query(`
      DROP POLICY "organization_delete_policy" ON "organization";
    `);
    await queryRunner.query(`DROP TABLE "organization"`);
  }
}
