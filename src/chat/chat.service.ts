import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { AgentService } from '../agent/agent.service';
import type {
  ChatSession,
  ChatMessage,
  ChatRequest,
  ChatResponse,
} from './interfaces/chat.interface';

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);
  private readonly sessions: Map<string, ChatSession> = new Map();

  constructor(private readonly agentService: AgentService) {}

  async chat(request: ChatRequest): Promise<ChatResponse> {
    const session = request.sessionId
      ? this.getSessionOrThrow(request.sessionId)
      : this.createSession(request.model);

    const userMessage: ChatMessage = {
      id: randomUUID(),
      role: 'user',
      content: request.message,
      timestamp: new Date(),
    };

    session.messages.push(userMessage);
    session.updatedAt = new Date();

    if (session.messages.length === 1) {
      session.title = this.generateTitle(request.message);
    }

    this.logger.log(
      `Chat [${session.id.slice(0, 8)}] — user: "${request.message.slice(0, 60)}..."`,
    );

    const agentResult = await this.agentService.run({
      message: request.message,
      model: request.model ?? session.model,
      temperature: request.temperature,
      maxIterations: request.maxIterations,
    });

    const assistantMessage: ChatMessage = {
      id: randomUUID(),
      role: 'assistant',
      content: agentResult.answer,
      timestamp: new Date(),
      metadata: {
        model: agentResult.model,
        durationMs: agentResult.totalDurationMs,
        iterationCount: agentResult.iterationCount,
        steps: agentResult.steps,
      },
    };

    session.messages.push(assistantMessage);
    session.updatedAt = new Date();

    this.logger.log(
      `Chat [${session.id.slice(0, 8)}] — assistant replied in ${agentResult.totalDurationMs}ms (${agentResult.iterationCount} iterations)`,
    );

    return {
      sessionId: session.id,
      message: assistantMessage,
      session: {
        title: session.title,
        messageCount: session.messages.length,
      },
    };
  }

  getSessions(): Array<Omit<ChatSession, 'messages'> & { messageCount: number }> {
    return Array.from(this.sessions.values()).map((s) => ({
      id: s.id,
      title: s.title,
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
      model: s.model,
      messageCount: s.messages.length,
    }));
  }

  getSession(id: string): ChatSession {
    return this.getSessionOrThrow(id);
  }

  deleteSession(id: string): boolean {
    const deleted = this.sessions.delete(id);
    if (deleted) {
      this.logger.log(`Deleted session ${id.slice(0, 8)}`);
    }
    return deleted;
  }

  private createSession(model?: string): ChatSession {
    const session: ChatSession = {
      id: randomUUID(),
      title: 'New conversation',
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      model,
    };

    this.sessions.set(session.id, session);
    this.logger.log(`Created session ${session.id.slice(0, 8)}`);

    return session;
  }

  private getSessionOrThrow(id: string): ChatSession {
    const session = this.sessions.get(id);
    if (!session) {
      throw new NotFoundException(`Session "${id}" not found`);
    }
    return session;
  }

  private generateTitle(firstMessage: string): string {
    const maxLength = 60;
    const cleaned = firstMessage.replace(/\s+/g, ' ').trim();
    return cleaned.length > maxLength
      ? cleaned.slice(0, maxLength) + '...'
      : cleaned;
  }
}
