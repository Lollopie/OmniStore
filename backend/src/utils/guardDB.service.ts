import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { OrganizationRole } from '@shared/enum/organizationRoles.enum';

@Injectable()
export class GuardDBService {
  constructor(private readonly dataSource: DataSource) {}
  async getUserOrgRole(
    userId: string,
    orgId: string,
  ): Promise<OrganizationRole> {
    const [row]: { role: keyof typeof OrganizationRole }[] =
      await this.dataSource.query(`SELECT get_user_org_role($1, $2) AS role`, [
        userId,
        orgId,
      ]);
    return OrganizationRole[row.role];
  }
  async getOrg(orgId: string): Promise<string> {
    const [row]: { name: string }[] = await this.dataSource.query(
      `SELECT get_org($1) AS name`,
      [orgId],
    );
    return row.name;
  }
}
