import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable, Logger, UseGuards } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { MessagingService } from './messaging.service';
import { NotificationsService } from '../notifications/notifications.service';
import { User } from '../../entities/user.entity';
import { Estate } from '../../entities/estate.entity';

interface AuthenticatedSocket extends Socket {
  user?: User;
  estateId?: string;
}

interface JoinEstateGroupDto {
  estateId: string;
}

interface SendMessageDto {
  conversationId: string;
  content?: string;
  type: string;
  metadata?: any;
  replyToMessageId?: string;
}

interface TypingDto {
  conversationId: string;
  isTyping: boolean;
}

@Injectable()
@WebSocketGateway({
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
  namespace: '/messaging',
})
export class MessagingGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(MessagingGateway.name);
  private readonly connectedUsers = new Map<string, AuthenticatedSocket>();
  private readonly estateRooms = new Map<string, Set<string>>(); // estateId -> Set of userIds
  private readonly userTyping = new Map<string, { conversationId: string; timestamp: number }>();

  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
    private messagingService: MessagingService,
    private notificationsService: NotificationsService,
  ) {}

  afterInit(server: Server) {
    this.logger.log('WebSocket Gateway initialized');
  }

  async handleConnection(client: AuthenticatedSocket) {
    try {
      // Extract token from handshake
      const token = client.handshake.auth?.token || client.handshake.headers?.authorization?.replace('Bearer ', '');
      
      if (!token) {
        this.logger.warn('Connection rejected: No token provided');
        client.disconnect();
        return;
      }

      // Verify JWT token
      const payload = this.jwtService.verify(token, {
        secret: this.configService.get('app.jwt.secret'),
      });

      // Get user from database
      const user = await this.messagingService.getUserById(payload.sub);
      if (!user) {
        this.logger.warn('Connection rejected: Invalid user');
        client.disconnect();
        return;
      }

      // Attach user to socket
      client.user = user;
      client.estateId = user.profile?.estate_id;

      // Store connection
      this.connectedUsers.set(user.user_id, client);

      // Join estate group if user has estate
      if (client.estateId) {
        await this.joinEstateGroup(client, { estateId: client.estateId });
      }

      this.logger.log(`User ${user.first_name} ${user.last_name} connected`);
      
      // Notify user's estate about online status
      if (client.estateId) {
        this.server.to(`estate:${client.estateId}`).emit('user_online', {
          userId: user.user_id,
          firstName: user.first_name,
          lastName: user.last_name,
          timestamp: new Date(),
        });
      }

    } catch (error) {
      this.logger.error('Connection error:', error);
      client.disconnect();
    }
  }

  async handleDisconnect(client: AuthenticatedSocket) {
    if (client.user) {
      const userId = client.user.user_id;
      const estateId = client.estateId;

      // Remove from connected users
      this.connectedUsers.delete(userId);

      // Leave estate group
      if (estateId) {
        const estateRoom = this.estateRooms.get(estateId);
        if (estateRoom) {
          estateRoom.delete(userId);
          if (estateRoom.size === 0) {
            this.estateRooms.delete(estateId);
          }
        }

        // Notify estate about offline status
        this.server.to(`estate:${estateId}`).emit('user_offline', {
          userId,
          timestamp: new Date(),
        });
      }

      this.logger.log(`User ${client.user.first_name} ${client.user.last_name} disconnected`);
    }
  }

  @SubscribeMessage('join_estate_group')
  async handleJoinEstateGroup(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: JoinEstateGroupDto,
  ) {
    await this.joinEstateGroup(client, data);
  }

  @SubscribeMessage('leave_estate_group')
  async handleLeaveEstateGroup(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: JoinEstateGroupDto,
  ) {
    await this.leaveEstateGroup(client, data);
  }

  @SubscribeMessage('send_message')
  async handleSendMessage(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: SendMessageDto,
  ) {
    try {
      if (!client.user) {
        client.emit('error', { message: 'Not authenticated' });
        return;
      }

      // Send message via service
      const message = await this.messagingService.sendMessage(
        client.user.user_id,
        data.conversationId,
        {
          content: data.content,
          type: data.type as any,
          metadata: data.metadata,
          reply_to_message_id: data.replyToMessageId,
        }
      );

      // Get conversation participants
      const conversation = await this.messagingService.getConversationById(
        data.conversationId,
        client.user.user_id
      );

      // Broadcast to conversation participants
      const participantIds = conversation.participants
        .filter(p => !p.left_at)
        .map(p => p.user_id);

      // Emit to all connected participants
      participantIds.forEach(participantId => {
        const participantSocket = this.connectedUsers.get(participantId);
        if (participantSocket) {
          participantSocket.emit('new_message', {
            conversationId: data.conversationId,
            message: {
              ...message,
              sender: {
                user_id: client.user.user_id,
                first_name: client.user.first_name,
                last_name: client.user.last_name,
                profile_picture_url: client.user.profile?.profile_picture_url,
              },
            },
          });
        }
      });

      // Send push notifications to offline participants
      const offlineParticipants = participantIds.filter(
        id => !this.connectedUsers.has(id) && id !== client.user.user_id
      );

      for (const participantId of offlineParticipants) {
        await this.notificationsService.sendNotificationToUser(participantId, {
          title: `New message from ${client.user.first_name}`,
          body: data.content || 'Sent a message',
          data: {
            type: 'message',
            conversationId: data.conversationId,
            senderId: client.user.user_id,
          },
        });
      }

      // Emit success
      client.emit('message_sent', { messageId: message.message_id });

    } catch (error) {
      this.logger.error('Error sending message:', error);
      client.emit('error', { message: 'Failed to send message' });
    }
  }

  @SubscribeMessage('typing')
  async handleTyping(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: TypingDto,
  ) {
    if (!client.user) return;

    const typingKey = `${client.user.user_id}:${data.conversationId}`;
    
    if (data.isTyping) {
      this.userTyping.set(typingKey, {
        conversationId: data.conversationId,
        timestamp: Date.now(),
      });

      // Broadcast typing status to conversation participants
      const conversation = await this.messagingService.getConversationById(
        data.conversationId,
        client.user.user_id
      );

      const participantIds = conversation.participants
        .filter(p => !p.left_at && p.user_id !== client.user.user_id)
        .map(p => p.user_id);

      participantIds.forEach(participantId => {
        const participantSocket = this.connectedUsers.get(participantId);
        if (participantSocket) {
          participantSocket.emit('user_typing', {
            conversationId: data.conversationId,
            userId: client.user.user_id,
            firstName: client.user.first_name,
            lastName: client.user.last_name,
            isTyping: true,
          });
        }
      });

      // Auto-stop typing after 3 seconds
      setTimeout(() => {
        this.userTyping.delete(typingKey);
        participantIds.forEach(participantId => {
          const participantSocket = this.connectedUsers.get(participantId);
          if (participantSocket) {
            participantSocket.emit('user_typing', {
              conversationId: data.conversationId,
              userId: client.user.user_id,
              isTyping: false,
            });
          }
        });
      }, 3000);

    } else {
      this.userTyping.delete(typingKey);
    }
  }

  @SubscribeMessage('mark_as_read')
  async handleMarkAsRead(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { conversationId: string; messageId: string },
  ) {
    if (!client.user) return;

    try {
      await this.messagingService.markAsRead(
        client.user.user_id,
        data.conversationId,
        data.messageId
      );

      // Notify other participants about read status
      const conversation = await this.messagingService.getConversationById(
        data.conversationId,
        client.user.user_id
      );

      const participantIds = conversation.participants
        .filter(p => !p.left_at && p.user_id !== client.user.user_id)
        .map(p => p.user_id);

      participantIds.forEach(participantId => {
        const participantSocket = this.connectedUsers.get(participantId);
        if (participantSocket) {
          participantSocket.emit('message_read', {
            conversationId: data.conversationId,
            messageId: data.messageId,
            readBy: client.user.user_id,
            readAt: new Date(),
          });
        }
      });

    } catch (error) {
      this.logger.error('Error marking as read:', error);
    }
  }

  @SubscribeMessage('estate_broadcast')
  async handleEstateBroadcast(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { message: string; type?: string },
  ) {
    if (!client.user || !client.estateId) {
      client.emit('error', { message: 'Not authorized for estate broadcast' });
      return;
    }

    // Check if user has permission to broadcast (Admin or Security Personnel)
    const userRole = client.user.profile?.role;
    if (!['Admin', 'Security Personnel'].includes(userRole)) {
      client.emit('error', { message: 'Insufficient permissions for estate broadcast' });
      return;
    }

    // Broadcast to all users in the estate
    this.server.to(`estate:${client.estateId}`).emit('estate_broadcast', {
      message: data.message,
      type: data.type || 'announcement',
      from: {
        userId: client.user.user_id,
        firstName: client.user.first_name,
        lastName: client.user.last_name,
        role: userRole,
      },
      timestamp: new Date(),
    });

    // Send push notifications to offline users
    const estateRoom = this.estateRooms.get(client.estateId);
    if (estateRoom) {
      const offlineUsers = Array.from(estateRoom).filter(
        userId => !this.connectedUsers.has(userId)
      );

      for (const userId of offlineUsers) {
        await this.notificationsService.sendNotificationToUser(userId, {
          title: `Estate Announcement`,
          body: data.message,
          data: {
            type: 'estate_broadcast',
            estateId: client.estateId,
            fromUserId: client.user.user_id,
          },
        });
      }
    }
  }

  // Helper methods
  private async joinEstateGroup(client: AuthenticatedSocket, data: JoinEstateGroupDto) {
    if (!client.user) return;

    const estateId = data.estateId;
    
    // Verify user belongs to this estate
    if (client.user.profile?.estate_id !== estateId) {
      client.emit('error', { message: 'Not authorized for this estate' });
      return;
    }

    // Join Socket.IO room
    await client.join(`estate:${estateId}`);

    // Add to estate room tracking
    if (!this.estateRooms.has(estateId)) {
      this.estateRooms.set(estateId, new Set());
    }
    this.estateRooms.get(estateId)!.add(client.user.user_id);

    this.logger.log(`User ${client.user.user_id} joined estate group ${estateId}`);
  }

  private async leaveEstateGroup(client: AuthenticatedSocket, data: JoinEstateGroupDto) {
    if (!client.user) return;

    const estateId = data.estateId;
    
    // Leave Socket.IO room
    await client.leave(`estate:${estateId}`);

    // Remove from estate room tracking
    const estateRoom = this.estateRooms.get(estateId);
    if (estateRoom) {
      estateRoom.delete(client.user.user_id);
      if (estateRoom.size === 0) {
        this.estateRooms.delete(estateId);
      }
    }

    this.logger.log(`User ${client.user.user_id} left estate group ${estateId}`);
  }

  // Public methods for other services to use
  public async notifyConversationParticipants(conversationId: string, event: string, data: any) {
    const conversation = await this.messagingService.getConversationById(conversationId, '');
    const participantIds = conversation.participants
      .filter(p => !p.left_at)
      .map(p => p.user_id);

    participantIds.forEach(participantId => {
      const participantSocket = this.connectedUsers.get(participantId);
      if (participantSocket) {
        participantSocket.emit(event, data);
      }
    });
  }

  public async notifyEstateUsers(estateId: string, event: string, data: any) {
    this.server.to(`estate:${estateId}`).emit(event, data);
  }

  public getConnectedUsersCount(): number {
    return this.connectedUsers.size;
  }

  public getEstateUsersCount(estateId: string): number {
    const estateRoom = this.estateRooms.get(estateId);
    return estateRoom ? estateRoom.size : 0;
  }
}
