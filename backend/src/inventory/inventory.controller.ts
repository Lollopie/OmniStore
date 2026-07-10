import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { AuthGuard } from '../auth/auth.guard.js';
import { InventoryDto } from './inventory.dto';
import * as userDecorator from '../user/user.decorator';
import { RolesGuard } from '../roles/roles.guard';
import { Roles } from '../roles/roles.decorator';
import { Role } from '../roles/roles.enum';
@Controller('inventory')
@UseGuards(AuthGuard, RolesGuard)
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}
  @Get()
  @Roles(Role.ADMIN, Role.MANAGER, Role.STAFF)
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
    return this.inventoryService.getInventory(page, sort);
  }
  @Post()
  @Roles(Role.ADMIN, Role.MANAGER)
  addInventory(
    @userDecorator.User() userToken: userDecorator.UserToken,
    @Body() item: InventoryDto,
  ) {
    return this.inventoryService.createItem(item);
  }
}
