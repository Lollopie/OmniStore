import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddOrganizationStripeSubscriptionId1791000001000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "organization"
        ADD COLUMN stripe_subscription_id text NULL DEFAULT NULL
        CONSTRAINT "UQ_organization_stripe_subscription_id" UNIQUE;
    `);
    await queryRunner.query(`DROP FUNCTION set_org_subscription(UUID, TEXT)`);
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION set_org_subscription(target_org_id UUID, plan TEXT, stripe_sub_id TEXT)
      RETURNS VOID
      LANGUAGE sql
      SECURITY DEFINER
      SET search_path = pg_catalog, public, pg_temp
      AS $$
        UPDATE organization
        SET subscription = plan, stripe_subscription_id = stripe_sub_id
        WHERE org_id = target_org_id;
      $$;

      REVOKE ALL ON FUNCTION set_org_subscription FROM PUBLIC;
      GRANT EXECUTE ON FUNCTION set_org_subscription TO nestjs_app_user;
    `);
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION clear_org_subscription(stripe_sub_id TEXT)
      RETURNS VOID
      LANGUAGE sql
      SECURITY DEFINER
      SET search_path = pg_catalog, public, pg_temp
      AS $$
        UPDATE organization
        SET subscription = NULL, stripe_subscription_id = NULL
        WHERE stripe_subscription_id = stripe_sub_id;
      $$;

      REVOKE ALL ON FUNCTION clear_org_subscription FROM PUBLIC;
      GRANT EXECUTE ON FUNCTION clear_org_subscription TO nestjs_app_user;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP FUNCTION clear_org_subscription`);
    await queryRunner.query(
      `DROP FUNCTION set_org_subscription(UUID, TEXT, TEXT)`,
    );
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION set_org_subscription(target_org_id UUID, plan TEXT)
      RETURNS VOID
      LANGUAGE sql
      SECURITY DEFINER
      SET search_path = pg_catalog, public, pg_temp
      AS $$
        UPDATE organization SET subscription = plan
        WHERE org_id = target_org_id;
      $$;

      REVOKE ALL ON FUNCTION set_org_subscription FROM PUBLIC;
      GRANT EXECUTE ON FUNCTION set_org_subscription TO nestjs_app_user;
    `);
    await queryRunner.query(
      `ALTER TABLE "organization" DROP COLUMN stripe_subscription_id`,
    );
  }
}
