import { Body, Controller, Get, Post, Render } from '@nestjs/common';
import { RegisterService } from './register.service';

@Controller('register')
export class RegisterController {
  constructor(private readonly registerService: RegisterService) {}
  @Get()
  @Render('register')
  getRegisterPage() {
    return {};
  }
  @Post()
  async register(@Body() user: { username: string; password: string }) {
    return await this.registerService.register(user);
  }
}
