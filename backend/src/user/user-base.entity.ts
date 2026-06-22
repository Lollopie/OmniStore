import { Column, JoinColumn, ManyToOne } from 'typeorm';
import { UserEntity } from './user.entity';

export abstract class UserBaseEntity {
  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;
  @Column('uuid', { name: 'user_id' })
  user_id: string;
}
