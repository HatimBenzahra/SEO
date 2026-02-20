export interface ToolParameter {
  name: string;
  type: string;
  description?: string;
  required: boolean;
}

export interface ToolDefinition {
  name: string;
  description: string;
  source: string;
  parameters: ToolParameter[];
  metadata?: Record<string, unknown>;
}

export interface ToolCallResult {
  success: boolean;
  data: unknown;
  error?: string;
  executionTimeMs: number;
}

export interface ToolProvider {
  readonly source: string;
  getTools(): ToolDefinition[];
  callTool(name: string, args: Record<string, unknown>): Promise<ToolCallResult>;
  hasTool(name: string): boolean;
}
