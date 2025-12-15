---
title: "MCP (Model Context Protocol)"
course: 1
module: 4
description: "Understand MCP architecture and create custom servers with write operations"
objectives:
  - "Understand MCP architecture and security model"
  - "Create custom MCP servers with write operations"
  - "Implement safe action boundaries"
  - "Configure MCP servers with Claude Desktop"
resources:
  - title: "MCP Specification"
    url: "https://modelcontextprotocol.io/"
    type: "docs"
  - title: "MCP TypeScript SDK"
    url: "https://github.com/modelcontextprotocol/typescript-sdk"
    type: "repo"
  - title: "MCP Python SDK"
    url: "https://github.com/modelcontextprotocol/python-sdk"
    type: "repo"
  - title: "Crypto Wallet MCP Server (Bootcamp)"
    url: "https://github.com/propel-ventures/ai-bootcamp/tree/main/mcp-servers/crypto-wallet"
    type: "repo"
quiz:
  - question: "What transport layer is recommended for production MCP servers?"
    options:
      - "STDIO only"
      - "HTTP with SSE for streaming"
      - "WebSockets"
      - "gRPC"
    answer: 1
  - question: "Why should you avoid naive API-to-MCP conversion?"
    options:
      - "It's too slow"
      - "Security boundaries and permissions need careful design"
      - "MCP doesn't support REST"
      - "APIs are deprecated"
    answer: 1
  - question: "In progressive tool exposure, which operations should be exposed first?"
    options:
      - "Write operations that modify external systems"
      - "Read-only operations with no side effects"
      - "All operations at once for convenience"
      - "High-risk operations to test security"
    answer: 1
  - question: "What is the purpose of the @mcp.tool() decorator in FastMCP?"
    options:
      - "To mark functions as private"
      - "To register functions as MCP tools with automatic protocol handling"
      - "To add logging to functions"
      - "To make functions async"
    answer: 1
---

## Overview

MCP (Model Context Protocol) enables AI systems to interact with external tools and data sources in a standardised way. It provides a common protocol for connecting AI models to the world beyond their training data.

## What is MCP?

MCP is an open protocol that standardises how AI applications connect to external data sources and tools. Think of it as a universal adapter that allows any AI model to safely interact with any compatible service.

```
┌─────────────────────────────────────────────────────────────────┐
│                        MCP Client                               │
│              (Claude Desktop / AI Agent)                        │
└─────────────────────────┬───────────────────────────────────────┘
                          │
                          │ MCP Protocol (JSON-RPC 2.0)
                          │
              ┌───────────┴───────────┐
              │                       │
              ▼                       ▼
┌─────────────────────┐   ┌─────────────────────┐
│   stdio transport   │   │   HTTP transport    │
│  (Claude Desktop)   │   │  (streamable-http)  │
└─────────┬───────────┘   └─────────┬───────────┘
          │                         │
          └───────────┬─────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                     MCP Server                                  │
│              (Your custom tools & data)                         │
└─────────────────────────────────────────────────────────────────┘
```

### Key Concepts

- **MCP Client**: The AI application (like Claude Desktop) that consumes tools
- **MCP Server**: Your application that exposes tools to the AI
- **Tools**: Functions the AI can call to perform actions
- **Resources**: Data sources the AI can read from
- **Prompts**: Pre-defined prompt templates

### Why MCP Matters: Write Once, Use Everywhere

Before MCP, integrating tools with AI applications required custom implementations for each platform. If you wanted your database tool to work with Claude, GPT, and other AI systems, you'd need to write and maintain separate integrations for each.

MCP changes this fundamentally:

```
                    Without MCP                              With MCP

┌──────────┐    ┌─────────────────┐           ┌──────────┐
│  Claude  │────│ Custom Plugin A │           │  Claude  │
└──────────┘    └─────────────────┘           └────┬─────┘
                                                   │
┌──────────┐    ┌─────────────────┐           ┌────┴─────┐    ┌────────────┐
│   GPT    │────│ Custom Plugin B │           │   MCP    │────│  Your Tool │
└──────────┘    └─────────────────┘           │ Protocol │    │  (written  │
                                              └────┬─────┘    │   once)    │
┌──────────┐    ┌─────────────────┐           ┌────┴─────┐    └────────────┘
│  Other   │────│ Custom Plugin C │           │  Other   │
│   AI     │    └─────────────────┘           │   AI     │
└──────────┘                                  └──────────┘

   3 separate implementations                 1 implementation, many clients
```

