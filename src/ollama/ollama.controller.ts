import {
  Controller,
  Get,
  Post,
  Body,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { OllamaService } from './ollama.service';
import type {
  OllamaGenerateRequest,
  OllamaChatRequest,
} from './interfaces/ollama.interface';

@Controller('ollama')
export class OllamaController {
  private readonly logger = new Logger(OllamaController.name);

  constructor(private readonly ollamaService: OllamaService) {}

  @Get('health')
  getHealth() {
    return this.ollamaService.getStatus();
  }

  @Get('models')
  async getModels() {
    const models = await this.ollamaService.listModels();
    return {
      count: models.length,
      defaultModel: this.ollamaService.getDefaultModel(),
      models: models.map((m) => ({
        name: m.name,
        size: m.size,
        modified_at: m.modified_at,
      })),
    };
  }

  @Post('generate')
  async generate(@Body() request: OllamaGenerateRequest) {
    if (!request.prompt) {
      throw new BadRequestException('prompt is required');
    }

    this.logger.log(
      `Generate request — model: ${request.model ?? 'default'}, prompt length: ${request.prompt.length}`,
    );

    try {
      const result = await this.ollamaService.generate(request);
      return {
        model: result.model,
        response: result.response,
        done: result.done,
        eval_count: result.eval_count,
        total_duration: result.total_duration,
      };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unknown error';
      throw new BadRequestException(`Generation failed: ${message}`);
    }
  }

  @Post('chat')
  async chat(@Body() request: OllamaChatRequest) {
    if (!request.messages || request.messages.length === 0) {
      throw new BadRequestException('messages array is required and must not be empty');
    }

    this.logger.log(
      `Chat request — model: ${request.model ?? 'default'}, messages: ${request.messages.length}`,
    );

    try {
      const result = await this.ollamaService.chat(request);
      return {
        model: result.model,
        message: result.message,
        done: result.done,
        eval_count: result.eval_count,
        total_duration: result.total_duration,
      };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unknown error';
      throw new BadRequestException(`Chat failed: ${message}`);
    }
  }
}
