---
title: "Working with Models"
course: 1
module: 2
description: "Deploy and work with models in different contexts"
objectives:
  - "Deploy and work with models in different contexts"
  - "Make informed decisions: API vs hosted vs fine-tuned"
  - "Understand model selection criteria: cost, latency, capability trade-offs"
resources:
  - title: "Azure AI Foundry Documentation"
    url: "https://learn.microsoft.com/en-us/azure/ai-studio/"
    type: "docs"
  - title: "vLLM Documentation"
    url: "https://docs.vllm.ai/"
    type: "docs"
  - title: "Microsoft Phi-3 Models"
    url: "https://azure.microsoft.com/en-us/products/phi-3"
    type: "docs"
  - title: "Ollama"
    url: "https://ollama.ai/"
    type: "docs"
quiz:
  - question: "When should you consider fine-tuning a model?"
    options:
      - "For every new project"
      - "When base models don't perform well on your specific domain"
      - "To reduce API costs"
      - "To speed up inference"
    answer: 1
  - question: "What is a key advantage of self-hosted models?"
    options:
      - "Always faster than API models"
      - "Data privacy and control"
      - "Lower setup costs"
      - "Better accuracy"
    answer: 1
  - question: "What is a key consideration when choosing between API services and self-hosted models?"
    options:
      - "API services are always cheaper"
      - "Self-hosted models require no maintenance"
      - "Data privacy requirements and infrastructure capabilities"
      - "API services have unlimited throughput"
    answer: 2
---

## Prerequisites

Before starting this module, you'll need to clone the bootcamp application repository:

```bash
git clone https://github.com/propel-ventures/ai-bootcamp
cd ai-bootcamp/ai-bootcamp-app
```

Follow the setup instructions in the repository README to get the application running locally.

**Note:** The sample application code is written and geared towards Microsoft Foundry. The hands-on exercises will guide you through adapting it to work with AWS Bedrock and local model providers.

## Using Claude Code

If you're using [Claude Code](https://docs.anthropic.com/en/docs/claude-code) (Anthropic's CLI tool for Claude) to work through this module, you can use the `/prime-context` command to quickly get Claude up to speed with the bootcamp codebase.

### What is prime-context?

The `/prime-context` command reads the project's `CLAUDE.md` file and any additional documentation, giving Claude immediate understanding of:

- Project structure and architecture
- Available commands and how to run them
- Key files and their purposes
- Coding conventions and patterns used

### How to Use It

1. Open Claude Code in the bootcamp repository directory:

    ```bash
    cd ai-bootcamp/
    claude
    ```

2. Run the prime-context command:

    ```
    /prime-context
    ```

3. Claude will read the project documentation and be ready to assist with implementation tasks, debugging, and understanding the codebase.

### When to Use It

- **Starting a new session** - Prime context at the beginning of each Claude Code session
- **After cloning the repo** - Get oriented with the codebase quickly
- **Before implementing exercises** - Ensure Claude understands the existing patterns before you start coding

This is especially helpful for the hands-on exercises in this module, where you'll be configuring the bootcamp app to work with different model providers.

## Overview

Learn to work with models across different deployment contexts and make informed decisions about which approach fits your use case. This module covers API-based services and self-hosted options, helping you understand the trade-offs between cost, latency, privacy, and capability.

## Topics Covered

### 1. API-Based Services

API providers offer the fastest path to production with managed infrastructure, but come with cost and data privacy considerations.

#### Azure AI Foundry
Enterprise-grade access to multiple AI models (Claude, GPT, Llama) through Azure's unified platform.

**Key considerations:**
- Access to multiple model providers through a single Azure endpoint
- Enterprise authentication via Azure AD
- Regional data residency options
- Integrated with Azure's security and compliance features

#### Azure OpenAI
Direct access to OpenAI models with Azure's enterprise features.

**Key considerations:**
- Deployment-based model access (you deploy specific models to your Azure instance)
- Regional data residency options
- Enterprise authentication via Azure AD

#### AWS Bedrock
Access to multiple foundation models (Claude, Llama, Titan) through a unified AWS API.

