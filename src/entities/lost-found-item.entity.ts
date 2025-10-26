import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';
import { Estate } from './estate.entity';

export enum ItemType {
  LOST = 'Lost',
  FOUND = 'Found',
}

@Entity('lost_found_items')
export class LostFoundItem {
  @PrimaryGeneratedColumn('uuid')
  lostfound_id: string;

  @Column()
  sender_user_id: string;

  @Column()
  estate_id: string;

  @Column()
  description: string;

  @Column({
    type: 'enum',
    enum: ItemType,
  })
  item_type: ItemType;

  @Column({ nullable: true })
  location: string;

  @Column({ nullable: true })
  contact_info: string;

  @Column({ nullable: true })
  image_url: string;

  @Column()
  date_reported: Date;

  // Relationships
  @ManyToOne(() => User, (user) => user.lostFoundItems)
  @JoinColumn({ name: 'sender_user_id' })
  sender: User;

  @ManyToOne(() => Estate, (estate) => estate.lostFoundItems)
  @JoinColumn({ name: 'estate_id' })
  estate: Estate;
}
