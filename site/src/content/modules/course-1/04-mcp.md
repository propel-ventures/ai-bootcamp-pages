---
title: "MCP (Model Context Protocol)"
course: 1
module: 4
description: "Understand MCP architecture and create custom servers with write operations"
objectives:
  - "Understand MCP architecture and security model"
  - "Create custom MCP servers with write operations"
  - "Implement safe action boundaries"
resources:
  - title: "MCP Specification"
    url: "https://modelcontextprotocol.io/"
    type: "docs"
  - title: "MCP TypeScript SDK"
    url: "https://github.com/modelcontextprotocol/typescript-sdk"
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
---

## Overview

MCP enables AI systems to interact with external tools and data sources in a standardized way.

## Topics Covered

### MCP Fundamentals
- Architecture overview
- Protocol specification

### Transport Layers
- HTTP and SSE for web
- STDIO for local tools
- Streamable HTTP transport
- Production trade-offs

### Custom MCP Servers
- Read operations
- Write operations with safety
- Error handling

### Security
- Permission models
- Action boundaries
- Progressive tool exposure
