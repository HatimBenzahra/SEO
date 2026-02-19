import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import {
  McpTool,
  McpToolCallResult,
  McpConnectionStatus,
} from './interfaces/mcp-tool.interface';

@Injectable()
export class McpService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(McpService.name);
  private client: Client | null = null;
  private tools: McpTool[] = [];
  private connectedAt: Date | null = null;

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit(): Promise<void> {
    await this.connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.disconnect();
  }

  private async connect(): Promise<void> {
    const mcpUrl = this.configService.getOrThrow<string>('SEMRUSH_MCP_URL');
    const apiKey = this.configService.getOrThrow<string>('SEMRUSH_API_KEY');

    this.logger.log(`Connecting to SEMrush MCP at ${mcpUrl}...`);

    const transport = new StreamableHTTPClientTransport(
      new URL(mcpUrl),
      {
        requestInit: {
          headers: {
            Authorization: `Apikey ${apiKey}`,
          },
        },
      },
    );

    this.client = new Client(
      { name: 'seo-nestjs-backend', version: '1.0.0' },
      { capabilities: {} },
    );

    await this.client.connect(transport);

    const response = await this.client.listTools();
    this.tools = (response.tools || []) as McpTool[];
    this.connectedAt = new Date();

    this.logger.log(
      `Connected to SEMrush MCP — discovered ${this.tools.length} tools: ${this.tools.map((t) => t.name).join(', ')}`,
    );
  }

  private async disconnect(): Promise<void> {
    if (this.client) {
      try {
        await this.client.close();
      } catch (error) {
        this.logger.warn('Error closing MCP client', error);
      }
      this.client = null;
      this.tools = [];
      this.connectedAt = null;
      this.logger.log('Disconnected from SEMrush MCP.');
    }
  }

  getTools(): McpTool[] {
    return this.tools;
  }

  getToolByName(name: string): McpTool | undefined {
    return this.tools.find((t) => t.name === name);
  }

  async callTool(
    name: string,
    args: Record<string, unknown>,
  ): Promise<McpToolCallResult> {
    if (!this.client) {
      throw new Error('MCP client is not connected');
    }

    const tool = this.getToolByName(name);
    if (!tool) {
      throw new Error(`Tool "${name}" not found among ${this.tools.length} discovered tools`);
    }

    this.logger.debug(`Calling tool "${name}" with args: ${JSON.stringify(args)}`);

    const result = await this.client.callTool({
      name,
      arguments: args,
    });

    return result as McpToolCallResult;
  }

  getStatus(): McpConnectionStatus {
    return {
      connected: this.client !== null,
      toolCount: this.tools.length,
      url: this.configService.getOrThrow<string>('SEMRUSH_MCP_URL'),
      connectedAt: this.connectedAt ?? undefined,
    };
  }
}
