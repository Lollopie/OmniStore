import { Body, Controller, Post } from '@nestjs/common';
import { OrganizationDto } from '@shared/dto/organization.dto';
import { OrganizationService } from './organization.service';

@Controller('organizations')
export class OrganizationController {
  constructor(private readonly organizationService: OrganizationService) {}
  @Post('/register')
  async register(@Body() data: OrganizationDto) {
    return await this.organizationService.createOrganization(data);
    //TODO: Send E-Mail Authentication
  }
}
