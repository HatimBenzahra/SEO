import {
  Controller,
  Post,
  Body,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { AgentService } from './agent.service';
import type { AgentRequest } from './interfaces/agent.interface';

@Controller('agent')
export class AgentController {
  private readonly logger = new Logger(AgentController.name);

  constructor(private readonly agentService: AgentService) {}

  @Post('run')
  async run(@Body() request: AgentRequest) {
    if (!request.message) {
      throw new BadRequestException('message is required');
    }

    this.logger.log(`Agent request: "${request.message.slice(0, 80)}..."`);

    try {
      const result = await this.agentService.run(request);
      return result;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unknown error';
      throw new BadRequestException(`Agent failed: ${message}`);
    }
  }
}
