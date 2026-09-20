import { DataSource } from 'typeorm';
import { OrganizationEntity } from '../../src/organization/organization.entity';
import { WarehouseEntity } from '../../src/warehouse/warehouse.entity';
import { InventoryEntity } from '../../src/inventory/inventory.entity';
import { UserEntity } from '../../src/user/user.entity';
import * as bcrypt from 'bcrypt';
import { UserOrganizationRoleEntity } from '../../src/userOrganizationRole/userOrganizationRole.entity';
import { UserWarehouseRoleEntity } from '../../src/userWarehouseRole/userWarehouseRole.entity';

export async function seedOrganization(
  dataSource: DataSource,
  orgName: string,
): Promise<OrganizationEntity> {
  const organizationRepository = dataSource.getRepository(OrganizationEntity);

  return await organizationRepository.save(
    organizationRepository.create({
      name: orgName,
    }),
  );
}

export async function seedWarehouses(
  datasource: DataSource,
  organization: OrganizationEntity,
  name: string,
): Promise<WarehouseEntity> {
  const warehouseRepository = datasource.getRepository(WarehouseEntity);

  return await warehouseRepository.save(
    warehouseRepository.create({
      orgId: organization.orgId,
      name: name,
    }),
  );
}

export async function seedInventories(
  dataSource: DataSource,
  warehouse: WarehouseEntity,
  itemName: string,
  itemAmount: number,
): Promise<InventoryEntity> {
  const inventoryRepository = dataSource.getRepository(InventoryEntity);

  return await inventoryRepository.save(
    inventoryRepository.create({
      itemName: itemName,
      amount: itemAmount,
      warehouseId: warehouse.warehouseId,
    }),
  );
}

export async function seedUser(
  dataSource: DataSource,
  username: string,
): Promise<UserEntity> {
  const userRepository = dataSource.getRepository(UserEntity);
  const password = 'password1';
  const saltRounds = process.env.NODE_ENV === 'test' ? 1 : 10;
  const hashedPassword = await bcrypt.hash(password, saltRounds);
  return await userRepository.save(
    userRepository.create({
      email: username + '@example.org',
      username: username,
      password: hashedPassword,
    }),
  );
}

export async function seedOrgRole(
  dataSource: DataSource,
  user: UserEntity,
  org: OrganizationEntity,
  role: string,
): Promise<UserOrganizationRoleEntity> {
  const userOrgRoleRepository = dataSource.getRepository(
    UserOrganizationRoleEntity,
  );
  return await userOrgRoleRepository.save(
    userOrgRoleRepository.create({
      userId: user.userId,
      orgId: org.orgId,
      role: role,
    }),
  );
}

export async function seedWarehouseRole(
  dataSource: DataSource,
  user: UserEntity,
  warehouse: WarehouseEntity,
  role: string,
): Promise<UserWarehouseRoleEntity> {
  const userWarehouseRoleEntityRepository = dataSource.getRepository(
    UserWarehouseRoleEntity,
  );
  return await userWarehouseRoleEntityRepository.save(
    userWarehouseRoleEntityRepository.create({
      userId: user.userId,
      warehouseId: warehouse.warehouseId,
      role: role,
    }),
  );
}
