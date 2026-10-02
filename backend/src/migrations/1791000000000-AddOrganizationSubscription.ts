import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddOrganizationSubscription1791000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "organization"
        ADD COLUMN subscription text NULL DEFAULT NULL
        CONSTRAINT "CHK_organization_subscription"
          CHECK (subscription IN ('starter', 'growth', 'enterprise'));
    `);
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION get_org_subscription(check_org_id UUID)
      RETURNS TEXT
      LANGUAGE sql
      SECURITY DEFINER
      STABLE
      AS $$
        SELECT subscription FROM organization
        WHERE org_id = check_org_id;
      $$;

      REVOKE ALL ON FUNCTION get_org_subscription FROM PUBLIC;
      GRANT EXECUTE ON FUNCTION get_org_subscription TO nestjs_app_user;
    `);
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION set_org_subscription(target_org_id UUID, plan TEXT)
      RETURNS VOID
      LANGUAGE sql
      SECURITY DEFINER
      AS $$
        UPDATE organization SET subscription = plan
        WHERE org_id = target_org_id;
      $$;

      REVOKE ALL ON FUNCTION set_org_subscription FROM PUBLIC;
      GRANT EXECUTE ON FUNCTION set_org_subscription TO nestjs_app_user;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP FUNCTION set_org_subscription`);
    await queryRunner.query(`DROP FUNCTION get_org_subscription`);
    await queryRunner.query(
      `ALTER TABLE "organization" DROP COLUMN subscription`,
    );
  }
}
