---
title: "Working with Models"
course: 1
module: 2
description: "Deploy and work with models in different contexts"
objectives:
  - "Deploy and work with models in different contexts"
  - "Make informed decisions: API vs hosted vs fine-tuned"
  - "Implement a unified provider abstraction for multiple AI services"
  - "Configure and switch between cloud and local model providers"
resources:
  - title: "Azure OpenAI Documentation"
    url: "https://learn.microsoft.com/en-us/azure/ai-services/openai/"
    type: "docs"
  - title: "AWS Bedrock Documentation"
    url: "https://docs.aws.amazon.com/bedrock/"
    type: "docs"
  - title: "vLLM Documentation"
    url: "https://docs.vllm.ai/"
    type: "docs"
  - title: "Bootcamp App - AI Providers"
    url: "https://github.com/propel-ventures/ai-bootcamp/tree/main/ai-bootcamp-app/backend/app/ai"
    type: "repo"
  - title: "Microsoft Phi-3 Models"
    url: "https://azure.microsoft.com/en-us/products/phi-3"
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
  - question: "What design pattern is used in the bootcamp app to support multiple AI providers?"
    options:
      - "Singleton pattern"
      - "Factory pattern with Protocol-based abstraction"
      - "Observer pattern"
      - "Decorator pattern"
    answer: 1
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

This is especially helpful for the hands-on exercises in this module, where you'll be implementing new providers that need to follow existing architectural patterns.

## Overview

Learn to work with models across different deployment contexts and make informed decisions about which approach fits your use case. This module covers API-based services, self-hosted options, and the architectural patterns for building provider-agnostic AI applications.

## Codebase Reference

The bootcamp application demonstrates these concepts with a working implementation:

