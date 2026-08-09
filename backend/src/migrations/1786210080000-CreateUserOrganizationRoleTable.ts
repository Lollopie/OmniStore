import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateUserOrganizationRoleTable1786210080000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE user_org_role (
                  user_id   uuid,
                  org_id    uuid,
                  role      text    NOT NULL,
                  CONSTRAINT "PK_user_organization_role" PRIMARY KEY (user_id, org_id),
                  CONSTRAINT "FK_user" FOREIGN KEY (user_id) REFERENCES "user"(user_id) ON DELETE CASCADE,
                  CONSTRAINT "FK_organization" FOREIGN KEY (org_id) REFERENCES "organization"(org_id) ON DELETE CASCADE
       );`,
    );
    await queryRunner.query(`
            ALTER TABLE "user_org_role" ENABLE ROW LEVEL SECURITY;
    `);
    await queryRunner.query(`
            ALTER TABLE "user_org_role" FORCE ROW LEVEL SECURITY;
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
            GRANT EXECUTE ON FUNCTION is_org_admin TO app_user;
    `);
    await queryRunner.query(`
            CREATE POLICY uor_self_or_org_admin ON user_org_role
                USING (
                    user_id = current_setting('app.current_user_id', true)::uuid
                    OR is_org_admin(
                         current_setting('app.current_user_id', true)::uuid,
                         current_setting('app.current_org_id', true)::uuid
                       )
                );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP POLICY "uor_self_or_org_admin" ON "user_org_role";
    `);
    await queryRunner.query(`DROP TABLE "user_org_role"`);
  }
}
