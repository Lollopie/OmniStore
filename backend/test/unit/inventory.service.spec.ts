import { Test, TestingModule } from '@nestjs/testing';
import { InventoryService } from '../../src/inventory/inventory.service';
import { InventoryEntity } from '../../src/inventory/inventory.entity';
import { TxRepoProvider } from '../../src/rls/txrepo.service';
import { ClsService } from 'nestjs-cls';
import { NotFoundException } from '@nestjs/common';

describe('InventoryService', () => {
  let service: InventoryService;
  const mockClsService = {
    get: jest.fn((key: string) => {
      if (key === 'warehouseId') {
        return 'warehouse-1';
      }
      throw new Error(`Unexpected key: ${key}`);
    }),
    set: jest.fn(),
  };
  const mockInventoryRepository = {
    findAndCount: jest.fn().mockResolvedValue([
      [
        {
          itemId: 'item-1',
          itemName: 'Item 1',
          amount: 10,
        },
      ],
      1,
    ]),
    create: jest.fn().mockReturnValue({
      itemId: 'item-1',
      itemName: 'Item 1',
      amount: 100,
      warehouse: { warehouseId: 'warehouse-1' },
    }),
    save: jest.fn().mockResolvedValue({
      itemId: 'item-1',
      itemName: 'Item 1',
      amount: 100,
      warehouse: { warehouseId: 'warehouse-1' },
    }),
    findOne: jest.fn().mockResolvedValue({
      itemId: 'item-1',
      itemName: 'Item 1',
      amount: 100,
      warehouse: { warehouseId: 'warehouse-1' },
    }),
    merge: jest.fn().mockReturnValue({
      itemId: 'item-1',
      itemName: 'Updated Item 1',
      amount: 200,
      warehouse: { warehouseId: 'warehouse-1' },
    }),
    delete: jest.fn().mockResolvedValue({ affected: 1 }),
  };
  const mockTxRepoProvider = {
    getRepo: jest.fn((entity) => {
      if (entity === InventoryEntity) {
        return mockInventoryRepository;
      }
      throw new Error('Unexpected entity type');
    }),
  };
  beforeEach(async () => {
    jest.clearAllMocks();
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
    }).compile();
    service = module.get<InventoryService>(InventoryService);
  });
  it('should be defined', () => {
    expect(service).toBeDefined();
  });
  describe('getInventory', () => {
    it('should have sorting by old', async () => {
      await service.getInventory('', 1, 'old');
      expect(mockInventoryRepository.findAndCount).toHaveBeenLastCalledWith(
        expect.objectContaining({
          order: { itemId: 'ASC' },
        }),
      );
    });
    it('should have sorting by new', async () => {
      await service.getInventory('', 1, 'new');
      expect(mockInventoryRepository.findAndCount).toHaveBeenLastCalledWith(
        expect.objectContaining({
          order: { itemId: 'DESC' },
        }),
      );
    });
    it('should have sorting by amount asc with name tiebreaker', async () => {
      await service.getInventory('', 1, 'amount asc');
      expect(mockInventoryRepository.findAndCount).toHaveBeenLastCalledWith(
        expect.objectContaining({
          order: { amount: 'ASC', itemName: 'ASC' },
        }),
      );
    });
    it('should have sorting by amount desc with name tiebreaker', async () => {
      await service.getInventory('', 1, 'amount desc');
      expect(mockInventoryRepository.findAndCount).toHaveBeenLastCalledWith(
        expect.objectContaining({
          order: { amount: 'DESC', itemName: 'ASC' },
        }),
      );
    });
    it('should have sorting by item name asc with age tiebreaker', async () => {
      await service.getInventory('', 1, 'itemName asc');
      expect(mockInventoryRepository.findAndCount).toHaveBeenLastCalledWith(
        expect.objectContaining({
          order: { itemName: 'ASC', itemId: 'DESC' },
        }),
      );
    });
    it('should have sorting by item name desc with age tiebreaker', async () => {
      await service.getInventory('', 1, 'itemName desc');
      expect(mockInventoryRepository.findAndCount).toHaveBeenLastCalledWith(
        expect.objectContaining({
          order: { itemName: 'DESC', itemId: 'DESC' },
        }),
      );
    });
    it('should do expected pagination page 1', async () => {
      await service.getInventory('', 1, 'old');
      expect(mockInventoryRepository.findAndCount).toHaveBeenLastCalledWith(
        expect.objectContaining({
          order: { itemId: 'ASC' },
        }),
      );
    });
    it('should do expected pagination page 2', async () => {
      await service.getInventory('', 2, 'old');
      expect(mockInventoryRepository.findAndCount).toHaveBeenLastCalledWith(
        expect.objectContaining({
          order: { itemId: 'ASC' },
        }),
      );
    });
    it('should filter by name', async () => {
      await service.getInventory('name', 1, 'old');
      expect(mockInventoryRepository.findAndCount).toHaveBeenLastCalledWith(
        expect.objectContaining({
          where: {
            warehouseId: 'warehouse-1',

            itemName: expect.objectContaining({
              _type: 'ilike',
              _value: '%name%',
            }),
          },
        }),
      );
    });
    it('should filter by trimmed name', async () => {
      await service.getInventory('       name       ', 1, 'old');
      expect(mockInventoryRepository.findAndCount).toHaveBeenLastCalledWith(
        expect.objectContaining({
          where: {
            warehouseId: 'warehouse-1',

            itemName: expect.objectContaining({
              _type: 'ilike',
              _value: '%name%',
            }),
          },
        }),
      );
    });
    it('should return query results', async () => {
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
      await service.createItem({
        itemName: 'Item 1',
        amount: '100',
      });
      expect(mockInventoryRepository.create).toHaveBeenCalledWith({
        itemName: 'Item 1',
        amount: 100,
        warehouse: { warehouseId: 'warehouse-1' },
      });
      expect(mockInventoryRepository.save).toHaveBeenCalledWith({
        itemId: 'item-1',
        itemName: 'Item 1',
        amount: 100,
        warehouse: { warehouseId: 'warehouse-1' },
      });
    });
    it('should return the saved item', async () => {
      const result = await service.createItem({
        itemName: 'Item 1',
        amount: '100',
      });
      expect(result).toEqual({
        itemId: 'item-1',
        itemName: 'Item 1',
        amount: 100,
        warehouse: { warehouseId: 'warehouse-1' },
      });
    });
  });
  describe('updateItem', () => {
    it('should throw an error if the item is not found', async () => {
      mockInventoryRepository.findOne.mockResolvedValueOnce(null);
      await expect(
        service.updateItem({ itemName: 'item-1', amount: '200' }),
      ).rejects.toThrow(new NotFoundException('Item not found'));
    });
    it('should update the item', async () => {
      await service.updateItem({
        itemId: 'item-1',
        itemName: 'Updated Item 1',
        amount: '200',
      });
      expect(mockInventoryRepository.save).toHaveBeenCalledWith({
        itemId: 'item-1',
        itemName: 'Updated Item 1',
        amount: 200,
        warehouse: { warehouseId: 'warehouse-1' },
      });
      expect(mockInventoryRepository.merge).toHaveBeenCalledWith(
        {
          itemId: 'item-1',
          itemName: 'Item 1',
          amount: 100,
          warehouse: { warehouseId: 'warehouse-1' },
        },
        {
          itemName: 'Updated Item 1',
          amount: 200,
          warehouse: { warehouseId: 'warehouse-1' },
        },
      );
    });
    it('should return the updated item', async () => {
      mockInventoryRepository.save.mockResolvedValueOnce({
        itemId: 'item-1',
        itemName: 'Updated Item 1',
        amount: 200,
        warehouse: { warehouseId: 'warehouse-1' },
      });
      const result = await service.updateItem({
        itemId: 'item-1',
        itemName: 'Updated Item 1',
        amount: '200',
      });
      expect(result).toEqual({
        itemId: 'item-1',
        itemName: 'Updated Item 1',
        amount: 200,
        warehouse: { warehouseId: 'warehouse-1' },
      });
    });
  });
  describe('deleteItem', () => {
    it('should throw an error if the item is not found', async () => {
      mockInventoryRepository.findOne.mockResolvedValueOnce(null);
      await expect(
        service.deleteItem({ itemId: 'item-1', itemName: 'item', amount: '1' }),
      ).rejects.toThrow(new NotFoundException('Item not found'));
    });
    it('should delete the item if it exists', async () => {
      await service.deleteItem({
        itemId: 'item-1',
        itemName: 'item',
        amount: '1',
      });
      expect(mockInventoryRepository.delete).toHaveBeenCalledWith({
        itemId: 'item-1',
        warehouseId: 'warehouse-1',
      });
    });
    it('should return the delete result', async () => {
      const result = await service.deleteItem({
        itemId: 'item-1',
        itemName: 'item',
        amount: '1',
      });
      expect(result).toEqual({ affected: 1 });
    });
  });
});
