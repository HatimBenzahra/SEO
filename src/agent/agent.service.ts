import { Injectable, Logger } from '@nestjs/common';
import { OllamaService } from '../ollama/ollama.service';
import { ToolsRegistry } from '../tools/tools.registry';
import type {
  AgentRequest,
  AgentResponse,
  AgentStep,
  AgentToolCall,
} from './interfaces/agent.interface';

@Injectable()
export class AgentService {
  private readonly logger = new Logger(AgentService.name);
  private static readonly MAX_ITERATIONS = 10;

  constructor(
    private readonly ollamaService: OllamaService,
    private readonly toolsRegistry: ToolsRegistry,
  ) {}

  async run(request: AgentRequest): Promise<AgentResponse> {
    const start = Date.now();
    const maxIterations = request.maxIterations ?? AgentService.MAX_ITERATIONS;
    const steps: AgentStep[] = [];

    const systemPrompt = this.buildSystemPrompt();
    const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: request.message },
    ];

    this.logger.log(`Agent starting — "${request.message.slice(0, 100)}..."`);

    let iteration = 0;

    while (iteration < maxIterations) {
      iteration++;
      this.logger.debug(`Iteration ${iteration}/${maxIterations}`);

      const chatResponse = await this.ollamaService.chat({
        model: request.model,
        messages,
        temperature: request.temperature ?? 0.2,
      });

      const assistantContent = chatResponse.message.content;

      const toolCall = this.parseToolCall(assistantContent);

      if (!toolCall) {
        steps.push({
          type: 'answer',
          content: assistantContent,
          timestamp: new Date(),
        });

        this.logger.log(`Agent finished in ${iteration} iteration(s).`);

        return {
          answer: assistantContent,
          steps,
          model: chatResponse.model,
          totalDurationMs: Date.now() - start,
          iterationCount: iteration,
        };
      }

      steps.push({
        type: 'thought',
        content: toolCall.reasoning,
        timestamp: new Date(),
      });

      steps.push({
        type: 'tool_call',
        content: `Calling tool "${toolCall.tool}" with args: ${JSON.stringify(toolCall.args)}`,
        toolCall,
        timestamp: new Date(),
      });

      messages.push({ role: 'assistant', content: assistantContent });

      this.logger.debug(`Calling tool "${toolCall.tool}"`);
      const toolResult = await this.toolsRegistry.callTool(toolCall.tool, toolCall.args);

      steps.push({
        type: 'tool_result',
        content: JSON.stringify(toolResult.data),
        toolResult: toolResult,
        timestamp: new Date(),
      });

      const resultSummary = toolResult.success
        ? JSON.stringify(toolResult.data)
        : `Error: ${toolResult.error}`;

      messages.push({
        role: 'user',
        content: `Tool "${toolCall.tool}" returned:\n${resultSummary}\n\nAnalyze this result and either call another tool or provide your final answer.`,
      });
    }

    const lastContent = steps.length > 0
      ? steps[steps.length - 1].content
      : 'Max iterations reached without a final answer.';

    this.logger.warn(`Agent hit max iterations (${maxIterations}).`);

    return {
      answer: `[Max iterations reached] ${lastContent}`,
      steps,
      model: request.model ?? this.ollamaService.getDefaultModel(),
      totalDurationMs: Date.now() - start,
      iterationCount: iteration,
    };
  }

  private buildSystemPrompt(): string {
    const tools = this.toolsRegistry.getAllTools();

    const toolDescriptions = tools.map((t) => {
      const params = t.parameters.length > 0
        ? t.parameters.map((p) => `  - ${p.name} (${p.type}${p.required ? ', required' : ''}): ${p.description ?? 'no description'}`).join('\n')
        : '  (no parameters)';
      return `- ${t.name}: ${t.description}\n${params}`;
    }).join('\n\n');

    return `You are an SEO expert assistant with access to SEMrush tools. You analyze websites, keywords, and SEO data.

AVAILABLE TOOLS:
${toolDescriptions}

IMPORTANT - HOW SEMRUSH TOOLS WORK:
Most tools follow a 3-step pattern:
1. Call a research tool (e.g., keyword_research, organic_research) with {} to discover available reports
2. Call get_report_schema with {"report": "report_name"} to learn required parameters
3. Call execute_report with {"report": "report_name", "params": {...}} to get actual data

TOOL CALL FORMAT:
When you need to use a tool, respond with EXACTLY this JSON block (and nothing else before it):
\`\`\`tool_call
{"tool": "tool_name", "args": {"key": "value"}, "reasoning": "why I need this tool"}
\`\`\`

RULES:
- Use tools when you need real data. Do NOT make up SEO metrics.
- After receiving tool results, analyze them and either call another tool or give your final answer.
- When giving your final answer, do NOT include any tool_call block — just respond naturally.
- Always respond in the same language as the user's message.
- Be concise and actionable in your analysis.`;
  }

  private parseToolCall(content: string): AgentToolCall | null {
    const toolCallRegex = /```tool_call\s*\n?([\s\S]*?)\n?\s*```/;
    const match = content.match(toolCallRegex);

    if (!match) {
      return null;
    }

    try {
      const parsed = JSON.parse(match[1].trim()) as Record<string, unknown>;

      if (typeof parsed.tool !== 'string') {
        this.logger.warn('Parsed tool_call missing "tool" field');
        return null;
      }

      return {
        tool: parsed.tool,
        args: (parsed.args as Record<string, unknown>) ?? {},
        reasoning: (parsed.reasoning as string) ?? '',
      };
    } catch (error) {
      this.logger.warn(`Failed to parse tool_call JSON: ${match[1]}`);
      return null;
    }
  }
}