- **[AI Provider Factory](https://github.com/propel-ventures/ai-bootcamp/blob/main/ai-bootcamp-app/backend/app/ai/factory.py)** - Creates the appropriate provider based on configuration
- **[Provider Protocol](https://github.com/propel-ventures/ai-bootcamp/blob/main/ai-bootcamp-app/backend/app/ai/protocol.py)** - Defines the unified interface all providers implement
- **[Configuration](https://github.com/propel-ventures/ai-bootcamp/blob/main/ai-bootcamp-app/backend/app/ai/config.py)** - Environment-based provider configuration

## Topics Covered

### 1. API-Based Services

API providers offer the fastest path to production with managed infrastructure, but come with cost and data privacy considerations.

#### Azure OpenAI
Enterprise-grade OpenAI models with Azure's security and compliance features.

```python
# From ai-bootcamp-app/backend/app/ai/providers/azure_openai.py
class AzureOpenAIProvider:
    def __init__(self, endpoint: str, api_key: str, deployment: str, api_version: str):
        self._client = AzureOpenAI(
            azure_endpoint=endpoint.rstrip("/"),
            api_key=api_key,
            api_version=api_version,
        )
```

**Key considerations:**
- Deployment-based model access (you deploy specific models to your Azure instance)
- Regional data residency options
- Enterprise authentication via Azure AD

📁 **See implementation:** [azure_openai.py](https://github.com/propel-ventures/ai-bootcamp/blob/main/ai-bootcamp-app/backend/app/ai/providers/azure_openai.py)

#### AWS Bedrock
Access to multiple foundation models (Claude, Llama, Titan) through a unified AWS API.

```python
# From ai-bootcamp-app/backend/app/ai/providers/bedrock.py
class BedrockProvider:
    def __init__(self, region: str, model: str, ...):
        self._client = boto3.client("bedrock-runtime", region_name=region)
```

**Key considerations:**
- Multi-model access through single service
- IAM-based authentication (no API keys to manage)
- Pay-per-token pricing with no upfront commitments

📁 **See implementation:** [bedrock.py](https://github.com/propel-ventures/ai-bootcamp/blob/main/ai-bootcamp-app/backend/app/ai/providers/bedrock.py)

### 2. Self-Hosted Options

Self-hosting gives you complete control over data and costs, but requires infrastructure management.

#### vLLM (Production Self-Hosting)
High-performance inference server for production self-hosting with features like:
- PagedAttention for efficient memory management
- Continuous batching for high throughput
- OpenAI-compatible API

### 3. Provider Abstraction Pattern

The bootcamp app demonstrates a clean architecture for supporting multiple providers:

#### Protocol Definition
```python
# From ai-bootcamp-app/backend/app/ai/protocol.py
class AIProvider(Protocol):
    """Unified interface for all AI providers."""

    async def chat(self, messages: list[Message], *, max_tokens: int, temperature: float) -> ChatResponse:
        ...

    async def chat_stream(self, messages: list[Message], ...) -> AsyncIterator[str]:
        ...
```

#### Factory Pattern
```python
# From ai-bootcamp-app/backend/app/ai/factory.py
def create_ai_provider(settings: AISettings) -> AIProvider:
    match settings.provider:
        case AIProviderType.AZURE_OPENAI:
            return AzureOpenAIProvider(...)
        case AIProviderType.BEDROCK:
            return BedrockProvider(...)
        # Additional providers can be added here
```

📁 **See full implementation:** [factory.py](https://github.com/propel-ventures/ai-bootcamp/blob/main/ai-bootcamp-app/backend/app/ai/factory.py)

### 4. Configuration Management

Use environment variables to switch providers without code changes:

```bash
# Azure OpenAI
AI__PROVIDER=azure_openai
AI__AZURE_OPENAI_ENDPOINT=https://your-instance.openai.azure.com
AI__AZURE_OPENAI_API_KEY=your-key
AI__AZURE_OPENAI_DEPLOYMENT=gpt-4

# AWS Bedrock
AI__PROVIDER=bedrock
AI__MODEL=anthropic.claude-3-sonnet-20240229-v1:0
AI__AWS_REGION=us-east-1
```

📁 **See configuration:** [config.py](https://github.com/propel-ventures/ai-bootcamp/blob/main/ai-bootcamp-app/backend/app/ai/config.py)

### 5. Small Language Models (SLMs)

When full LLM capability isn't needed, consider SLMs for cost and latency benefits:

| Model | Parameters | Best For |
|-------|-----------|----------|
| Phi-3 Mini | 3.8B | Reasoning, code generation |
| SmolLM2 | 135M-1.7B | Classification, extraction |
| Llama 3.2 | 1B-3B | General purpose, multilingual |

### 6. Model Selection Criteria

| Factor | API Services | Self-Hosted |
|--------|-------------|-------------|
| **Setup Time** | Minutes | Hours/Days |
| **Data Privacy** | Data leaves your network | Full control |
| **Cost Model** | Pay per token | Infrastructure costs |
| **Scaling** | Automatic | Manual |
| **Latency** | Network dependent | Can be optimized |

### 7. Fine-Tuning Considerations

Fine-tuning should be a last resort. Consider these alternatives first:
1. **Better prompting** - Often solves 80% of issues
2. **Few-shot examples** - Provide examples in context
3. **RAG** - Ground responses in your data

**When fine-tuning makes sense:**
- Domain-specific terminology the base model doesn't understand
- Consistent formatting requirements
- Task-specific behavior that prompting can't achieve

## Hands-On Exercise

### Part 1: Configure Azure AI Foundry with Claude

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

    # AI Provider Configuration
    # Options: ollama, azure_anthropic, azure_openai, bedrock
    AI__PROVIDER=ollama
    AI__MODEL=llama3.2

    # Ollama (default - local)
    AI__OLLAMA_BASE_URL=http://localhost:11434

    # Azure AI Foundry (uncomment to use)
    # AI__PROVIDER=azure_anthropic
    # AI__MODEL=claude-haiku-4-5
    # AI__AZURE_ENDPOINT=https://your-endpoint.services.ai.azure.com/anthropic/
    # AI__AZURE_API_KEY=your-api-key

    # Azure OpenAI (uncomment to use)
    # AI__PROVIDER=azure_openai
    # AI__MODEL=gpt-5-mini
    # AI__AZURE_OPENAI_ENDPOINT=https://your-resource.cognitiveservices.azure.com/
    # AI__AZURE_OPENAI_API_KEY=your-api-key
    # AI__AZURE_OPENAI_DEPLOYMENT=gpt-5-mini
    # AI__AZURE_OPENAI_API_VERSION=2025-04-01-preview

    # AWS Bedrock (uncomment to use)
    # AI__PROVIDER=bedrock
    # AI__MODEL=anthropic.claude-3-haiku-20240307-v1:0
    # AI__AWS_REGION=us-east-1
    # AI__AWS_ACCESS_KEY_ID=your-access-key
    # AI__AWS_SECRET_ACCESS_KEY=your-secret-key

    # Agent Framework Configuration
    # Provider: "anthropic" (direct API), "foundry" (Azure AI Foundry), or "azure_openai"
    AGENT__PROVIDER=foundry
    AGENT__AGENT_MODEL=claude-haiku-4-5
    AGENT__MAX_TOKENS=8192

    # Direct Anthropic API (full feature support including custom function tools)
    # AGENT__PROVIDER=anthropic
    # AGENT__API_KEY=your-anthropic-api-key

    # Azure AI Foundry (works with hosted tools like HostedWebSearchTool)
    AGENT__FOUNDRY_API_KEY=your-foundry-api-key
    AGENT__FOUNDRY_ENDPOINT=https://your-endpoint.services.ai.azure.com/anthropic

    # Azure OpenAI for Agents (uncomment to use)
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

6. Replace the placeholder values (`your-endpoint`, `your-api-key`, etc.) with the actual values from Azure AI Foundry

7. Start the application using Docker Compose:

    ```bash
    cd ai-bootcamp/ai-bootcamp-app
    docker-compose up
    ```

8. Test the configuration by making a request to the backend API, via the React UI at http://localhost:3000/

### Part 2: Deploy a Cloud Model Provider (AWS Bedrock)

Integrate AWS Bedrock with the bootcamp app:

#### AWS Bedrock

1. Log into AWS Console and navigate to Amazon Bedrock
2. Request access to a foundation model (e.g., Claude 3 Sonnet or Claude 3.5 Sonnet)
3. Wait for model access approval (usually takes a few minutes)
4. Configure your AWS credentials locally (using AWS CLI or environment variables)
5. Update the bootcamp app's `.env` file with Bedrock configuration:

    ```bash
    AI__PROVIDER=bedrock
    AI__MODEL=anthropic.claude-3-5-sonnet-20241022-v2:0
    AI__AWS_REGION=us-east-1
    ```

6. Test the integration by running the app and making a request

### Part 3: Set Up Local Model Provider

Experiment with running models locally using one of these tools:

#### Option A: Ollama

1. Install Ollama from [ollama.ai](https://ollama.ai)
2. Pull a model: `ollama pull llama3.2` or `ollama pull phi3`
3. Implement an Ollama provider in the bootcamp app by:

    - Creating a new provider class in `backend/app/ai/providers/ollama.py`
    - Following the `AIProvider` Protocol pattern
    - Using Ollama's HTTP API (default: `http://localhost:11434`)

4. Update the factory to support the new provider
5. Test your implementation

#### Option B: LM Studio

1. Download and install [LM Studio](https://lmstudio.ai)
2. Download a model through the LM Studio UI (e.g., Phi-3 or Llama 3.2)
3. Start the local server (provides OpenAI-compatible API)
4. Implement an LM Studio provider or adapt the OpenAI provider to point to localhost
5. Test your implementation

### Part 4: Open a Pull Request

After successfully integrating a new provider:

1. Create a new branch in your forked bootcamp repository
2. Commit your changes with clear commit messages
3. Push your branch and open a Pull Request to the main repository
4. In your PR description, include:

    - Which provider you implemented
    - Configuration instructions
    - Screenshots or logs showing it working
    - Any challenges you encountered

**Bonus Challenge:** Implement support for **both** a cloud provider and a local provider, then create a comparison script that measures response time and quality differences.
