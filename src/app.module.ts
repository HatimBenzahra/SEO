import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { McpModule } from './mcp/mcp.module';
import { OllamaModule } from './ollama/ollama.module';
import { ToolsModule } from './tools/tools.module';
import { AgentModule } from './agent/agent.module';
import { ChatModule } from './chat/chat.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    McpModule,
    OllamaModule,
    ToolsModule,
    AgentModule,
    ChatModule,
  ],
})
export class AppModule {}
