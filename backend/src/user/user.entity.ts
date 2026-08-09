import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';
@Entity('user')
export class UserEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'user_id' })
  userId: string;
  @Column()
  email: string;
  @Column()
  username: string;
  @Column()
  password: string;
}
