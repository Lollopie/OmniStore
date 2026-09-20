import { DataSource } from 'typeorm';
import { WarehouseEntity } from '../../src/warehouse/warehouse.entity';
import { OrganizationEntity } from '../../src/organization/organization.entity';

export async function seedWarehouses(datasource: DataSource): Promise<void> {
  const warehouseRepository = datasource.getRepository(WarehouseEntity);
  const organizationRepository = datasource.getRepository(OrganizationEntity);

  const organizationOne = await organizationRepository.findOneOrFail({
    where: { name: 'Organization 1' },
  });
  const organizationTwo = await organizationRepository.findOneOrFail({
    where: { name: 'Organization 2' },
  });

  await warehouseRepository.save(
    warehouseRepository.create({
      orgId: organizationOne.orgId,
      name: 'Warehouse 1',
    }),
  );

  await warehouseRepository.save(
    warehouseRepository.create({
      orgId: organizationOne.orgId,
      name: 'Warehouse 2',
    }),
  );

  await warehouseRepository.save(
    warehouseRepository.create({
      orgId: organizationTwo.orgId,
      name: 'Warehouse 3',
    }),
  );
}
