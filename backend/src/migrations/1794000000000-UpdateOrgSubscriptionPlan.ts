import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Lets webhooks change the plan of an existing subscription, e.g. after a plan
 * switch in the Stripe Customer Portal. Only the organization holding that
 * Stripe subscription is updated.
 */
export class UpdateOrgSubscriptionPlan1794000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION update_org_subscription_plan(stripe_sub_id TEXT, plan TEXT)
      RETURNS VOID
      LANGUAGE sql
      SECURITY DEFINER
      SET search_path = pg_catalog, public, pg_temp
      AS $$
        UPDATE organization
        SET subscription = plan
        WHERE stripe_subscription_id = stripe_sub_id;
      $$;

      REVOKE ALL ON FUNCTION update_org_subscription_plan FROM PUBLIC;
      GRANT EXECUTE ON FUNCTION update_org_subscription_plan TO nestjs_app_user;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP FUNCTION update_org_subscription_plan`);
  }
}
