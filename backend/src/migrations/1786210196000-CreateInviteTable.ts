import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateInviteTable1786210196000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "invite" (
                  invite_id     uuid        NOT NULL    DEFAULT uuidv7(),
                  email         text        NOT NULL,
                  org_id        uuid        NOT NULL,
                  warehouse_id  uuid,
                  role          text        NOT NULL,
                  token_hash    text        NOT NULL    UNIQUE,
                  expires_at    timestamptz NOT NULL,
                  consumed_at   timestamptz,
                  created_at    timestamptz             DEFAULT NOW(),
                  CONSTRAINT "PK_invite" PRIMARY KEY (invite_id),
                  CONSTRAINT "FK_org" FOREIGN KEY (org_id) REFERENCES organization (org_id) ON DELETE CASCADE ON UPDATE CASCADE,
                  CONSTRAINT "FK_warehouse" FOREIGN KEY (warehouse_id) REFERENCES warehouse (warehouse_id) ON DELETE CASCADE ON UPDATE CASCADE
       )`,
    );
    await queryRunner.query(`
            ALTER TABLE "invite" ENABLE ROW LEVEL SECURITY;
    `);
    await queryRunner.query(`
            ALTER TABLE "invite" FORCE ROW LEVEL SECURITY;
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
            CREATE POLICY invite_org_and_org_admin ON user_org_role
                USING (
                    org_id = current_setting('app.current_org_id', true)::uuid
                    AND is_org_admin(
                         current_setting('app.current_user_id', true)::uuid,
                         current_setting('app.current_org_id', true)::uuid
                       )
                );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP POLICY "invite_org_and_org_admin" ON "invite";
    `);
    await queryRunner.query(`DROP TABLE "invite"`);
  }
}