**The power of MCP:**

1. **Build once, deploy everywhere** - Write your MCP server once, and any MCP-compatible AI client can use it immediately
2. **No vendor lock-in** - Your tools work across different AI platforms without modification
3. **Ecosystem leverage** - Use community-built MCP servers instantly, or share your own
4. **Reduced maintenance** - One codebase to maintain instead of multiple platform-specific integrations
5. **Future-proof** - New AI applications that adopt MCP automatically gain access to your tools

This is similar to how USB standardised hardware connections - before USB, every device needed its own proprietary cable and driver. MCP aims to be the "USB for AI tools".

## Transport Layers

MCP supports multiple transport mechanisms for different use cases:

| Transport | Use Case | When to Use |
|-----------|----------|-------------|
| **stdio** | Claude Desktop integration | Local desktop apps where client spawns server process |
| **streamable-http** | Standalone server / API access | Production deployments, remote servers |

**stdio** is ideal for local desktop integration - the client launches the server as a subprocess and communicates via standard input/output.

**HTTP** (specifically streamable-http) is better for production deployments where the server runs independently and may serve multiple clients.

## Building MCP Servers with FastMCP

The Python SDK provides `FastMCP`, a high-level framework for building MCP servers quickly:

```python
from mcp.server.fastmcp import FastMCP

mcp = FastMCP(
    "my-server",
    instructions="Description of what this server does",
    host="0.0.0.0",
    port=8000,
)

@mcp.tool()
def my_tool(param: str) -> str:
    """Tool description shown to the AI."""
    return f"Result: {param}"

if __name__ == "__main__":
    mcp.run(transport="stdio")  # or "streamable-http"
```

### Key Features

- **Decorator-based tool registration**: Use `@mcp.tool()` to expose functions
- **Automatic JSON-RPC handling**: Protocol details are handled for you
- **Type annotations**: Use Python type hints for parameter descriptions
- **Built-in transport support**: Switch between stdio and HTTP easily

## Progressive Tool Exposure

A critical security pattern in MCP is **progressive tool exposure** - organising tools by risk level and exposing them incrementally.

### The Three-Level Model

```
┌─────────────────────────────────────────────────────────────┐
│                    Tool Registry                            │
│                                                             │
│  Level 1 (Read-Only)    Level 2 (Trading)   Level 3 (Send) │
│  ├─ get_wallet_address  ├─ buy_crypto       └─ send_crypto │
│  ├─ get_balance         └─ sell_crypto                     │
│  ├─ get_transactions                                        │
│  └─ get_prices                                              │
└─────────────────────────────────────────────────────────────┘
```

#### Level 1: Read-Only (Safe)
- No side effects
- Can be called freely without risk
- Examples: get balance, list transactions, fetch prices

#### Level 2: Moderate Risk
- Modify internal state
- Keep resources within the system
- Examples: buy/sell crypto (funds stay in wallet)

#### Level 3: High Risk
- Irreversible external actions
- Can result in permanent changes
- Examples: send funds to external address, delete data

### Why This Matters

Progressive exposure allows you to:
1. **Start safe**: Give AI access to read-only tools first
2. **Build trust**: Gradually enable more powerful operations
3. **Limit blast radius**: High-risk tools require explicit enablement
4. **Audit easily**: Clear separation of concerns for security review

## Security Boundaries

When building MCP servers, implement these security patterns:

### 1. Input Validation
Always validate parameters before execution:

```python
@mcp.tool()
def buy_crypto(currency: str, amount: float) -> dict:
    currency = currency.upper()

    if currency not in ["ETH", "BTC"]:
        return {"error": f"Unsupported currency: {currency}"}

    if amount <= 0:
        return {"error": "Amount must be positive"}

    # ... proceed with operation
```

### 2. Balance/Permission Checks
Verify resources exist before operations:

```python
if wallet_state["balances"]["USDC"] < cost:
    return {
        "error": f"Insufficient balance. Need {cost}, have {balance}"
    }
```

### 3. Clear Warnings for High-Risk Operations
Include explicit warnings in responses:

