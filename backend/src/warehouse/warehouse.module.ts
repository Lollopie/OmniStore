import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WarehouseEntity } from './warehouse.entity';
import { WarehouseService } from './warehouse.service';
import { WarehouseController } from './warehouse.controller';
import { UserWarehouseRoleEntity } from '../userWarehouseRole/userWarehouseRole.entity';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UserWarehouseRoleModule } from '../userWarehouseRole/userWarehouseRole.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([WarehouseEntity]),
    TypeOrmModule.forFeature([UserWarehouseRoleEntity]),
    JwtModule.registerAsync({
      global: true,
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('auth.jwtSecret'), // 3. Dynamically fetch the secret
        signOptions: {
          expiresIn: configService.get<number>('auth.jwtExpiresIn'),
        },
      }),
    }),
    UserWarehouseRoleModule,
  ],
  providers: [WarehouseService],
  exports: [TypeOrmModule, WarehouseService],
  controllers: [WarehouseController],
})
export class WarehouseModule {}
