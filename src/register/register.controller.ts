import { Body, Controller, Get, Post, Render } from '@nestjs/common';
import { RegisterService } from './register.service';
import { RegisterDto } from './register.dto';

@Controller('register')
export class RegisterController {
  constructor(private readonly registerService: RegisterService) {}
  @Get()
  @Render('register')
  getRegisterPage() {
    return {};
  }
  @Post()
  async register(@Body() user: RegisterDto) {
    return await this.registerService.register(user);
  }
}
