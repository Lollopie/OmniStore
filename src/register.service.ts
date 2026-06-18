import { Injectable } from '@nestjs/common';
import { User } from "./user.entity";
import { UsersService } from "./users.service";

@Injectable()
export class RegisterService {
    constructor(private readonly usersService: UsersService) {}
    register(registerData: User) {
        this.usersService.findUserByUsername(registerData.username).then(user => {
            if (user) {
                throw new Error('Username already exists');
            }
            return this.usersService.createUser(registerData);
        });
    }
}