import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WebsocketModule } from '../websocket/websocket.module';
import {
  NotificationEntity,
  NotificationPreferenceEntity,
  NotificationTemplateEntity,
} from './entities/notification.entities';
import { NotificationController } from './notification.controller';
import { NotificationService } from './services/notification.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      NotificationEntity,
      NotificationPreferenceEntity,
      NotificationTemplateEntity,
    ]),
    forwardRef(() => WebsocketModule),
  ],
  controllers: [NotificationController],
  providers: [NotificationService],
  exports: [NotificationService],
})
export class NotificationModule {}
