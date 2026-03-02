# SEO Agent

An agentic AI backend that analyzes websites and keywords, then produces SEO recommendations through tool-based reasoning. The agent runs entirely on local LLM inference via Ollama, so no external API keys are needed.

## Requirements

- Node.js 20+
- Ollama running locally (`ollama serve`)
- A pulled model, e.g. `ollama pull llama3`

## Stack

- NestJS 11, TypeScript
- Ollama (local LLM inference)
- Model Context Protocol (MCP)
- Jest for testing

## Features

- Autonomous agent loop with up to 10 reasoning iterations
- Extensible tool registry with MCP support for adding new tools
- Chat session management with full message history
- Local LLM inference through Ollama, no external API dependency
- RESTful API covering agent, chat, tools, and Ollama endpoints
- Structured step-by-step execution tracking per request

## Architecture

```
Agent Loop
    └── Tool Registry
            ├── MCP Providers     (external tool sources via MCP)
            └── Custom Tools      (built-in SEO analysis tools)
                    └── Ollama LLM (local inference)
```

The agent receives a user query, selects tools from the registry, calls them in sequence, and feeds results back into the LLM until it reaches a final answer or the iteration limit.

## Getting Started

```bash
npm install

# Start Ollama in a separate terminal
ollama serve

# Run in development mode
npm run start:dev
```

The API will be available at `http://localhost:3000`.

## API Overview

| Method | Endpoint         | Description                        |
|--------|------------------|------------------------------------|
| POST   | /agent/run       | Run the agent on a query           |
| POST   | /chat            | Send a message to a chat session   |
| GET    | /tools           | List available tools               |
| GET    | /ollama/models   | List locally available models      |

## Testing

```bash
npm run test
npm run test:e2e
```

## License

MIT
