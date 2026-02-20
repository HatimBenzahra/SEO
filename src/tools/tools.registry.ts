import { Injectable, Logger } from '@nestjs/common';
import type { ToolProvider, ToolDefinition, ToolCallResult } from './interfaces/tool.interface';

@Injectable()
export class ToolsRegistry {
  private readonly logger = new Logger(ToolsRegistry.name);
  private readonly providers: Map<string, ToolProvider> = new Map();

  registerProvider(provider: ToolProvider): void {
    if (this.providers.has(provider.source)) {
      this.logger.warn(`Provider "${provider.source}" already registered — replacing.`);
    }
    this.providers.set(provider.source, provider);
    this.logger.log(
      `Registered provider "${provider.source}" with ${provider.getTools().length} tools.`,
    );
  }

  unregisterProvider(source: string): boolean {
    const removed = this.providers.delete(source);
    if (removed) {
      this.logger.log(`Unregistered provider "${source}".`);
    }
    return removed;
  }

  getAllTools(): ToolDefinition[] {
    const tools: ToolDefinition[] = [];
    for (const provider of this.providers.values()) {
      tools.push(...provider.getTools());
    }
    return tools;
  }

  getToolByName(name: string): { tool: ToolDefinition; provider: ToolProvider } | undefined {
    for (const provider of this.providers.values()) {
      if (provider.hasTool(name)) {
        const tool = provider.getTools().find((t) => t.name === name);
        if (tool) {
          return { tool, provider };
        }
      }
    }
    return undefined;
  }

  async callTool(name: string, args: Record<string, unknown>): Promise<ToolCallResult> {
    const entry = this.getToolByName(name);
    if (!entry) {
      return {
        success: false,
        data: null,
        error: `Tool "${name}" not found in any registered provider`,
        executionTimeMs: 0,
      };
    }

    this.logger.debug(`Routing "${name}" to provider "${entry.provider.source}"`);
    return entry.provider.callTool(name, args);
  }

  getProviders(): Array<{ source: string; toolCount: number }> {
    return Array.from(this.providers.entries()).map(([source, provider]) => ({
      source,
      toolCount: provider.getTools().length,
    }));
  }
}
