import { Injectable, Logger } from '@nestjs/common';
import { McpService } from '../../mcp/mcp.service';
import type { McpToolInputSchema } from '../../mcp/interfaces/mcp-tool.interface';
import type { ToolProvider, ToolDefinition, ToolCallResult, ToolParameter } from '../interfaces/tool.interface';

@Injectable()
export class McpToolProvider implements ToolProvider {
  private readonly logger = new Logger(McpToolProvider.name);
  readonly source = 'semrush-mcp';

  constructor(private readonly mcpService: McpService) {}

  getTools(): ToolDefinition[] {
    return this.mcpService.getTools().map((tool) => ({
      name: tool.name,
      description: tool.description ?? '',
      source: this.source,
      parameters: this.extractParameters(tool.inputSchema),
      metadata: { inputSchema: tool.inputSchema },
    }));
  }

  async callTool(name: string, args: Record<string, unknown>): Promise<ToolCallResult> {
    const start = Date.now();

    try {
      const result = await this.mcpService.callTool(name, args);

      return {
        success: !result.isError,
        data: result.content,
        executionTimeMs: Date.now() - start,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Tool "${name}" failed: ${message}`);

      return {
        success: false,
        data: null,
        error: message,
        executionTimeMs: Date.now() - start,
      };
    }
  }

  hasTool(name: string): boolean {
    return this.mcpService.getToolByName(name) !== undefined;
  }

  private extractParameters(inputSchema: McpToolInputSchema): ToolParameter[] {
    const properties = (inputSchema?.properties ?? {}) as Record<string, Record<string, unknown>>;
    const required = (inputSchema?.required ?? []) as string[];

    return Object.entries(properties).map(([name, schema]) => ({
      name,
      type: (schema.type as string) ?? 'string',
      description: schema.description as string | undefined,
      required: required.includes(name),
    }));
  }
}
