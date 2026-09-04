import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateUserTable1782066103000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "user" (
                    user_id     uuid    NOT NULL    DEFAULT uuidv7(), 
                    email       text    NOT NULL,
                    username    text    NOT NULL,
                    password    text    NOT NULL, 
                    created_at  timestamptz         DEFAULT NOW(), 
                    CONSTRAINT "PK_user" PRIMARY KEY (user_id)
      )`,
    );
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION get_cookie_info(p_username TEXT)
      RETURNS TABLE(
            user_id UUID, 
            username TEXT,
            org_id UUID, 
            org_role TEXT, 
            warehouse_id UUID,
            warehouse_name TEXT,
            warehouse_role TEXT
      )
      LANGUAGE plpgsql
      SECURITY DEFINER
      STABLE
      AS $$
      BEGIN
        RETURN QUERY
        SELECT 
            u.user_id,
            u.username,
            uor.org_id,
            uor.role AS org_role,
            w.warehouse_id,
            w.name AS warehouse_name,
            uwr.role AS warehouse_role
        FROM "user" u
        INNER JOIN user_org_role uor 
            ON u.user_id = uor.user_id
        LEFT JOIN warehouse w 
            ON w.org_id = uor.org_id
        LEFT JOIN user_warehouse_role uwr 
            ON w.warehouse_id = uwr.warehouse_id 
                AND uwr.user_id = u.user_id
        WHERE u.username = p_username;
      END;
      $$;
      
      REVOKE ALL ON FUNCTION get_cookie_info FROM PUBLIC;
      GRANT EXECUTE ON FUNCTION get_cookie_info TO nestjs_app_user;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "user"`);
  }
}
