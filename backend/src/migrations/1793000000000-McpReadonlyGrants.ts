import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Read access for the mcp_readonly role. The role itself (login, password,
 * statement_timeout, default_transaction_read_only, schema usage) is created
 * outside migrations because the migrator can't create roles.
 *
 * RLS still applies; the MCP server sets the app.current_* settings itself.
 * Sensitive columns get no column grant, and new tables or columns stay
 * hidden until they are granted explicitly.
 */
export class McpReadonlyGrants1793000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Start from a clean slate in case the role was granted more by hand
    await queryRunner.query(`
        REVOKE ALL ON ALL TABLES IN SCHEMA public FROM mcp_readonly;
        REVOKE ALL ON ALL FUNCTIONS IN SCHEMA public FROM mcp_readonly;
    `);
    await queryRunner.query(`
        GRANT SELECT ON warehouse, inventory, user_org_role, user_warehouse_role TO mcp_readonly;

        GRANT SELECT (user_id, username, created_at) ON "user" TO mcp_readonly;
        GRANT SELECT (org_id, name, created_at, subscription) ON organization TO mcp_readonly;
        GRANT SELECT (invite_id, org_id, warehouse_id, role, expires_at, consumed_at, created_at)
            ON invite TO mcp_readonly;
        GRANT SELECT (id, f_name, l_name, created_at) ON contact TO mcp_readonly;
    `);
    // The RLS read policies call these, so SELECTs fail without them
    await queryRunner.query(`
        GRANT EXECUTE ON FUNCTION is_org_admin(UUID, UUID) TO mcp_readonly;
        GRANT EXECUTE ON FUNCTION is_warehouse_admin(UUID, UUID) TO mcp_readonly;
    `);
    // Databases created before these two were locked down still let PUBLIC
    // (and so mcp_readonly) execute them with the owner's rights
    await queryRunner.query(`
        REVOKE ALL ON FUNCTION create_org_registration FROM PUBLIC;
        GRANT EXECUTE ON FUNCTION create_org_registration TO nestjs_app_user;
        REVOKE ALL ON FUNCTION validate_invite FROM PUBLIC;
        GRANT EXECUTE ON FUNCTION validate_invite TO nestjs_app_user;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Revoking a table privilege also revokes the matching column privileges
    await queryRunner.query(`
        REVOKE ALL ON ALL TABLES IN SCHEMA public FROM mcp_readonly;
        REVOKE ALL ON ALL FUNCTIONS IN SCHEMA public FROM mcp_readonly;
    `);
  }
}
