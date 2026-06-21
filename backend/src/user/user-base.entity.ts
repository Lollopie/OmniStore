import { Column, JoinColumn, ManyToOne } from 'typeorm';
import { User } from './user.entity';

export abstract class UserBaseEntity {
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;
  @Column('uuid', { name: 'user_id' })
  userId: string;
}
