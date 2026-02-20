export interface OllamaModel {
  name: string;
  model: string;
  size: number;
  digest: string;
  modified_at: string;
}

export interface OllamaGenerateRequest {
  model?: string;
  prompt: string;
  system?: string;
  temperature?: number;
  stream?: boolean;
}

export interface OllamaGenerateResponse {
  model: string;
  response: string;
  done: boolean;
  total_duration?: number;
  eval_count?: number;
}

export interface OllamaChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface OllamaChatRequest {
  model?: string;
  messages: OllamaChatMessage[];
  temperature?: number;
  stream?: boolean;
}

export interface OllamaChatResponse {
  model: string;
  message: OllamaChatMessage;
  done: boolean;
  total_duration?: number;
  eval_count?: number;
}

export interface OllamaConnectionStatus {
  connected: boolean;
  baseUrl: string;
  defaultModel: string;
  modelCount?: number;
}