```python
return {
    "success": True,
    "transaction": tx,
    "warning": "Funds have been sent. This action cannot be reversed.",
}
```

### 4. Separation of Concerns
Keep read and write operations clearly separated in your code structure.

## Practical Example: Crypto Wallet MCP Server

The bootcamp includes a mock crypto wallet MCP server that demonstrates all these concepts. It simulates a cryptocurrency wallet with:

- **7 tools** across 3 security levels
- **Both transport modes** (stdio and HTTP)
- **In-memory state** for balances and transactions
- **Security boundaries** with validation and warnings

### Available Tools

| Tool | Level | Description |
|------|-------|-------------|
| `get_wallet_address` | 1 | Get wallet's public address |
| `get_balance` | 1 | Query balance for one or all currencies |
| `get_transactions` | 1 | List recent transaction history |
| `get_prices` | 1 | Get current crypto prices in USDC |
| `buy_crypto` | 2 | Purchase ETH/BTC using USDC |
| `sell_crypto` | 2 | Sell ETH/BTC for USDC |
| `send_crypto` | 3 | Transfer funds to external address |

### Initial Wallet State

The mock wallet starts with:
- **Address**: `0x742d35Cc6634C0532925a3b844Bc454e4438f44e`
- **Balances**: 2.5 ETH, 0.15 BTC, 10,000 USDC
- **Prices**: ETH @ $2,500, BTC @ $45,000

---

## Hands-On Exercise: Connect the Crypto Wallet to Claude Desktop

### Prerequisites

- Docker installed and running
- Claude Desktop installed

### Step 1: Clone the Repository

```bash
git clone https://github.com/propel-ventures/ai-bootcamp.git
cd ai-bootcamp/mcp-servers/crypto-wallet
```

### Step 2: Build the Docker Image

```bash
docker build -t crypto-wallet-mcp .
```

### Step 3: Configure Claude Desktop

Open your Claude Desktop configuration file:

**macOS:**
```bash
code ~/Library/Application\ Support/Claude/claude_desktop_config.json
```

**Windows:**
```bash
code %APPDATA%\Claude\claude_desktop_config.json
```

Add the crypto wallet server configuration:

```json
{
  "mcpServers": {
    "crypto-wallet": {
      "command": "docker",
      "args": ["run", "-i", "--rm", "crypto-wallet-mcp", "python", "server.py", "--stdio"]
    }
  }
}
```

> **Note**: If you have existing MCP servers configured, add the `crypto-wallet` entry to your existing `mcpServers` object.

### Step 4: Restart Claude Desktop

Completely quit and restart Claude Desktop for the configuration to take effect.

### Step 5: Verify the Connection

Look for the hammer (🔨) icon in the Claude Desktop interface - this indicates MCP tools are available.

Try these prompts to test the connection:

1. **"What's my wallet balance?"** - Tests `get_balance`
2. **"Show me my recent transactions"** - Tests `get_transactions`
3. **"What are the current crypto prices?"** - Tests `get_prices`
4. **"Buy 0.5 ETH"** - Tests `buy_crypto` (Level 2)
5. **"Send 0.1 ETH to 0xabc123def456..."** - Tests `send_crypto` (Level 3)

### What to Observe

1. **Tool Discovery**: Claude automatically discovers available tools
2. **Parameter Handling**: Claude extracts parameters from natural language
3. **Error Handling**: Try invalid operations (e.g., "buy 1000 BTC") to see validation
4. **Progressive Exposure**: Note which tools Claude uses for different requests
5. **State Persistence**: Balances update after trades (within the same session)

### Testing the HTTP Transport (Optional)

You can also run the server in HTTP mode for direct API testing:

```bash
docker run -p 8002:8002 crypto-wallet-mcp
```

Then test with curl:

```bash
# Health check
curl http://localhost:8002/health

# List available tools
curl -X POST http://localhost:8002/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"tools/list","id":1}'
```

---

## Key Takeaways

1. **MCP standardises AI-tool integration** - One protocol for many tools
2. **Choose transport wisely** - stdio for desktop, HTTP for production
3. **Progressive exposure is essential** - Start with read-only, add write carefully
4. **Security is built-in** - Validate inputs, check permissions, warn on risks
5. **FastMCP makes it easy** - Decorators handle protocol complexity
