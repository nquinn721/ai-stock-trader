import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationController } from './notification.controller';
import { NotificationService } from './services/notification.service';
import { 
  NotificationEntity, 
  NotificationPreferenceEntity, 
  NotificationTemplateEntity 
} from './entities/notification.entities';
import { WebsocketModule } from '../websocket/websocket.module';

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
