import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { ChatService } from './chat.service';
import type { ChatRequest } from './interfaces/chat.interface';

@Controller('chat')
export class ChatController {
  private readonly logger = new Logger(ChatController.name);

  constructor(private readonly chatService: ChatService) {}

  @Post()
  async chat(@Body() request: ChatRequest) {
    if (!request.message) {
      throw new BadRequestException('message is required');
    }

    this.logger.log(
      `Chat request — session: ${request.sessionId ?? 'new'}, message: "${request.message.slice(0, 60)}..."`,
    );

    try {
      return await this.chatService.chat(request);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      const message =
        error instanceof Error ? error.message : 'Unknown error';
      throw new BadRequestException(`Chat failed: ${message}`);
    }
  }

  @Get('sessions')
  getSessions() {
    return this.chatService.getSessions();
  }

  @Get('sessions/:id')
  getSession(@Param('id') id: string) {
    return this.chatService.getSession(id);
  }

  @Delete('sessions/:id')
  deleteSession(@Param('id') id: string) {
    const deleted = this.chatService.deleteSession(id);
    if (!deleted) {
      throw new NotFoundException(`Session "${id}" not found`);
    }
    return { deleted: true };
  }
}
