import { OrganizationEntity } from '../../../src/organization/organization.entity';
import { UserEntity } from '../../../src/user/user.entity';
import { WarehouseEntity } from '../../../src/warehouse/warehouse.entity';
import { DataSource } from 'typeorm';
import {
  seedInventories,
  seedOrganization,
  seedOrgRole,
  seedUser,
  seedWarehouseRole,
} from '../../databaseSeeds/seed';
import { seedWarehouses } from '../../databaseSeeds/seed';
import { InventoryEntity } from '../../../src/inventory/inventory.entity';

export class ScenarioBuilder {
  private org: OrganizationEntity;
  private warehouses: Record<string, WarehouseEntity> = {};
  private users: Record<string, UserEntity> = {};
  private inventory: Record<string, InventoryEntity> = {};
  private ds: DataSource;

  static create(dataSource: DataSource): ScenarioBuilder {
    const builder = new ScenarioBuilder();
    builder.ds = dataSource;
    return builder;
  }

  async withOrganization(name: string): Promise<ScenarioBuilder> {
    this.org = await seedOrganization(this.ds, name);
    return this;
  }

  async withWarehouse(name: string): Promise<ScenarioBuilder> {
    this.warehouses[name] = await seedWarehouses(this.ds, this.org, name);
    return this;
  }
  async withUser(
    username: string,
    orgRole?: string,
    warehouseName?: string[],
    warehouseRole?: string[],
  ): Promise<ScenarioBuilder> {
    this.users[username] = await seedUser(this.ds, username);
    if (orgRole)
      await seedOrgRole(this.ds, this.users[username], this.org, orgRole);
    if (warehouseRole) {
      for (let i = 0; i < warehouseName.length; i++) {
        await seedWarehouseRole(
          this.ds,
          this.users[username],
          this.warehouses[warehouseName[i]],
          warehouseRole[i],
        );
      }
    }
    return this;
  }
  async withInventory(
    warehouseName: string,
    itemName: string,
    itemAmount: number,
  ): Promise<ScenarioBuilder> {
    this.inventory[itemName] = await seedInventories(
      this.ds,
      this.warehouses[warehouseName],
      itemName,
      itemAmount,
    );
    return this;
  }
}
