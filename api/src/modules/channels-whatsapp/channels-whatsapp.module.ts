import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { StgWhatsappInboundEventEntity } from '../shared/staging/stg-whatsapp-inbound-event.entity';
import { ChannelsWhatsappController } from './channels-whatsapp.controller';
import { ChannelsWhatsappService } from './channels-whatsapp.service';
import { ConversationMessageEntity } from './conversation-message.entity';
import { ConversationSandboxEntity } from './conversation-sandbox.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ConversationSandboxEntity,
      ConversationMessageEntity,
      StgWhatsappInboundEventEntity,
    ]),
  ],
  controllers: [ChannelsWhatsappController],
  providers: [ChannelsWhatsappService],
})
export class ChannelsWhatsappModule {}
