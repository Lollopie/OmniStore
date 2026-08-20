import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { OrganizationRole } from '@shared/enum/organizationRoles.enum';
import { WarehouseRole } from '@shared/enum/warehouseRoles.enum';

@Injectable()
export class GuardDBService {
  constructor(private readonly dataSource: DataSource) {}
  async getUserOrgRole(
    userId: string,
    orgId: string,
  ): Promise<OrganizationRole> {
    const [row]: { role: OrganizationRole }[] = await this.dataSource.query(
      `SELECT get_user_org_role($1, $2) AS role`,
      [userId, orgId],
    );
    return row.role;
  }
  async getOrg(orgId: string): Promise<string> {
    const [row]: { name: string }[] = await this.dataSource.query(
      `SELECT get_org($1) AS name`,
      [orgId],
    );
    return row.name;
  }
  async findWarehouse(warehouseId: string): Promise<string> {
    const [row]: { name: string }[] = await this.dataSource.query(
      `SELECT get_warehouse($1) AS name`,
      [warehouseId],
    );
    return row.name;
  }
  async getUserWarehouseRole(
    userId: string,
    warehouseId: string,
  ): Promise<WarehouseRole> {
    const [row]: { role: WarehouseRole }[] = await this.dataSource.query(
      `SELECT get_user_warehouse_role($1, $2) AS role`,
      [userId, warehouseId],
    );
    return row.role;
  }
}
