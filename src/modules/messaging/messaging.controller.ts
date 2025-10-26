import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { MessagingService, CreateConversationDto, SendMessageDto, AddReactionDto } from './messaging.service';
import { JwtAuthGuard } from '../auth/auth.guards';
import { CurrentUserId } from '../../common/decorators/current-user.decorator';
import { z } from 'zod';

const CreateConversationSchema = z.object({
  estate_id: z.string().uuid(),
  type: z.enum(['direct', 'group']),
  title: z.string().optional(),
  participant_user_ids: z.array(z.string().uuid()),
});

const SendMessageSchema = z.object({
  content: z.string().optional(),
  type: z.enum(['text', 'image', 'file', 'voice', 'link_preview', 'system']),
  metadata: z.any().optional(),
  reply_to_message_id: z.string().uuid().optional(),
});

const AddReactionSchema = z.object({
  emoji: z.string().min(1),
});

@ApiTags('Messaging')
@Controller('messaging')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class MessagingController {
  constructor(private messagingService: MessagingService) {}

  @Post('conversations')
  @ApiOperation({ summary: 'Create new conversation' })
  @ApiResponse({ status: 201, description: 'Conversation created successfully' })
  async createConversation(
    @CurrentUserId() userId: string,
    @Body() createData: CreateConversationDto,
  ) {
    const parsed = CreateConversationSchema.parse(createData) as any;
    const validatedData: CreateConversationDto = {
      estate_id: parsed.estate_id,
      type: parsed.type,
      title: parsed.title,
      participant_user_ids: parsed.participant_user_ids,
    };
    return this.messagingService.createConversation(userId, validatedData);
  }

  @Get('conversations')
  @ApiOperation({ summary: 'Get user conversations' })
  @ApiQuery({ name: 'page', description: 'Page number', required: false })
  @ApiQuery({ name: 'limit', description: 'Items per page', required: false })
  @ApiResponse({ status: 200, description: 'Conversations retrieved successfully' })
  async getUserConversations(
    @CurrentUserId() userId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ) {
    return this.messagingService.getUserConversations(userId, page, limit);
  }

  @Get('conversations/:id')
  @ApiOperation({ summary: 'Get conversation by ID' })
  @ApiResponse({ status: 200, description: 'Conversation retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Conversation not found' })
  async getConversationById(
    @CurrentUserId() userId: string,
    @Param('id') conversationId: string,
  ) {
    return this.messagingService.getConversationById(conversationId, userId);
  }

  @Post('conversations/:id/messages')
  @ApiOperation({ summary: 'Send message to conversation' })
  @ApiResponse({ status: 201, description: 'Message sent successfully' })
  async sendMessage(
    @CurrentUserId() userId: string,
    @Param('id') conversationId: string,
    @Body() messageData: SendMessageDto,
  ) {
    const parsed = SendMessageSchema.parse(messageData) as any;
    const validatedData: SendMessageDto = {
      content: parsed.content,
      type: parsed.type,
      metadata: parsed.metadata,
      reply_to_message_id: parsed.reply_to_message_id,
    };
    return this.messagingService.sendMessage(userId, conversationId, validatedData);
  }

  @Get('conversations/:id/messages')
  @ApiOperation({ summary: 'Get conversation messages' })
  @ApiQuery({ name: 'page', description: 'Page number', required: false })
  @ApiQuery({ name: 'limit', description: 'Items per page', required: false })
  @ApiResponse({ status: 200, description: 'Messages retrieved successfully' })
  async getConversationMessages(
    @CurrentUserId() userId: string,
    @Param('id') conversationId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 50,
  ) {
    return this.messagingService.getConversationMessages(conversationId, userId, page, limit);
  }

  @Post('messages/:id/reactions')
  @ApiOperation({ summary: 'Add reaction to message' })
  @ApiResponse({ status: 201, description: 'Reaction added successfully' })
  async addReaction(
    @CurrentUserId() userId: string,
    @Param('id') messageId: string,
    @Body() reactionData: AddReactionDto,
  ) {
    const parsed = AddReactionSchema.parse(reactionData);
    const validatedData: AddReactionDto = {
      emoji: parsed.emoji,
    };
    return this.messagingService.addReaction(userId, messageId, validatedData);
  }

  @Delete('messages/:id/reactions/:emoji')
  @ApiOperation({ summary: 'Remove reaction from message' })
  @ApiResponse({ status: 200, description: 'Reaction removed successfully' })
  async removeReaction(
    @CurrentUserId() userId: string,
    @Param('id') messageId: string,
    @Param('emoji') emoji: string,
  ) {
    return this.messagingService.removeReaction(userId, messageId, emoji);
  }

  @Put('conversations/:id/read/:messageId')
  @ApiOperation({ summary: 'Mark messages as read' })
  @ApiResponse({ status: 200, description: 'Messages marked as read' })
  async markAsRead(
    @CurrentUserId() userId: string,
    @Param('id') conversationId: string,
    @Param('messageId') messageId: string,
  ) {
    return this.messagingService.markAsRead(userId, conversationId, messageId);
  }

  @Put('conversations/:id/leave')
  @ApiOperation({ summary: 'Leave conversation' })
  @ApiResponse({ status: 200, description: 'Left conversation successfully' })
  async leaveConversation(
    @CurrentUserId() userId: string,
    @Param('id') conversationId: string,
  ) {
    return this.messagingService.leaveConversation(userId, conversationId);
  }

  @Post('conversations/:id/participants/:userId')
  @ApiOperation({ summary: 'Add participant to conversation' })
  @ApiResponse({ status: 201, description: 'Participant added successfully' })
  async addParticipant(
    @CurrentUserId() userId: string,
    @Param('id') conversationId: string,
    @Param('userId') newUserId: string,
  ) {
    return this.messagingService.addParticipant(userId, conversationId, newUserId);
  }

  @Post('estate/:estateId/group')
  @ApiOperation({ summary: 'Create estate group conversation' })
  @ApiResponse({ status: 201, description: 'Estate group conversation created successfully' })
  async createEstateGroupConversation(
    @CurrentUserId() userId: string,
    @Param('estateId') estateId: string,
    @Body() body: { title?: string },
  ) {
    return this.messagingService.createEstateGroupConversation(estateId, userId, body.title);
  }

  @Get('estate/:estateId/group')
  @ApiOperation({ summary: 'Get estate group conversation' })
  @ApiResponse({ status: 200, description: 'Estate group conversation retrieved successfully' })
  async getEstateGroupConversation(
    @CurrentUserId() userId: string,
    @Param('estateId') estateId: string,
  ) {
    return this.messagingService.getOrCreateEstateGroupConversation(estateId, userId);
  }

  @Get('estate/:estateId/conversations')
  @ApiOperation({ summary: 'Get estate conversations' })
  @ApiQuery({ name: 'page', description: 'Page number', required: false })
  @ApiQuery({ name: 'limit', description: 'Items per page', required: false })
  @ApiResponse({ status: 200, description: 'Estate conversations retrieved successfully' })
  async getEstateConversations(
    @CurrentUserId() userId: string,
    @Param('estateId') estateId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ) {
    return this.messagingService.getEstateConversations(estateId, userId, page, limit);
  }

  @Post('estate/:estateId/broadcast')
  @ApiOperation({ summary: 'Send estate broadcast message' })
  @ApiResponse({ status: 201, description: 'Estate broadcast sent successfully' })
  async sendEstateBroadcast(
    @CurrentUserId() userId: string,
    @Param('estateId') estateId: string,
    @Body() messageData: SendMessageDto,
  ) {
    const parsed = SendMessageSchema.parse(messageData) as any;
    const validatedData: SendMessageDto = {
      content: parsed.content,
      type: parsed.type,
      metadata: parsed.metadata,
      reply_to_message_id: parsed.reply_to_message_id,
    };
    return this.messagingService.sendEstateBroadcast(estateId, userId, validatedData);
  }

  @Get('estate/:estateId/online-users')
  @ApiOperation({ summary: 'Get estate online users' })
  @ApiResponse({ status: 200, description: 'Estate online users retrieved successfully' })
  async getEstateOnlineUsers(@Param('estateId') estateId: string) {
    return this.messagingService.getEstateOnlineUsers(estateId);
  }
}
