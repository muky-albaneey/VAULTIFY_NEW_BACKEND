import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, Like } from 'typeorm';
import { Conversation, ConversationType } from '../../entities/conversation.entity';
import { ConversationParticipant } from '../../entities/conversation-participant.entity';
import { Message, MessageType, MessageStatus } from '../../entities/message.entity';
import { MessageReaction } from '../../entities/message-reaction.entity';
import { User } from '../../entities/user.entity';
import { Estate } from '../../entities/estate.entity';

export interface CreateConversationDto {
  estate_id: string;
  type: ConversationType;
  title?: string;
  participant_user_ids: string[];
}

export interface SendMessageDto {
  content?: string;
  type: MessageType;
  metadata?: any;
  reply_to_message_id?: string;
}

export interface AddReactionDto {
  emoji: string;
}

@Injectable()
export class MessagingService {
  constructor(
    @InjectRepository(Conversation)
    private conversationRepository: Repository<Conversation>,
    @InjectRepository(ConversationParticipant)
    private participantRepository: Repository<ConversationParticipant>,
    @InjectRepository(Message)
    private messageRepository: Repository<Message>,
    @InjectRepository(MessageReaction)
    private reactionRepository: Repository<MessageReaction>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Estate)
    private estateRepository: Repository<Estate>,
    private dataSource: DataSource,
  ) {}

  async createConversation(userId: string, createData: CreateConversationDto) {
    const { estate_id, type, title, participant_user_ids } = createData;

    // Verify estate exists
    const estate = await this.estateRepository.findOne({ where: { estate_id } });
    if (!estate) {
      throw new NotFoundException('Estate not found');
    }

    // Verify all participants exist
    const participants = await this.userRepository.findByIds(participant_user_ids);
    if (participants.length !== participant_user_ids.length) {
      throw new BadRequestException('Some participants not found');
    }

    // Add creator to participants if not already included
    const allParticipantIds = [...new Set([userId, ...participant_user_ids])];

    return await this.dataSource.transaction(async (manager) => {
      // Create conversation
      const conversation = manager.create(Conversation, {
        estate_id,
        created_by_user_id: userId,
        type,
        title,
      });

      const savedConversation = await manager.save(conversation);

      // Add participants
      for (let i = 0; i < allParticipantIds.length; i++) {
        const participant = manager.create(ConversationParticipant, {
          conversation_id: savedConversation.conversation_id,
          user_id: allParticipantIds[i],
          is_admin: allParticipantIds[i] === userId,
          joined_at: new Date(),
        });

        await manager.save(participant);
      }

      return savedConversation;
    });
  }

  async getUserById(userId: string) {
    return await this.userRepository.findOne({
      where: { user_id: userId },
      relations: ['profile'],
    });
  }

  async getUserConversations(userId: string, page: number = 1, limit: number = 20) {
    const offset = (page - 1) * limit;

    const conversations = await this.conversationRepository
      .createQueryBuilder('conversation')
      .leftJoinAndSelect('conversation.participants', 'participants')
      .leftJoinAndSelect('participants.user', 'user')
      .leftJoinAndSelect('conversation.messages', 'messages')
      .leftJoinAndSelect('messages.sender', 'sender')
      .where('participants.user_id = :userId', { userId })
      .andWhere('participants.left_at IS NULL')
      .orderBy('conversation.updated_at', 'DESC')
      .skip(offset)
      .take(limit)
      .getMany();

    return {
      data: conversations,
      page,
      limit,
    };
  }

  async getConversationById(conversationId: string, userId: string) {
    const conversation = await this.conversationRepository.findOne({
      where: { conversation_id: conversationId },
      relations: ['participants', 'participants.user', 'estate'],
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    // Check if user is a participant
    const isParticipant = conversation.participants.some(
      p => p.user_id === userId && !p.left_at
    );

    if (!isParticipant) {
      throw new BadRequestException('You are not a participant in this conversation');
    }

    return conversation;
  }

  async sendMessage(userId: string, conversationId: string, messageData: SendMessageDto) {
    const { content, type, metadata, reply_to_message_id } = messageData;

    // Verify conversation exists and user is participant
    const conversation = await this.getConversationById(conversationId, userId);

    // Verify reply message if provided
    if (reply_to_message_id) {
      const replyMessage = await this.messageRepository.findOne({
        where: { message_id: reply_to_message_id, conversation_id: conversationId },
      });

      if (!replyMessage) {
        throw new BadRequestException('Reply message not found');
      }
    }

    const message = this.messageRepository.create({
      conversation_id: conversationId,
      sender_user_id: userId,
      type,
      content,
      metadata,
      reply_to_message_id,
      status: MessageStatus.SENT,
    });

    const savedMessage = await this.messageRepository.save(message);

    // Update conversation timestamp
    conversation.updated_at = new Date();
    await this.conversationRepository.save(conversation);

    return savedMessage;
  }

  async getConversationMessages(conversationId: string, userId: string, page: number = 1, limit: number = 50) {
    // Verify user is participant
    await this.getConversationById(conversationId, userId);

    const offset = (page - 1) * limit;

    const [messages, total] = await this.messageRepository.findAndCount({
      where: { conversation_id: conversationId },
      relations: ['sender', 'replyTo', 'reactions', 'reactions.user'],
      order: { created_at: 'DESC' },
      skip: offset,
      take: limit,
    });

    return {
      data: messages.reverse(), // Return in chronological order
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async addReaction(userId: string, messageId: string, reactionData: AddReactionDto) {
    const { emoji } = reactionData;

    const message = await this.messageRepository.findOne({
      where: { message_id: messageId },
      relations: ['conversation', 'conversation.participants'],
    });

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    // Check if user is participant
    const isParticipant = message.conversation.participants.some(
      p => p.user_id === userId && !p.left_at
    );

    if (!isParticipant) {
      throw new BadRequestException('You are not a participant in this conversation');
    }

    // Check if user already reacted with this emoji
    const existingReaction = await this.reactionRepository.findOne({
      where: { message_id: messageId, user_id: userId, emoji },
    });

    if (existingReaction) {
      throw new BadRequestException('You have already reacted with this emoji');
    }

    const reaction = this.reactionRepository.create({
      message_id: messageId,
      user_id: userId,
      emoji,
    });

    return await this.reactionRepository.save(reaction);
  }

  async removeReaction(userId: string, messageId: string, emoji: string) {
    const reaction = await this.reactionRepository.findOne({
      where: { message_id: messageId, user_id: userId, emoji },
    });

    if (!reaction) {
      throw new NotFoundException('Reaction not found');
    }

    await this.reactionRepository.remove(reaction);
    return { message: 'Reaction removed successfully' };
  }

  async markAsRead(userId: string, conversationId: string, messageId: string) {
    const participant = await this.participantRepository.findOne({
      where: { conversation_id: conversationId, user_id: userId },
    });

    if (!participant) {
      throw new NotFoundException('You are not a participant in this conversation');
    }

    participant.last_read_message_id = messageId;
    await this.participantRepository.save(participant);

    return { message: 'Messages marked as read' };
  }

  async leaveConversation(userId: string, conversationId: string) {
    const participant = await this.participantRepository.findOne({
      where: { conversation_id: conversationId, user_id: userId },
    });

    if (!participant) {
      throw new NotFoundException('You are not a participant in this conversation');
    }

    participant.left_at = new Date();
    await this.participantRepository.save(participant);

    return { message: 'Left conversation successfully' };
  }

  async addParticipant(userId: string, conversationId: string, newUserId: string) {
    // Check if user is admin
    const adminParticipant = await this.participantRepository.findOne({
      where: { conversation_id: conversationId, user_id: userId, is_admin: true },
    });

    if (!adminParticipant) {
      throw new BadRequestException('Only admins can add participants');
    }

    // Check if user is already a participant
    const existingParticipant = await this.participantRepository.findOne({
      where: { conversation_id: conversationId, user_id: newUserId },
    });

    if (existingParticipant && !existingParticipant.left_at) {
      throw new BadRequestException('User is already a participant');
    }

    if (existingParticipant) {
      // Rejoin conversation
      existingParticipant.left_at = null;
      existingParticipant.joined_at = new Date();
      return await this.participantRepository.save(existingParticipant);
    } else {
      // Add new participant
      const participant = this.participantRepository.create({
        conversation_id: conversationId,
        user_id: newUserId,
        is_admin: false,
        joined_at: new Date(),
      });

      return await this.participantRepository.save(participant);
    }
  }

  async createEstateGroupConversation(estateId: string, createdByUserId: string, title?: string) {
    // Verify estate exists
    const estate = await this.estateRepository.findOne({ where: { estate_id: estateId } });
    if (!estate) {
      throw new NotFoundException('Estate not found');
    }

    // Get all active users in the estate
    const estateUsers = await this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.profile', 'profile')
      .where('profile.estate_id = :estateId', { estateId })
      .andWhere('user.status = :status', { status: 'active' })
      .getMany();

    if (estateUsers.length === 0) {
      throw new BadRequestException('No active users found in estate');
    }

    return await this.dataSource.transaction(async (manager) => {
      // Create estate group conversation
      const conversation = manager.create(Conversation, {
        estate_id: estateId,
        created_by_user_id: createdByUserId,
        type: ConversationType.GROUP,
        title: title || `${estate.name} Estate Group`,
      });

      const savedConversation = await manager.save(conversation);

      // Add all estate users as participants
      for (const user of estateUsers) {
        const participant = manager.create(ConversationParticipant, {
          conversation_id: savedConversation.conversation_id,
          user_id: user.user_id,
          is_admin: user.user_id === createdByUserId,
          joined_at: new Date(),
        });

        await manager.save(participant);
      }

      return savedConversation;
    });
  }

  async getEstateGroupConversation(estateId: string) {
    return await this.conversationRepository.findOne({
      where: { 
        estate_id: estateId, 
        type: ConversationType.GROUP,
        title: Like(`%Estate Group%`)
      },
      relations: ['participants', 'participants.user', 'estate'],
    });
  }

  async getOrCreateEstateGroupConversation(estateId: string, userId: string) {
    // Check if estate group conversation already exists
    let conversation = await this.getEstateGroupConversation(estateId);

    if (!conversation) {
      // Create new estate group conversation
      conversation = await this.createEstateGroupConversation(estateId, userId);
    } else {
      // Check if user is already a participant
      const isParticipant = conversation.participants.some(
        p => p.user_id === userId && !p.left_at
      );

      if (!isParticipant) {
        // Add user to the estate group conversation
        const participant = this.participantRepository.create({
          conversation_id: conversation.conversation_id,
          user_id: userId,
          is_admin: false,
          joined_at: new Date(),
        });

        await this.participantRepository.save(participant);

        // Reload conversation with updated participants
        conversation = await this.getConversationById(conversation.conversation_id, userId);
      }
    }

    return conversation;
  }

  async sendEstateBroadcast(estateId: string, senderUserId: string, messageData: SendMessageDto) {
    // Get or create estate group conversation
    const conversation = await this.getOrCreateEstateGroupConversation(estateId, senderUserId);

    // Send message to estate group
    return await this.sendMessage(senderUserId, conversation.conversation_id, messageData);
  }

  async getEstateConversations(estateId: string, userId: string, page: number = 1, limit: number = 20) {
    const offset = (page - 1) * limit;

    const conversations = await this.conversationRepository
      .createQueryBuilder('conversation')
      .leftJoinAndSelect('conversation.participants', 'participants')
      .leftJoinAndSelect('participants.user', 'user')
      .leftJoinAndSelect('conversation.messages', 'messages')
      .leftJoinAndSelect('messages.sender', 'sender')
      .where('conversation.estate_id = :estateId', { estateId })
      .andWhere('participants.user_id = :userId', { userId })
      .andWhere('participants.left_at IS NULL')
      .orderBy('conversation.updated_at', 'DESC')
      .skip(offset)
      .take(limit)
      .getMany();

    return {
      data: conversations,
      page,
      limit,
    };
  }

  async getEstateOnlineUsers(estateId: string) {
    // This would typically be called by the gateway
    // Return users who are currently online in the estate
    return await this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.profile', 'profile')
      .where('profile.estate_id = :estateId', { estateId })
      .andWhere('user.status = :status', { status: 'active' })
      .getMany();
  }
}
