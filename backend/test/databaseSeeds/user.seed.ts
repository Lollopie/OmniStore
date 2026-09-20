import { DataSource } from 'typeorm';
import { UserEntity } from '../../src/user/user.entity';
import { OrganizationEntity } from '../../src/organization/organization.entity';
import { UserOrganizationRoleEntity } from '../../src/userOrganizationRole/userOrganizationRole.entity';
import { UserWarehouseRoleEntity } from '../../src/userWarehouseRole/userWarehouseRole.entity';
import { WarehouseEntity } from '../../src/warehouse/warehouse.entity';
import * as bcrypt from 'bcrypt';
import { OrganizationRole } from '../../../shared/src/enum/organizationRoles.enum';
import { WarehouseRole } from '../../../shared/src/enum/warehouseRoles.enum';

export async function seedUsers(dataSource: DataSource): Promise<void> {
  const userRepository = dataSource.getRepository(UserEntity);
  const organizationRepository = dataSource.getRepository(OrganizationEntity);
  const warehouseRepository = dataSource.getRepository(WarehouseEntity);
  const userOrgRoleRepository = dataSource.getRepository(
    UserOrganizationRoleEntity,
  );
  const userWarehouseRoleRepository = dataSource.getRepository(
    UserWarehouseRoleEntity,
  );

  const organizationOne = await organizationRepository.findOneOrFail({
    where: { name: 'Organization 1' },
  });
  const organizationTwo = await organizationRepository.findOneOrFail({
    where: { name: 'Organization 2' },
  });

  const warehouseOne = await warehouseRepository.findOneOrFail({
    where: { name: 'Warehouse 1' },
  });
  const warehouseTwo = await warehouseRepository.findOneOrFail({
    where: { name: 'Warehouse 2' },
  });
  const warehouseThree = await warehouseRepository.findOneOrFail({
    where: { name: 'Warehouse 3' },
  });

  const password = 'password1';
  const saltRounds = process.env.NODE_ENV === 'test' ? 1 : 10;
  const hashedPassword = await bcrypt.hash(password, saltRounds);

  const userOne = await userRepository.save(
    userRepository.create({
      email: 'user1@example.org',
      username: 'user1',
      password: hashedPassword,
    }),
  );
  const userTwo = await userRepository.save(
    userRepository.create({
      email: 'user2@example.org',
      username: 'user2',
      password: hashedPassword,
    }),
  );
  const userThree = await userRepository.save(
    userRepository.create({
      email: 'user3@example.org',
      username: 'user3',
      password: hashedPassword,
    }),
  );
  const userFour = await userRepository.save(
    userRepository.create({
      email: 'user4@example.org',
      username: 'user4',
      password: hashedPassword,
    }),
  );

  await userOrgRoleRepository.save(
    userOrgRoleRepository.create({
      userId: userOne.userId,
      orgId: organizationOne.orgId,
      role: OrganizationRole.OWNER,
    }),
  );
  await userOrgRoleRepository.save(
    userOrgRoleRepository.create({
      userId: userTwo.userId,
      orgId: organizationOne.orgId,
      role: OrganizationRole.ADMIN,
    }),
  );
  await userOrgRoleRepository.save(
    userOrgRoleRepository.create({
      userId: userThree.userId,
      orgId: organizationOne.orgId,
      role: OrganizationRole.MEMBER,
    }),
  );

  await userWarehouseRoleRepository.save(
    userWarehouseRoleRepository.create({
      userId: userOne.userId,
      warehouseId: warehouseOne.warehouseId,
      role: WarehouseRole.ADMIN,
    }),
  );
  await userWarehouseRoleRepository.save(
    userWarehouseRoleRepository.create({
      userId: userTwo.userId,
      warehouseId: warehouseOne.warehouseId,
      role: WarehouseRole.MANAGER,
    }),
  );
  await userWarehouseRoleRepository.save(
    userWarehouseRoleRepository.create({
      userId: userThree.userId,
      warehouseId: warehouseOne.warehouseId,
      role: WarehouseRole.STAFF,
    }),
  );

  await userWarehouseRoleRepository.save(
    userWarehouseRoleRepository.create({
      userId: userOne.userId,
      warehouseId: warehouseTwo.warehouseId,
      role: WarehouseRole.ADMIN,
    }),
  );
  await userWarehouseRoleRepository.save(
    userWarehouseRoleRepository.create({
      userId: userTwo.userId,
      warehouseId: warehouseTwo.warehouseId,
      role: WarehouseRole.MANAGER,
    }),
  );

  await userOrgRoleRepository.save(
    userOrgRoleRepository.create({
      userId: userFour.userId,
      orgId: organizationTwo.orgId,
      role: OrganizationRole.MEMBER,
    }),
  );

  await userWarehouseRoleRepository.save(
    userWarehouseRoleRepository.create({
      userId: userFour.userId,
      warehouseId: warehouseThree.warehouseId,
      role: WarehouseRole.ADMIN,
    }),
  );
}
