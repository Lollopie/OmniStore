import { Body, Controller, Post } from '@nestjs/common';
import { RegisterService } from './register.service';
import { RegisterDto } from './register.dto';

@Controller('register')
export class RegisterController {
  constructor(private readonly registerService: RegisterService) {}
  @Post()
  async register(@Body() user: RegisterDto) {
    const response = await this.registerService.register(user);
    if (response) {
      return { success: true };
    }
    return { error: 'Register failed' };
  }
}
