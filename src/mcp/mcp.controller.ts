import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { McpService } from './mcp.service';

@Controller('mcp')
export class McpController {
  private readonly logger = new Logger(McpController.name);

  constructor(private readonly mcpService: McpService) {}

  @Get('health')
  getHealth() {
    return this.mcpService.getStatus();
  }

  @Get('tools')
  getTools() {
    const tools = this.mcpService.getTools();
    return {
      count: tools.length,
      tools: tools.map((t) => ({
        name: t.name,
        description: t.description,
      })),
    };
  }

  @Get('tools/:name')
  getToolByName(@Param('name') name: string) {
    const tool = this.mcpService.getToolByName(name);
    if (!tool) {
      throw new NotFoundException(`Tool "${name}" not found`);
    }
    return tool;
  }

  @Get('tools/:name/schema')
  getToolSchema(@Param('name') name: string) {
    const tool = this.mcpService.getToolByName(name);
    if (!tool) {
      throw new NotFoundException(`Tool "${name}" not found`);
    }
    return {
      name: tool.name,
      description: tool.description,
      inputSchema: tool.inputSchema,
    };
  }

  @Post('tools/:name/call')
  async callTool(
    @Param('name') name: string,
    @Body() args: Record<string, unknown>,
  ) {
    const tool = this.mcpService.getToolByName(name);
    if (!tool) {
      throw new NotFoundException(`Tool "${name}" not found`);
    }

    this.logger.log(`Calling tool "${name}"`);

    try {
      const result = await this.mcpService.callTool(name, args);
      return {
        tool: name,
        result,
      };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unknown error';
      throw new BadRequestException(`Tool call failed: ${message}`);
    }
  }
}
