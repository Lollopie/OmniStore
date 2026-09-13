import { Test, TestingModule } from '@nestjs/testing';
import {
  InventoryService,
  InventorySortOption,
} from '../../src/inventory/inventory.service';
import { InventoryController } from '../../src/inventory/inventory.controller';
import { BadRequestException, CanActivate } from '@nestjs/common';
import { WarehouseRolesGuard } from '../../src/roles/warehouseRoles/warehouseRoles.guard';
import { AuthGuard } from '../../src/auth/auth.guard';

describe('InventoryController', () => {
  const mockInventoryService = {
    getInventory: jest
      .fn()
      .mockResolvedValue([[{ itemId: 1, itemName: 'Item 1', amount: 10 }], 1]),
    createItem: jest.fn().mockResolvedValue({
      itemId: 1,
      itemName: 'Item 1',
      amount: 10,
    }),
    updateItem: jest.fn().mockResolvedValue({
      itemId: 'item-1',
      itemName: 'Item 1',
      amount: 10,
    }),
    deleteItem: jest.fn().mockResolvedValue({ affected: 1 }),
  };
  class MockGuard implements CanActivate {
    canActivate(): boolean {
      return true;
    }
  }
  let service: InventoryController;
  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InventoryController,
        {
          provide: InventoryService,
          useValue: mockInventoryService,
        },
      ],
    })
      .overrideGuard(AuthGuard)
      .useClass(MockGuard)
      .overrideGuard(WarehouseRolesGuard)
      .useClass(MockGuard)
      .compile();
    service = module.get<InventoryController>(InventoryController);
  });
  it('should be defined', () => {
    expect(service).toBeDefined();
  });
  describe('getInventory', () => {
    it('should call InventoryService.getInventory with default parameters', async () => {
      await service.getInventory(null, null, null);
      expect(mockInventoryService.getInventory).toHaveBeenLastCalledWith(
        '',
        1,
        InventorySortOption.NEW,
      );
    });
    it('should call InventoryService.getInventory with provided parameters', async () => {
      await service.getInventory('searchTerm', 2, InventorySortOption.NAME_ASC);
      expect(mockInventoryService.getInventory).toHaveBeenLastCalledWith(
        'searchTerm',
        2,
        InventorySortOption.NAME_ASC,
      );
    });
    it('should return the result of InventoryService.getInventory', async () => {
      const result = await service.getInventory(
        'searchTerm',
        2,
        InventorySortOption.NAME_ASC,
      );
      expect(result).toEqual([
        [{ itemId: 1, itemName: 'Item 1', amount: 10 }],
        1,
      ]);
    });
  });
  describe('addItem', () => {
    it('should call InventoryService.createItem with the correct parameters', async () => {
      await service.addItem({ itemName: 'Item 1', amount: 10 });
      expect(mockInventoryService.createItem).toHaveBeenLastCalledWith({
        itemName: 'Item 1',
        amount: 10,
      });
    });
    it('should return created item', async () => {
      const result = await service.addItem({ itemName: 'Item 1', amount: 10 });
      expect(result).toEqual({ itemId: 1, itemName: 'Item 1', amount: 10 });
    });
  });
  describe('updateItem', () => {
    it('should throw an error if itemId is not provided', async () => {
      await expect(
        service.updateItem({ itemName: 'Item 1', amount: 10 }),
      ).rejects.toThrow(new BadRequestException('Item ID is required'));
    });
    it('should call InventoryService.updateItem with the correct parameters', async () => {
      await service.updateItem({
        itemId: 'item-1',
        itemName: 'Item 1',
        amount: 10,
      });
      expect(mockInventoryService.updateItem).toHaveBeenLastCalledWith({
        itemId: 'item-1',
        itemName: 'Item 1',
        amount: 10,
      });
    });
    it('should return updated item', async () => {
      const result = await service.updateItem({
        itemId: 'item-1',
        itemName: 'Item 1',
        amount: 10,
      });
      expect(result).toEqual({
        itemId: 'item-1',
        itemName: 'Item 1',
        amount: 10,
      });
    });
  });
  describe('deleteItem', () => {
    it('should throw an error if itemId is not provided', async () => {
      await expect(
        service.deleteItem({ itemName: 'Item 1', amount: 10 }),
      ).rejects.toThrow(new BadRequestException('Item ID is required'));
    });
    it('should call InventoryService.deleteItem with the correct parameters', async () => {
      await service.deleteItem({
        itemId: 'item-1',
        itemName: 'Item 1',
        amount: 10,
      });
      expect(mockInventoryService.deleteItem).toHaveBeenLastCalledWith({
        itemId: 'item-1',
        itemName: 'Item 1',
        amount: 10,
      });
    });
    it('should throw an error if the item is not found', async () => {
      mockInventoryService.deleteItem.mockResolvedValueOnce({ affected: null });
      await expect(
        service.deleteItem({
          itemId: 'item-1',
          itemName: 'Item 1',
          amount: 10,
        }),
      ).rejects.toThrow(new BadRequestException('Item not found'));
    });
    it('should return a success message', async () => {
      const result = await service.deleteItem({
        itemId: 'item-1',
        itemName: 'Item 1',
        amount: 10,
      });
      expect(result).toEqual({ message: 'Item has been deleted.' });
    });
  });
});
