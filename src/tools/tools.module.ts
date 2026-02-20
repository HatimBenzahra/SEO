import { Module, OnModuleInit, Logger } from '@nestjs/common';
import { McpModule } from '../mcp/mcp.module';
import { ToolsRegistry } from './tools.registry';
import { ToolsController } from './tools.controller';
import { McpToolProvider } from './providers/mcp-tool.provider';

@Module({
  imports: [McpModule],
  controllers: [ToolsController],
  providers: [ToolsRegistry, McpToolProvider],
  exports: [ToolsRegistry],
})
export class ToolsModule implements OnModuleInit {
  private readonly logger = new Logger(ToolsModule.name);

  constructor(
    private readonly toolsRegistry: ToolsRegistry,
    private readonly mcpToolProvider: McpToolProvider,
  ) {}

  onModuleInit() {
    this.toolsRegistry.registerProvider(this.mcpToolProvider);
    this.logger.log('MCP tool provider registered in tools registry.');
  }
}
