import { Module } from '@nestjs/common';
import { OllamaModule } from '../ollama/ollama.module';
import { ToolsModule } from '../tools/tools.module';
import { AgentService } from './agent.service';
import { AgentController } from './agent.controller';

@Module({
  imports: [OllamaModule, ToolsModule],
  controllers: [AgentController],
  providers: [AgentService],
  exports: [AgentService],
})
export class AgentModule {}
