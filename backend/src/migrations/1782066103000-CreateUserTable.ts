import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateUserTable1782066103000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "user" ("user_id" uuid NOT NULL DEFAULT uuidv7(), "username" character varying NOT NULL, "password" character varying NOT NULL, CONSTRAINT "PK_bbcbff593cc8a39357b400788666fc54" PRIMARY KEY ("user_id"))`,
    );
    await queryRunner.query(`ALTER TABLE "user" ENABLE ROW LEVEL SECURITY;`);
    await queryRunner.query(`
            CREATE POLICY "tenant_isolation_policy" ON "user"
            FOR ALL
            USING ("user_id" = current_setting('app.current_tenant')::uuid);
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // 1. Manually drop policies first
    await queryRunner.query(`DROP POLICY "tenant_isolation_policy" ON "user";`);

    // 2. TypeORM's generated drop table SQL
    await queryRunner.query(`DROP TABLE "user"`);
  }
}