**Key considerations:**
- Multi-model access through single service
- IAM-based authentication (no API keys to manage)
- Pay-per-token pricing with no upfront commitments

### 2. Self-Hosted Options

Self-hosting gives you complete control over data and costs, but requires infrastructure management.

#### vLLM (Production Self-Hosting)
High-performance inference server for production self-hosting with features like:
- PagedAttention for efficient memory management
- Continuous batching for high throughput
- OpenAI-compatible API

### 3. Small Language Models (SLMs)

When full LLM capability isn't needed, consider SLMs for cost and latency benefits:

| Model | Parameters | Best For |
|-------|-----------|----------|
| Phi-3 Mini | 3.8B | Reasoning, code generation |
| SmolLM2 | 135M-1.7B | Classification, extraction |
| Llama 3.2 | 1B-3B | General purpose, multilingual |

### 4. Model Selection Criteria

| Factor | API Services | Self-Hosted |
|--------|-------------|-------------|
| **Setup Time** | Minutes | Hours/Days |
| **Data Privacy** | Data leaves your network | Full control |
| **Cost Model** | Pay per token | Infrastructure costs |
| **Scaling** | Automatic | Manual |
| **Latency** | Network dependent | Can be optimized |

### 5. Fine-Tuning Considerations

Fine-tuning should be a last resort. Consider these alternatives first:
1. **Better prompting** - Often solves 80% of issues
2. **Few-shot examples** - Provide examples in context
3. **RAG** - Ground responses in your data

**When fine-tuning makes sense:**
- Domain-specific terminology the base model doesn't understand
- Consistent formatting requirements
- Task-specific behavior that prompting can't achieve

## Hands-On Exercise

### Configure Azure AI Foundry with Claude

Set up the bootcamp app to use Claude models via Azure AI Foundry:

