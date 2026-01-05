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
    cd ai-bootcamp/ai-bootcamp-app
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

### Part 1: Deploy a Cloud Model Provider

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

### Part 2: Set Up Local Model Provider

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

### Part 3: Open a Pull Request

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
