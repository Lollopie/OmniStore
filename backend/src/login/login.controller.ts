import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { LoginService } from './login.service';
import { RegisterDto } from '../register/register.dto';

@Controller('login')
export class LoginController {
  constructor(private readonly loginService: LoginService) {}
  @Post()
  @HttpCode(HttpStatus.OK)
  async register(@Body() user: RegisterDto) {
    const response = await this.loginService.login(user);
    if (response) {
      return response;
    }
    return { error: 'Login failed' };
  }
}
