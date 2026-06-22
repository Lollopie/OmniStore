import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateUserTable1782066103000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "user" ("user_id" uuid NOT NULL DEFAULT uuidv7(), "username" character varying NOT NULL, "password" character varying NOT NULL, CONSTRAINT "PK_bbcbff593cc8a39357b400788666fc54" PRIMARY KEY ("user_id"))`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "user"`);
  }
}
