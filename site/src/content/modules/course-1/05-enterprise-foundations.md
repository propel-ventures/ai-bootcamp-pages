---
title: "Enterprise Foundations"
course: 1
module: 5
description: "Test, debug, secure, and manage costs in production AI systems"
objectives:
  - "Implement distributed tracing for AI applications with OpenTelemetry"
  - "Visualise LLM traces and analyse token usage with Phoenix"
  - "Test and evaluate AI systems using structured frameworks"
  - "Implement security boundaries and PII protection"
  - "Manage costs in production with caching and monitoring"
resources:
  - title: "OpenTelemetry Documentation"
    url: "https://opentelemetry.io/docs/"
    type: "docs"
  - title: "Phoenix Observability"
    url: "https://docs.arize.com/phoenix"
    type: "docs"
  - title: "DeepEval Documentation"
    url: "https://docs.confident-ai.com/"
    type: "docs"
  - title: "Presidio PII Detection"
    url: "https://microsoft.github.io/presidio/"
    type: "docs"
quiz:
  - question: "What is the primary purpose of structured logging in AI systems?"
    options:
      - "Reduce log file size"
      - "Enable debugging and observability at scale"
      - "Comply with regulations"
      - "Speed up inference"
    answer: 1
  - question: "What is prompt injection?"
    options:
      - "A way to optimise prompts"
      - "Malicious input that manipulates AI behaviour"
      - "A caching technique"
      - "A model fine-tuning method"
    answer: 1
  - question: "When should OTEL_ENABLE_SENSITIVE_DATA be set to true?"
    options:
      - "Always in production for complete debugging"
      - "Only in development/debugging environments"
      - "When using token caching"
      - "When deploying to multiple regions"
    answer: 1
  - question: "What does Phoenix provide for LLM observability?"
    options:
      - "Only error logging"
      - "Trace visualization, token analytics, and latency metrics"
      - "Only cost estimation"
      - "Model fine-tuning interface"
    answer: 1
---

## Overview

Real-world AI deployment requires evaluation, security, and cost management. This module covers the complete observability stack for production AI systems—from distributed tracing to security boundaries.

---

## Evaluation & Observability

Production AI systems need visibility into every layer: HTTP requests, agent invocations, LLM calls, and tool executions. Without proper observability, debugging becomes guesswork.

### OpenTelemetry Architecture

The observability stack uses **OpenTelemetry (OTel)** as the instrumentation standard with **Phoenix** as the visualization backend:

```
┌─────────────────────────────────────────────────────────────┐
│                    FastAPI Application                       │
│                                                              │
│  ┌────────────────────┐    ┌─────────────────────────────┐  │
│  │  FastAPI           │    │   Agent Framework           │  │
│  │  Instrumentor      │    │   Observability             │  │
│  │                    │    │                             │  │
│  │  - HTTP spans      │    │   - LLM invocation spans    │  │
│  │  - Route attrs     │    │   - Token usage metrics     │  │
│  │  - Status codes    │    │   - Tool execution traces   │  │
│  └────────────────────┘    └─────────────────────────────┘  │
└──────────────────────────────┬──────────────────────────────┘
                               │ OTLP gRPC (port 4317)
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                         Phoenix                              │
│  - Trace Viewer    - LLM Dashboard    - Token Analytics     │
│  - Span hierarchy  - Model usage      - Cost estimation     │
│  - Latency         - Prompt replay    - Usage trends        │
└─────────────────────────────────────────────────────────────┘
```

### Configuration with Pydantic Settings

Observability is controlled via environment variables with the `OTEL_` prefix:

```python
from pydantic_settings import BaseSettings, SettingsConfigDict

class ObservabilitySettings(BaseSettings):
    """Settings for OpenTelemetry observability."""

    enable_otel: bool = False              # Master switch
    otlp_endpoint: str | None = None       # OTLP collector endpoint
    enable_sensitive_data: bool = False    # Capture prompts/responses
    service_name: str = "ai-bootcamp-backend"

    model_config = SettingsConfigDict(env_prefix="OTEL_")
```

