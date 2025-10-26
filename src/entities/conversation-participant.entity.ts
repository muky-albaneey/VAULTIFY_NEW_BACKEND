import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Conversation } from './conversation.entity';
import { User } from './user.entity';
import { Message } from './message.entity';

@Entity('conversation_participants')
export class ConversationParticipant {
  @PrimaryGeneratedColumn('uuid')
  participant_id: string;

  @Column()
  conversation_id: string;

  @Column()
  user_id: string;

  @Column({ default: false })
  is_admin: boolean;

  @Column({ default: false })
  is_muted: boolean;

  @Column({ nullable: true })
  muted_until: Date;

  @Column({ default: false })
  is_pinned: boolean;

  @Column({ default: false })
  is_archived: boolean;

  @Column({ default: true })
  notifications_enabled: boolean;

  @Column({ nullable: true })
  last_read_message_id: string;

  @Column({ nullable: true })
  last_deleted_before: Date;

  @Column({ nullable: true })
  left_at: Date;

  @Column({ nullable: true })
  removed_at: Date;

  @CreateDateColumn()
  joined_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  // Relationships
  @ManyToOne(() => Conversation, (conversation) => conversation.participants)
  @JoinColumn({ name: 'conversation_id' })
  conversation: Conversation;

  @ManyToOne(() => User, (user) => user.conversationParticipants)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Message, (message) => message.lastReadBy)
  @JoinColumn({ name: 'last_read_message_id' })
  lastReadMessage: Message;
}
