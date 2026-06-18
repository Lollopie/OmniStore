import {Body, Controller, Get, Post, Render} from '@nestjs/common';
import {RegisterService} from "./register.service";
import {User} from "./user.entity";

@Controller('register')
export class RegisterController {
    constructor(private readonly registerService: RegisterService) {}
    @Get()
    @Render('register')
    getRegisterPage() {
        return {};
    }
    @Post()
    register(@Body() user: User) {
        return this.registerService.register(user);
    }

}
