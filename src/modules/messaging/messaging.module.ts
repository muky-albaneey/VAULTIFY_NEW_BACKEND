import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';

import { MessagingController } from './messaging.controller';
import { MessagingService } from './messaging.service';
import { MessagingGateway } from './messaging.gateway';
import { Conversation } from '../../entities/conversation.entity';
import { ConversationParticipant } from '../../entities/conversation-participant.entity';
import { Message } from '../../entities/message.entity';
import { MessageReaction } from '../../entities/message-reaction.entity';
import { User } from '../../entities/user.entity';
import { Estate } from '../../entities/estate.entity';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Conversation,
      ConversationParticipant,
      Message,
      MessageReaction,
      User,
      Estate,
    ]),
    JwtModule,
    NotificationsModule,
  ],
  controllers: [MessagingController],
  providers: [MessagingService, MessagingGateway],
  exports: [MessagingService, MessagingGateway],
})
export class MessagingModule {}
