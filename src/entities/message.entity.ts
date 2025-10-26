import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { Conversation } from './conversation.entity';
import { User } from './user.entity';
import { ConversationParticipant } from './conversation-participant.entity';
import { MessageReaction } from './message-reaction.entity';

export enum MessageType {
  TEXT = 'text',
  IMAGE = 'image',
  FILE = 'file',
  VOICE = 'voice',
  LINK_PREVIEW = 'link_preview',
  SYSTEM = 'system',
}

export enum MessageStatus {
  QUEUED = 'queued',
  SENT = 'sent',
  DELIVERED = 'delivered',
  READ = 'read',
}

@Entity('messages')
export class Message {
  @PrimaryGeneratedColumn('uuid')
  message_id: string;

  @Column()
  conversation_id: string;

  @Column()
  sender_user_id: string;

  @Column({
    type: 'enum',
    enum: MessageType,
    default: MessageType.TEXT,
  })
  type: MessageType;

  @Column({ nullable: true })
  content: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: any;

  @Column({ nullable: true })
  reply_to_message_id: string;

  @Column({
    type: 'enum',
    enum: MessageStatus,
    default: MessageStatus.QUEUED,
  })
  status: MessageStatus;

  @Column({ nullable: true })
  edited_at: Date;

  @Column({ nullable: true })
  deleted_at: Date;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  // Relationships
  @ManyToOne(() => Conversation, (conversation) => conversation.messages)
  @JoinColumn({ name: 'conversation_id' })
  conversation: Conversation;

  @ManyToOne(() => User, (user) => user.sentMessages)
  @JoinColumn({ name: 'sender_user_id' })
  sender: User;

  @ManyToOne(() => Message, (message) => message.replies)
  @JoinColumn({ name: 'reply_to_message_id' })
  replyTo: Message;

  @OneToMany(() => Message, (message) => message.replyTo)
  replies: Message[];

  @OneToMany(() => ConversationParticipant, (participant) => participant.lastReadMessage)
  lastReadBy: ConversationParticipant[];

  @OneToMany(() => MessageReaction, (reaction) => reaction.message)
  reactions: MessageReaction[];
}
