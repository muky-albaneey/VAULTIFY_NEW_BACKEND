import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Message } from './message.entity';
import { User } from './user.entity';

@Entity('message_reactions')
export class MessageReaction {
  @PrimaryGeneratedColumn('uuid')
  reaction_id: string;

  @Column()
  message_id: string;

  @Column()
  user_id: string;

  @Column()
  emoji: string;

  @CreateDateColumn()
  created_at: Date;

  // Relationships
  @ManyToOne(() => Message, (message) => message.reactions)
  @JoinColumn({ name: 'message_id' })
  message: Message;

  @ManyToOne(() => User, (user) => user.messageReactions)
  @JoinColumn({ name: 'user_id' })
  user: User;
}
