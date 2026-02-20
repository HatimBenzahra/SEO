export interface AgentToolCall {
  tool: string;
  args: Record<string, unknown>;
  reasoning: string;
}

export interface AgentStep {
  type: 'thought' | 'tool_call' | 'tool_result' | 'answer';
  content: string;
  toolCall?: AgentToolCall;
  toolResult?: unknown;
  timestamp: Date;
}

export interface AgentRequest {
  message: string;
  model?: string;
  temperature?: number;
  maxIterations?: number;
}

export interface AgentResponse {
  answer: string;
  steps: AgentStep[];
  model: string;
  totalDurationMs: number;
  iterationCount: number;
}
