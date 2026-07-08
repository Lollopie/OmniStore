import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateWarehouseTable1783438313000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "warehouse" ("warehouse_id" uuid NOT NULL DEFAULT uuidv7(), "name" character varying NOT NULL, CONSTRAINT "PK_9744817e2d78a4e972fda9b2e20e10a9" PRIMARY KEY ("warehouse_id"))`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "warehouse"`);
  }
}
