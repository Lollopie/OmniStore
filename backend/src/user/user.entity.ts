import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';
@Entity('user')
export class User {
  @PrimaryGeneratedColumn('uuid')
  user_id: string;
  @Column()
  username: string;
  @Column()
  password: string;
}