Environment variables:

```bash
OTEL_ENABLE_OTEL=true
OTEL_OTLP_ENDPOINT=http://localhost:4317
OTEL_ENABLE_SENSITIVE_DATA=false  # Set true only in dev!
OTEL_SERVICE_NAME=my-ai-service
```

### Two-Layer Instrumentation

Production systems need instrumentation at multiple layers:

```python
def setup_app_observability() -> None:
    """Initialise observability for the application."""
    settings = ObservabilitySettings()

    if not settings.enable_otel:
        logger.info("Observability disabled")
        return

    # Layer 1: Agent Framework (GenAI-specific traces)
    from agent_framework.observability import setup_observability
    setup_observability(
        otlp_endpoint=settings.otlp_endpoint,
        enable_sensitive_data=settings.enable_sensitive_data,
    )

    # Layer 2: FastAPI HTTP instrumentation
    from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor
    FastAPIInstrumentor().instrument()

    logger.info("Observability enabled")
```

### Trace Hierarchy

A typical request creates nested spans that show the full execution path:

```
HTTP Request (FastAPI Instrumentation)
└── Span: "POST /api/v1/chat"
    └── http.method: POST, http.status_code: 200
        └── Agent Invocation
            └── Span: "invoke_agent ChatAgent"
                ├── gen_ai.operation.name: invoke_agent
                └── Chat Completion
                    └── Span: "chat anthropic"
                        ├── gen_ai.request.model: claude-haiku-4-5
                        ├── gen_ai.usage.input_tokens: 150
                        ├── gen_ai.usage.output_tokens: 89
                        └── Tool Execution (if any)
                            └── Span: "execute_tool web_search"
```

### Metrics Captured

| Metric | Description | Use Case |
|--------|-------------|----------|
| `gen_ai.client.token.usage` | Input/output tokens per request | Cost tracking |
| `gen_ai.client.operation.duration` | Time per LLM call | Latency monitoring |
| `http.server.duration` | HTTP request latency | API performance |

### Sensitive Data Handling

**Critical for production:** Control what gets captured in traces.

When `OTEL_ENABLE_SENSITIVE_DATA=true`:
- Full prompt text captured in spans
- Complete response content recorded
- **Warning:** Should be `false` in production to protect PII

```python
# Production checklist
assert settings.enable_sensitive_data is False, "PII protection!"
```

### Running Phoenix Locally

**Docker Compose (recommended):**

```yaml
services:
  phoenix:
    image: arizephoenix/phoenix:latest
    ports:
      - "6006:6006"   # UI
      - "4317:4317"   # OTLP gRPC collector
```

**Manual setup:**

```bash
# Start Phoenix
docker run -d --name phoenix -p 6006:6006 -p 4317:4317 \
  arizephoenix/phoenix:latest

# View traces at http://localhost:6006
```

### Testing Observability

Test that your configuration works correctly:

```python
def test_observability_settings_from_env():
    """Test settings loaded from environment variables."""
    env = {
        "OTEL_ENABLE_OTEL": "true",
        "OTEL_OTLP_ENDPOINT": "http://localhost:4317",
        "OTEL_ENABLE_SENSITIVE_DATA": "false",
    }

    with patch.dict(os.environ, env, clear=True):
        settings = ObservabilitySettings()

        assert settings.enable_otel is True
        assert settings.otlp_endpoint == "http://localhost:4317"
        assert settings.enable_sensitive_data is False
```

---

## Security
- Prompt injection detection
- MCP-Scan for tool permissions
- Presidio for PII handling
- Toxic flow analysis

### Cost Management
- Token economics
- LMCache and LiteLLM caching
- Usage monitoring

### Enterprise vs Greenfield
- Legacy integration
- Compliance gates
- Iteration cycles
