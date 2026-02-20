import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { ToolsRegistry } from './tools.registry';

@Controller('tools')
export class ToolsController {
  private readonly logger = new Logger(ToolsController.name);

  constructor(private readonly toolsRegistry: ToolsRegistry) {}

  @Get()
  getAllTools() {
    const tools = this.toolsRegistry.getAllTools();
    return {
      count: tools.length,
      providers: this.toolsRegistry.getProviders(),
      tools: tools.map((t) => ({
        name: t.name,
        description: t.description,
        source: t.source,
      })),
    };
  }

  @Get('providers')
  getProviders() {
    return this.toolsRegistry.getProviders();
  }

  @Get(':name')
  getToolByName(@Param('name') name: string) {
    const entry = this.toolsRegistry.getToolByName(name);
    if (!entry) {
      throw new NotFoundException(`Tool "${name}" not found`);
    }
    return entry.tool;
  }

  @Post(':name/call')
  async callTool(
    @Param('name') name: string,
    @Body() args: Record<string, unknown>,
  ) {
    const entry = this.toolsRegistry.getToolByName(name);
    if (!entry) {
      throw new NotFoundException(`Tool "${name}" not found`);
    }

    this.logger.log(`Calling tool "${name}" via provider "${entry.provider.source}"`);
    return this.toolsRegistry.callTool(name, args);
  }
}