1. Navigate to the [Azure AI Foundry Project](https://ai.azure.com/foundryProject/overview?wsid=/subscriptions/c648d4fd-1497-4f7d-94e0-915a3cf1b5ca/resourceGroups/rg-baz-dev/providers/Microsoft.CognitiveServices/accounts/az-open-ai-rg-baz-dev/projects/az-open-ai-rg-baz-dev-project&tid=a5053235-83cf-48d5-a03f-da1154fe4b2b) in the Propel Azure account

2. In the left navigation bar, click **Models + endpoints** to browse deployed models

3. Select the **claude-haiku-4-5** model from the list of deployed models

4. Copy the endpoint URL and API key from the model deployment page:
    - **API Key**: In the **Endpoint** section on the left, find the **Key** field and click the copy button
    - **Endpoint URL**: In the **Language** dropdown on the right, select **Python**, then find the `base_url` value in the code example under "Authentication using API Key" (e.g., `https://your-resource.services.ai.azure.com/anthropic/`)

5. Create a `.env` file in the bootcamp app's `backend/` directory with the following configuration:

    ```bash
    # Application
    APP_NAME=AI Bootcamp App
    DEBUG=false

    # Database
    DATABASE_URL=sqlite:///./app.db

    # CORS (comma-separated origins)
    CORS_ORIGINS=["http://localhost:5173","http://localhost:3000"]

    # Agent Framework Configuration
    # Provider: "anthropic" (direct API), "foundry" (Azure AI Foundry), or "azure_openai"
    AGENT__PROVIDER=foundry
    AGENT__AGENT_MODEL=claude-haiku-4-5
    AGENT__MAX_TOKENS=8192

    # Azure AI Foundry (works with hosted tools like HostedWebSearchTool)
    AGENT__FOUNDRY_API_KEY=your-foundry-api-key
    AGENT__FOUNDRY_ENDPOINT=https://your-endpoint.services.ai.azure.com/anthropic/

    # Alternative: Direct Anthropic API (full feature support including custom function tools)
    # AGENT__PROVIDER=anthropic
    # AGENT__API_KEY=your-anthropic-api-key

    # Alternative: Azure OpenAI for Agents
    # AGENT__PROVIDER=azure_openai
    # AGENT__AGENT_MODEL=gpt-5-mini
    # AGENT__AZURE_OPENAI_ENDPOINT=https://your-resource.cognitiveservices.azure.com/
    # AGENT__AZURE_OPENAI_API_KEY=your-api-key
    # AGENT__AZURE_OPENAI_DEPLOYMENT=gpt-5-mini
    # AGENT__AZURE_OPENAI_API_VERSION=2025-04-01-preview

    # Redis Settings (for memory)
    REDIS__HOST=localhost
    REDIS__PORT=6379
    REDIS__PASSWORD=
    REDIS__DB=0

    # Memory Settings
    MEMORY__THREAD_TTL_HOURS=24
    MEMORY__USER_TTL_DAYS=30
    MEMORY__MAX_THREAD_MESSAGES=50

    # Observability Configuration
    # Set OTEL_ENABLE_OTEL=true to enable tracing
    OTEL_ENABLE_OTEL=false
    OTEL_OTLP_ENDPOINT=http://localhost:4317
    OTEL_ENABLE_SENSITIVE_DATA=false
    OTEL_SERVICE_NAME=ai-bootcamp-backend
    OTEL_ENABLE_COST_TRACKING=true

    # Evaluation Configuration (DeepEval judge model)
    # By default, evals reuse AGENT__AZURE_OPENAI_* settings above.
    # Set EVAL__PROVIDER to use a dedicated judge model configuration.

    # Provider: "azure_openai" or "openai"
    # EVAL__PROVIDER=azure_openai

    # Judge model name (default: gpt-5-mini)
    # EVAL__MODEL=gpt-5-mini

    # Azure OpenAI for eval judge (if EVAL__PROVIDER=azure_openai)
    # EVAL__AZURE_ENDPOINT=https://your-resource.cognitiveservices.azure.com/
    # EVAL__AZURE_API_KEY=your-api-key
    # EVAL__AZURE_DEPLOYMENT=gpt-5-mini
    # EVAL__AZURE_API_VERSION=2025-04-01-preview

    # OpenAI for eval judge (if EVAL__PROVIDER=openai)
    # EVAL__OPENAI_API_KEY=your-openai-api-key

    # Model parameters (optional)
    # EVAL__TEMPERATURE=1.0  # Some models only support default temperature

    # PII Detection
    PII_ENABLED=true
    PII_LOG_ONLY=true
    PII_CONFIDENCE_THRESHOLD=0.7
    ```

6. Replace the placeholder values (`your-endpoint`, `your-foundry-api-key`, etc.) with the actual values from Azure AI Foundry

7. Start the application using Docker Compose:

    ```bash
    cd ai-bootcamp/ai-bootcamp-app
    docker-compose up
    ```

8. Test the configuration by making a request to the backend API, via the React UI at http://localhost:3000/

### Optional: Integrate Local Model Providers

The bootcamp app currently supports cloud providers (Azure AI Foundry, Azure OpenAI, Anthropic API). Adding local model support requires implementing new provider integrations.

**Note:** These exercises require submitting a Pull Request to the [ai-bootcamp repository](https://github.com/propel-ventures/ai-bootcamp) to add local model provider compatibility.

#### Option A: Ollama

1. Install Ollama from [ollama.ai](https://ollama.ai)
2. Pull a model: `ollama pull llama3.2` or `ollama pull phi3`
3. Start Ollama (provides an API at `http://localhost:11434`)
4. Implement Ollama provider support in the bootcamp app's agent framework
5. Test your implementation and compare response quality/latency with cloud models
6. Open a PR with your changes, including:
    - Implementation details
    - Configuration instructions
    - Screenshots or logs showing it working

#### Option B: LM Studio

1. Download and install [LM Studio](https://lmstudio.ai)
2. Download a model through the LM Studio UI (e.g., Phi-3 or Llama 3.2)
3. Start the local server (provides OpenAI-compatible API)
4. Implement LM Studio provider support in the bootcamp app's agent framework
5. Test your implementation and compare response quality/latency with cloud models
6. Open a PR with your changes, including:
    - Implementation details
    - Configuration instructions
    - Screenshots or logs showing it working

**Bonus Challenge:** Implement support for **both** local providers, then create a comparison script that measures response time and quality differences across cloud and local models.
