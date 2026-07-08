import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { AuthGuard } from '../auth/auth.guard.js';
import { InventoryDto } from './inventory.dto';
import * as userDecorator from '../user/user.decorator';
@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}
  @Get()
  @UseGuards(AuthGuard)
  getInventory(
    @userDecorator.User() userToken: userDecorator.UserToken,
    @Query('page') page: number,
    @Query('sort') sort: string,
  ) {
    if (!page) {
      page = 1;
    }
    if (!sort) {
      sort = 'new';
    }
    return this.inventoryService.getInventory(
      userToken.activeWarehouseId,
      page,
      sort,
    );
  }
  @Post()
  @UseGuards(AuthGuard)
  addInventory(
    @userDecorator.User() userToken: userDecorator.UserToken,
    @Body() item: InventoryDto,
  ) {
    return this.inventoryService.createItem(item, userToken.activeWarehouseId);
  }
}
