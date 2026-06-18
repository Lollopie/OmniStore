import { Module } from '@nestjs/common';
import { RegisterController} from "./register.controller";
import { RegisterService } from "./register.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { User } from "./user.entity";
import { UsersModule } from "./users.module";
@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'postgres',
      password: '2Qk#@tDg5FNRCsGta',
      database: 'postgres',
      entities: [User],
      synchronize: true,
    }),
      UsersModule
  ],
  controllers: [RegisterController],
  providers: [RegisterService],
})
export class AppModule {}
