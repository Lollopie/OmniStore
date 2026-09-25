import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateContactTable1790348573000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "contact" (
                    id          uuid    NOT NULL    DEFAULT uuidv7(), 
                    f_name      text    NOT NULL,
                    l_name      text    NOT NULL,
                    email       text    NOT NULL,
                    message     text    NOT NULL,
                    created_at  timestamptz         DEFAULT NOW(), 
                    CONSTRAINT "PK_contact" PRIMARY KEY (id)
      )`,
    );
    await queryRunner.query(`
        ALTER TABLE "contact" ENABLE ROW LEVEL SECURITY;
    `);
    await queryRunner.query(`
        ALTER TABLE "contact" FORCE ROW LEVEL SECURITY;
    `);
    await queryRunner.query(`
        CREATE POLICY "contact_insert_policy" ON "contact"
        FOR INSERT
        WITH CHECK (true);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "contact"`);
  }
}
