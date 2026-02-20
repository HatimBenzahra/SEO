export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  metadata?: {
    model?: string;
    durationMs?: number;
    iterationCount?: number;
    steps?: unknown[];
  };
}

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
  model?: string;
}

export interface ChatRequest {
  sessionId?: string;
  message: string;
  model?: string;
  temperature?: number;
  maxIterations?: number;
}

export interface ChatResponse {
  sessionId: string;
  message: ChatMessage;
  session: {
    title: string;
    messageCount: number;
  };
}
