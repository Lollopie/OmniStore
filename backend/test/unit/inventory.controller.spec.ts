import { Test, TestingModule } from '@nestjs/testing';
import {
  InventoryService,
  InventorySortOption,
} from '../../src/inventory/inventory.service';
import { InventoryController } from '../../src/inventory/inventory.controller';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClsModule } from 'nestjs-cls';
import { BadRequestException, CanActivate } from '@nestjs/common';
import { WarehouseRolesGuard } from '../../src/roles/warehouseRoles/warehouseRoles.guard';

describe('InventoryController', () => {
  const mockInventoryService = {
    getInventory: jest.fn(),
    createItem: jest.fn(),
    updateItem: jest.fn(),
    deleteItem: jest.fn(),
  };
  class MockWarehouseRolesGuard implements CanActivate {
    canActivate(): boolean {
      return true;
    }
  }
  let service: InventoryController;
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InventoryController,
        {
          provide: InventoryService,
          useValue: mockInventoryService,
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
        ClsModule.forRoot({
          global: true,
          middleware: { mount: true },
        }),
      ],
    })
      .overrideGuard(WarehouseRolesGuard)
      .useClass(MockWarehouseRolesGuard)
      .compile();
    service = module.get<InventoryController>(InventoryController);
  });
  it('should be defined', () => {
    expect(service).toBeDefined();
  });
  describe('getInventory', () => {
    it('should call InventoryService.getInventory with default parameters', async () => {
      mockInventoryService.getInventory.mockReturnValue([]);
      await service.getInventory(null, null, null);
      expect(mockInventoryService.getInventory).toHaveBeenLastCalledWith(
        '',
        1,
        InventorySortOption.NEW,
      );
    });
    it('should call InventoryService.getInventory with provided parameters', async () => {
      mockInventoryService.getInventory.mockReturnValue([]);
      await service.getInventory('searchTerm', 2, InventorySortOption.NAME_ASC);
      expect(mockInventoryService.getInventory).toHaveBeenLastCalledWith(
        'searchTerm',
        2,
        InventorySortOption.NAME_ASC,
      );
    });
    it('should return the result of InventoryService.getInventory', async () => {
      mockInventoryService.getInventory.mockReturnValue([
        [{ itemId: 1, itemName: 'Item 1', amount: 10 }],
        1,
      ]);
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
      mockInventoryService.createItem.mockReturnValue(undefined);
      await service.addItem({ itemName: 'Item 1', amount: 10 });
      expect(mockInventoryService.createItem).toHaveBeenLastCalledWith({
        itemName: 'Item 1',
        amount: 10,
      });
    });
    it('should return created item', async () => {
      mockInventoryService.createItem.mockReturnValue({
        itemId: 1,
        itemName: 'Item 1',
        amount: 10,
      });
      const result = await service.addItem({ itemName: 'Item 1', amount: 10 });
      expect(result).toEqual({ itemId: 1, itemName: 'Item 1', amount: 10 });
    });
  });
  describe('updateItem', () => {
    it('should throw an error if itemId is not provided', () => {
      expect(() => {
        service.updateItem({ itemName: 'Item 1', amount: 10 } as any);
      }).toThrow(BadRequestException);
    });
    it('should call InventoryService.updateItem with the correct parameters', async () => {
      mockInventoryService.updateItem.mockReturnValue(undefined);
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
      mockInventoryService.updateItem.mockReturnValue({
        itemId: 'item-1',
        itemName: 'Item 1',
        amount: 10,
      });
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
      ).rejects.toThrow('Item ID is required');
    });
    it('should call InventoryService.deleteItem with the correct parameters', async () => {
      mockInventoryService.deleteItem.mockReturnValue({ affected: 1 });
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
      mockInventoryService.deleteItem.mockReturnValue({ affected: null });
      await expect(
        service.deleteItem({
          itemId: 'item-1',
          itemName: 'Item 1',
          amount: 10,
        }),
      ).rejects.toThrow('Item not found');
    });
    it('should return a success message', async () => {
      mockInventoryService.deleteItem.mockReturnValue({ affected: 1 });
      const result = await service.deleteItem({
        itemId: 'item-1',
        itemName: 'Item 1',
        amount: 10,
      });
      expect(result).toEqual({ message: 'Item has been deleted.' });
    });
  });
});
