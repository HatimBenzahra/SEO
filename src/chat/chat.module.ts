import { Module } from '@nestjs/common';
import { AgentModule } from '../agent/agent.module';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';

@Module({
  imports: [AgentModule],
  controllers: [ChatController],
  providers: [ChatService],
})
export class ChatModule {}
