import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { AuthGuard } from '../auth/auth.guard.js';
import { InventoryDto } from './inventory.dto';
import { RolesGuard } from '../roles/roles.guard';
import { Roles } from '../roles/roles.decorator';
import { Role } from '../roles/roles.enum';
import { DeleteResult } from 'typeorm';
@Controller('inventory')
@UseGuards(AuthGuard, RolesGuard)
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}
  @Get()
  @Roles(Role.ADMIN, Role.MANAGER, Role.STAFF)
  getInventory(
    @Query('search') searchTerm: string,
    @Query('page') page: number,
    @Query('sort') sort: string,
  ) {
    if (!page) {
      page = 1;
    }
    if (!sort) {
      sort = 'new';
    }
    return this.inventoryService.getInventory(searchTerm, page, sort);
  }
  @Post()
  @Roles(Role.ADMIN, Role.MANAGER)
  addItem(@Body() item: InventoryDto) {
    return this.inventoryService.createItem(item);
  }
  @Patch()
  @Roles(Role.ADMIN, Role.MANAGER)
  updateItem(@Body() item: InventoryDto) {
    if (!item.id) {
      throw new BadRequestException('Item ID is required');
    }
    return this.inventoryService.updateItem(item);
  }
  @Delete()
  @Roles(Role.ADMIN, Role.MANAGER)
  async deleteItem(@Body() item: InventoryDto) {
    if (!item.id) {
      throw new BadRequestException('Item ID is required');
    }
    const result: DeleteResult = await this.inventoryService.remove(item);
    if (!result.affected) {
      throw new BadRequestException('Item not found');
    }
    return { message: 'Item has been deleted.' };
  }
}
