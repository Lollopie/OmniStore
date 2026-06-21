import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateInventoryTable1782066151000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "inventory" ("id" uuid NOT NULL, "user_id" uuid NOT NULL, "name" character varying NOT NULL, "amount" INT NOT NULL, CONSTRAINT "PK_74732cddf63f975c6fbcf65132818415" PRIMARY KEY ("id"), FOREIGN KEY ("user_id") REFERENCES "user"("user_id") ON DELETE CASCADE)`,
    );
    await queryRunner.query(
      `ALTER TABLE "inventory" ENABLE ROW LEVEL SECURITY;`,
    );
    await queryRunner.query(`
            CREATE POLICY "tenant_isolation_policy" ON "inventory"
            FOR ALL
            USING ("user_id" = current_setting('app.current_tenant')::uuid);
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // 1. Manually drop policies first
    await queryRunner.query(
      `DROP POLICY "tenant_isolation_policy" ON "inventory";`,
    );

    // 2. TypeORM's generated drop table SQL
    await queryRunner.query(`DROP TABLE "inventory"`);
  }
}
