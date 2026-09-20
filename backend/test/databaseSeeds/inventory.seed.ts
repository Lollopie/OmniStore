import { DataSource } from 'typeorm';
import { InventoryEntity } from '../../src/inventory/inventory.entity';
import { WarehouseEntity } from '../../src/warehouse/warehouse.entity';

export async function seedInventories(dataSource: DataSource): Promise<void> {
  const inventoryRepository = dataSource.getRepository(InventoryEntity);
  const warehouseRepository = dataSource.getRepository(WarehouseEntity);
  const warehouseOne = await warehouseRepository.findOneOrFail({
    where: { name: 'Warehouse 1' },
  });
  const warehouseTwo = await warehouseRepository.findOneOrFail({
    where: { name: 'Warehouse 2' },
  });
  const warehouseThree = await warehouseRepository.findOneOrFail({
    where: { name: 'Warehouse 3' },
  });

  await inventoryRepository.save(
    inventoryRepository.create({
      itemName: 'Apple',
      amount: 1,
      warehouseId: warehouseOne.warehouseId,
    }),
  );
  await inventoryRepository.save(
    inventoryRepository.create({
      itemName: 'Banana',
      amount: 2,
      warehouseId: warehouseTwo.warehouseId,
    }),
  );
  await inventoryRepository.save(
    inventoryRepository.create({
      itemName: 'Cucumber',
      amount: 3,
      warehouseId: warehouseThree.warehouseId,
    }),
  );
}
