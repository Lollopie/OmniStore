import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateUserWarehouseRoleTable1783439080000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE user_warehouse_role (
                                           user_id UUID REFERENCES "user"(user_id) ON DELETE CASCADE,
                                           warehouse_id UUID REFERENCES "warehouse"(warehouse_id) ON DELETE CASCADE,
                                           role VARCHAR(50) NOT NULL, -- e.g., 'manager', 'staff'
                                           PRIMARY KEY (user_id, warehouse_id)
       );`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "user_warehouse_role"`);
  }
}
