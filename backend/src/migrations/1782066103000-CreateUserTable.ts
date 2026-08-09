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
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "user"`);
  }
}
