import { Column, JoinColumn, ManyToOne } from 'typeorm';
import { UserEntity } from './user.entity';

export abstract class UserBaseEntity {
  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: UserEntity;
  @Column('uuid', { name: 'userId' })
  userId: string;
}
