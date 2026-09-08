import { Test, TestingModule } from '@nestjs/testing';
import { InventoryService } from '../../src/inventory/inventory.service';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { InventoryEntity } from '../../src/inventory/inventory.entity';
import { TxRepoProvider } from '../../src/rls/db.helper';
import { ClsService } from 'nestjs-cls';

describe('InventoryService', () => {
  let service: InventoryService;
  const mockClsService = {
    get: jest.fn(),
    set: jest.fn(),
  };
  const mockInventoryRepository = {
    findAndCount: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    merge: jest.fn(),
    delete: jest.fn(),
  };
  const mockTxRepoProvider = {
    getRepo: jest.fn().mockImplementation((entity) => {
      if (entity === InventoryEntity) {
        return mockInventoryRepository;
      }
      throw new Error('Unexpected entity type');
    }),
  };
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InventoryService,
        {
          provide: ClsService,
          useValue: mockClsService,
        },
        {
          provide: TxRepoProvider,
          useValue: mockTxRepoProvider,
        },
      ],
      imports: [
        JwtModule.registerAsync({
          global: true,
          imports: [ConfigModule],
          inject: [ConfigService],
          useFactory: (configService: ConfigService) => ({
            secret: configService.get<string>('auth.jwtSecret'),
            signOptions: { expiresIn: '1h' },
          }),
        }),
      ],
    }).compile();
    service = module.get<InventoryService>(InventoryService);
  });
  it('should be defined', () => {
    expect(service).toBeDefined();
  });
  describe('getInventory', () => {
    it('should have sorting by old', async () => {
      mockInventoryRepository.findAndCount.mockResolvedValue([[], 0]);
      mockClsService.get.mockReturnValue('warehouse-1');
      const result = await service.getInventory('', 1, 'old');
      expect(result).toEqual([[], 0]);
      expect(mockInventoryRepository.findAndCount).toHaveBeenLastCalledWith({
        where: { warehouseId: 'warehouse-1' },
        order: { itemId: 'ASC' },
        select: {
          amount: true,
          itemId: true,
          itemName: true,
        },
        skip: 0,
        take: 10,
      });
    });
    it('should have sorting by new', async () => {
      mockInventoryRepository.findAndCount.mockResolvedValue([[], 0]);
      mockClsService.get.mockReturnValue('warehouse-1');
      const result = await service.getInventory('', 1, 'new');
      expect(result).toEqual([[], 0]);
      expect(mockInventoryRepository.findAndCount).toHaveBeenLastCalledWith({
        where: { warehouseId: 'warehouse-1' },
        order: { itemId: 'DESC' },
        select: {
          amount: true,
          itemId: true,
          itemName: true,
        },
        skip: 0,
        take: 10,
      });
    });
    it('should have sorting by amount asc with name tiebreaker', async () => {
      mockInventoryRepository.findAndCount.mockResolvedValue([[], 0]);
      mockClsService.get.mockReturnValue('warehouse-1');
      const result = await service.getInventory('', 1, 'amount asc');
      expect(result).toEqual([[], 0]);
      expect(mockInventoryRepository.findAndCount).toHaveBeenLastCalledWith({
        where: { warehouseId: 'warehouse-1' },
        order: { amount: 'ASC', itemName: 'ASC' },
        select: {
          amount: true,
          itemId: true,
          itemName: true,
        },
        skip: 0,
        take: 10,
      });
    });
    it('should have sorting by amount desc with name tiebreaker', async () => {
      mockInventoryRepository.findAndCount.mockResolvedValue([[], 0]);
      mockClsService.get.mockReturnValue('warehouse-1');
      const result = await service.getInventory('', 1, 'amount desc');
      expect(result).toEqual([[], 0]);
      expect(mockInventoryRepository.findAndCount).toHaveBeenLastCalledWith({
        where: { warehouseId: 'warehouse-1' },
        order: { amount: 'DESC', itemName: 'ASC' },
        select: {
          amount: true,
          itemId: true,
          itemName: true,
        },
        skip: 0,
        take: 10,
      });
    });
    it('should have sorting by item name asc with age tiebreaker', async () => {
      mockInventoryRepository.findAndCount.mockResolvedValue([[], 0]);
      mockClsService.get.mockReturnValue('warehouse-1');
      const result = await service.getInventory('', 1, 'itemName asc');
      expect(result).toEqual([[], 0]);
      expect(mockInventoryRepository.findAndCount).toHaveBeenLastCalledWith({
        where: { warehouseId: 'warehouse-1' },
        order: { itemName: 'ASC', itemId: 'DESC' },
        select: {
          amount: true,
          itemId: true,
          itemName: true,
        },
        skip: 0,
        take: 10,
      });
    });
    it('should have sorting by item name desc with age tiebreaker', async () => {
      mockInventoryRepository.findAndCount.mockResolvedValue([[], 0]);
      mockClsService.get.mockReturnValue('warehouse-1');
      const result = await service.getInventory('', 1, 'itemName desc');
      expect(result).toEqual([[], 0]);
      expect(mockInventoryRepository.findAndCount).toHaveBeenLastCalledWith({
        where: { warehouseId: 'warehouse-1' },
        order: { itemName: 'DESC', itemId: 'DESC' },
        select: {
          amount: true,
          itemId: true,
          itemName: true,
        },
        skip: 0,
        take: 10,
      });
    });
    it('should do expected pagination page 1', async () => {
      mockInventoryRepository.findAndCount.mockResolvedValue([[], 0]);
      mockClsService.get.mockReturnValue('warehouse-1');
      const result = await service.getInventory('', 1, 'old');
      expect(result).toEqual([[], 0]);
      expect(mockInventoryRepository.findAndCount).toHaveBeenLastCalledWith({
        where: { warehouseId: 'warehouse-1' },
        order: { itemId: 'ASC' },
        select: {
          amount: true,
          itemId: true,
          itemName: true,
        },
        skip: 0,
        take: 10,
      });
    });
    it('should do expected pagination page 2', async () => {
      mockInventoryRepository.findAndCount.mockResolvedValue([[], 0]);
      mockClsService.get.mockReturnValue('warehouse-1');
      const result = await service.getInventory('', 2, 'old');
      expect(result).toEqual([[], 0]);
      expect(mockInventoryRepository.findAndCount).toHaveBeenLastCalledWith({
        where: { warehouseId: 'warehouse-1' },
        order: { itemId: 'ASC' },
        select: {
          amount: true,
          itemId: true,
          itemName: true,
        },
        skip: 10,
        take: 10,
      });
    });
    it('should filter by name', async () => {
      mockInventoryRepository.findAndCount.mockResolvedValue([[], 0]);
      mockClsService.get.mockReturnValue('warehouse-1');
      const result = await service.getInventory('name', 1, 'old');
      expect(result).toEqual([[], 0]);
      expect(mockInventoryRepository.findAndCount).toHaveBeenLastCalledWith({
        where: {
          warehouseId: 'warehouse-1',
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          itemName: expect.objectContaining({
            _type: 'ilike',
            _value: '%name%',
          }),
        },
        order: { itemId: 'ASC' },
        select: {
          amount: true,
          itemId: true,
          itemName: true,
        },
        skip: 0,
        take: 10,
      });
    });
    it('should filter by trimmed name', async () => {
      mockInventoryRepository.findAndCount.mockResolvedValue([[], 0]);
      mockClsService.get.mockReturnValue('warehouse-1');
      const result = await service.getInventory('       name       ', 1, 'old');
      expect(result).toEqual([[], 0]);
      expect(mockInventoryRepository.findAndCount).toHaveBeenLastCalledWith({
        where: {
          warehouseId: 'warehouse-1',
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          itemName: expect.objectContaining({
            _type: 'ilike',
            _value: '%name%',
          }),
        },
        order: { itemId: 'ASC' },
        select: {
          amount: true,
          itemId: true,
          itemName: true,
        },
        skip: 0,
        take: 10,
      });
    });
    it('should return query results', async () => {
      mockInventoryRepository.findAndCount.mockResolvedValue([
        [
          {
            itemId: 'item-1',
            itemName: 'Item 1',
            amount: 10,
          },
        ],
        1,
      ]);
      mockClsService.get.mockReturnValue('warehouse-1');
      const result = await service.getInventory('name', 1, 'old');
      expect(result).toEqual([
        [
          {
            itemId: 'item-1',
            itemName: 'Item 1',
            amount: 10,
          },
        ],
        1,
      ]);
    });
  });
  describe('createItem', () => {
    it('should parse amount to integer and save item', async () => {
      mockClsService.get.mockReturnValue('warehouse-1');
      const mockItem = {
        itemName: 'Item 1',
        amount: '100',
      };
      const mockSavedItem = {
        itemId: 'item-1',
        itemName: 'Item 1',
        amount: 100,
        warehouse: { warehouseId: 'warehouse-1' },
      };
      mockInventoryRepository.create.mockReturnValue(mockSavedItem);
      mockInventoryRepository.save.mockResolvedValue(mockSavedItem);

      const result = await service.createItem(mockItem);

      expect(result).toEqual(mockSavedItem);
      expect(mockInventoryRepository.create).toHaveBeenCalledWith({
        itemName: 'Item 1',
        amount: 100,
        warehouse: { warehouseId: 'warehouse-1' },
      });
      expect(mockInventoryRepository.save).toHaveBeenCalledWith(mockSavedItem);
    });
  });
  describe('updateItem', () => {
    it('should throw an error if the item is not found', async () => {
      mockClsService.get.mockReturnValue('warehouse-1');
      mockInventoryRepository.findOne.mockResolvedValue(null);
      await expect(
        service.updateItem({ itemName: 'item-1', amount: 200 }),
      ).rejects.toThrow('Item not found');
    });
    it('should update the item if it exists', async () => {
      mockClsService.get.mockReturnValue('warehouse-1');
      const existingItem = {
        itemId: 'item-1',
        itemName: 'Item 1',
        amount: 100,
        warehouse: { warehouseId: 'warehouse-1' },
      };
      mockInventoryRepository.findOne.mockResolvedValue(existingItem);
      const updatedItem = {
        itemId: 'item-1',
        itemName: 'Updated Item 1',
        amount: 200,
        warehouse: { warehouseId: 'warehouse-1' },
      };
      mockInventoryRepository.save.mockResolvedValue(updatedItem);
      mockInventoryRepository.merge.mockReturnValue(updatedItem);

      const result = await service.updateItem({
        itemId: 'item-1',
        itemName: 'Updated Item 1',
        amount: '200',
      });

      expect(result).toEqual(updatedItem);
      expect(mockInventoryRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          itemId: 'item-1',
          itemName: 'Updated Item 1',
          amount: 200,
          warehouse: { warehouseId: 'warehouse-1' },
        }),
      );
      expect(mockInventoryRepository.merge).toHaveBeenCalledWith(
        existingItem,
        expect.objectContaining({
          itemName: 'Updated Item 1',
          amount: 200,
          warehouse: { warehouseId: 'warehouse-1' },
        }),
      );
    });
  });
  describe('deleteItem', () => {
    it('should throw an error if the item is not found', async () => {
      mockClsService.get.mockReturnValue('warehouse-1');
      mockInventoryRepository.findOne.mockResolvedValue(null);
      await expect(service.deleteItem({ itemId: 'item-1' })).rejects.toThrow(
        'Item not found',
      );
    });
    it('should delete the item if it exists', async () => {
      mockClsService.get.mockReturnValue('warehouse-1');
      const existingItem = {
        itemId: 'item-1',
        itemName: 'Item 1',
        amount: 100,
        warehouse: { warehouseId: 'warehouse-1' },
      };
      mockInventoryRepository.findOne.mockResolvedValue(existingItem);
      mockInventoryRepository.delete.mockResolvedValue({ affected: 1 });

      const result = await service.deleteItem({ itemId: 'item-1' });

      expect(result).toEqual({ affected: 1 });
      expect(mockInventoryRepository.delete).toHaveBeenCalledWith({
        itemId: 'item-1',
        warehouseId: 'warehouse-1',
      });
    });
  });
});
