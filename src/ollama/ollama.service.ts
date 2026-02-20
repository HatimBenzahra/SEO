import {
  Injectable,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  OllamaModel,
  OllamaGenerateRequest,
  OllamaGenerateResponse,
  OllamaChatRequest,
  OllamaChatResponse,
  OllamaConnectionStatus,
} from './interfaces/ollama.interface';

@Injectable()
export class OllamaService implements OnModuleInit {
  private readonly logger = new Logger(OllamaService.name);
  private baseUrl: string = '';
  private defaultModel: string = '';
  private timeoutMs: number = 300000;
  private models: OllamaModel[] = [];

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit(): Promise<void> {
    this.baseUrl = this.configService.getOrThrow<string>('OLLAMA_BASE_URL');
    this.defaultModel = this.configService.getOrThrow<string>('OLLAMA_DEFAULT_MODEL');
    this.timeoutMs = Number(this.configService.get<string>('REQUEST_TIMEOUT_MS', '300000'));

    this.logger.log(`Connecting to Ollama at ${this.baseUrl}...`);

    try {
      this.models = await this.listModels();
      this.logger.log(
        `Ollama connected — ${this.models.length} models available: ${this.models.map((m) => m.name).join(', ')}`,
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.warn(`Ollama not reachable at startup: ${message}. Will retry on first request.`);
    }
  }

  async listModels(): Promise<OllamaModel[]> {
    const response = await this.fetchOllama<{ models: OllamaModel[] }>('/api/tags');
    this.models = response.models || [];
    return this.models;
  }

  async generate(request: OllamaGenerateRequest): Promise<OllamaGenerateResponse> {
    const body = {
      model: request.model ?? this.defaultModel,
      prompt: request.prompt,
      system: request.system,
      stream: false,
      options: {
        temperature: request.temperature ?? 0.2,
      },
    };

    return this.fetchOllama<OllamaGenerateResponse>('/api/generate', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  async chat(request: OllamaChatRequest): Promise<OllamaChatResponse> {
    const body = {
      model: request.model ?? this.defaultModel,
      messages: request.messages,
      stream: false,
      options: {
        temperature: request.temperature ?? 0.2,
      },
    };

    return this.fetchOllama<OllamaChatResponse>('/api/chat', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  getDefaultModel(): string {
    return this.defaultModel;
  }

  getStatus(): OllamaConnectionStatus {
    return {
      connected: this.models.length > 0,
      baseUrl: this.baseUrl,
      defaultModel: this.defaultModel,
      modelCount: this.models.length,
    };
  }

  private async fetchOllama<T>(path: string, init?: RequestInit): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(url, {
        ...init,
        headers: {
          'Content-Type': 'application/json',
          ...init?.headers,
        },
        signal: controller.signal,
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Ollama ${response.status}: ${text}`);
      }

      return (await response.json()) as T;
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error(`Ollama request timeout after ${this.timeoutMs}ms: ${url}`);
      }
      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }
}
