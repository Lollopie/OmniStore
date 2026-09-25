import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('contact')
export class ContactEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'f_name' })
  fName: string;

  @Column({ name: 'l_name' })
  lName: string;

  @Column()
  email: string;

  @Column()
  message: string;
}
