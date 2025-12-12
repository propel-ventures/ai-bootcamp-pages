---
title: "Context Engineering & RAG"
course: 1
module: 3
description: "Build production-ready RAG pipelines and implement progressive context strategies"
objectives:
  - "Build production-ready RAG pipelines"
  - "Implement progressive context strategies"
  - "Balance traditional RAG with context engineering"
  - "Understand memory types and when to use them vs RAG"
resources:
  - title: "LangChain RAG Tutorial"
    url: "https://python.langchain.com/docs/tutorials/rag/"
    type: "docs"
  - title: "Docling Documentation"
    url: "https://ds4sd.github.io/docling/"
    type: "docs"
  - title: "Bootcamp App - Memory Module"
    url: "https://github.com/propel-ventures/ai-bootcamp/tree/main/ai-bootcamp-app/backend/app/memory"
    type: "repo"
  - title: "Memory Architecture Documentation"
    url: "https://github.com/propel-ventures/ai-bootcamp/blob/main/ai-bootcamp-app/docs/arch/memory.md"
    type: "docs"
quiz:
  - question: "What is progressive context?"
    options:
      - "Loading all context at once"
      - "Gradually adding context as needed to avoid overload"
      - "Using only the most recent context"
      - "Compressing context to fit more"
    answer: 1
  - question: "What is a key benefit of structured output patterns?"
    options:
      - "Faster generation"
      - "Reliable parsing and type safety"
      - "Smaller context windows"
      - "Better embeddings"
    answer: 1
  - question: "When should you use memory instead of RAG?"
    options:
      - "When you need to search a large document corpus"
      - "When you need conversation continuity and user personalization"
      - "When you need real-time data from external APIs"
      - "When you need to reduce token usage"
    answer: 1
  - question: "What is the difference between thread memory and user preferences?"
    options:
      - "Thread memory is faster"
      - "Thread memory is conversation-scoped and short-lived; user preferences persist across conversations"
      - "User preferences use more storage"
      - "There is no difference"
    answer: 1
---

## Overview

Context engineering is a core skill for production AI systems - managing what the AI knows and when. This module covers how to provide relevant information to AI models through RAG pipelines, progressive context loading, structured outputs, and conversation memory.

## Codebase Reference

The bootcamp application demonstrates memory concepts with a working implementation:

- **[Thread Memory Provider](https://github.com/propel-ventures/ai-bootcamp/blob/main/ai-bootcamp-app/backend/app/memory/thread_provider.py)** - Manages conversation history per thread
- **[User Preferences Provider](https://github.com/propel-ventures/ai-bootcamp/blob/main/ai-bootcamp-app/backend/app/memory/user_provider.py)** - Stores long-term user facts
- **[Memory Configuration](https://github.com/propel-ventures/ai-bootcamp/blob/main/ai-bootcamp-app/backend/app/memory/config.py)** - Redis and TTL settings

## Topics Covered

### 1. Traditional RAG Pipelines

RAG (Retrieval-Augmented Generation) grounds model responses in your data by retrieving relevant documents at query time.

**Core components:**
- **Vector stores** - Embed and index documents for semantic search
- **Embeddings** - Convert text to vectors for similarity matching
- **Retrieval strategies** - Top-k, MMR, hybrid search

**Scaling considerations:**
- S3-backed vector stores for large corpora
- Chunking strategies for long documents
- Re-ranking for improved relevance

### 2. Progressive Context

Loading all context upfront wastes tokens and can overwhelm the model. Progressive context strategies load information as needed.

**Techniques:**
- **On-demand retrieval** - Fetch context only when relevant
- **Tool flooding prevention** - Limit available tools based on task
- **Lazy loading** - Start minimal, expand as conversation develops

| Approach | When to Use |
|----------|-------------|
| Pre-built RAG | Known document corpus, predictable queries |
| On-the-fly RAG | Dynamic sources, exploratory queries |
| Progressive | Long conversations, multiple topics |

### 3. Structured Output

Constrain model outputs to match expected schemas for reliable parsing.

**Libraries:**
- **Pydantic AI** - Type-safe responses with validation
- **Instructor** - Structured extraction with retries
- **Outlines** - Grammar-constrained generation

### 4. Memory Management

Memory gives agents the ability to maintain context across interactions, transforming stateless request-response systems into contextual assistants.

#### Why Memory Matters

Without memory, every agent interaction starts fresh:
- Users must repeat context ("As I mentioned earlier...")
- Agents cannot learn user preferences
- Multi-turn conversations lose coherence
- Personalization is impossible

#### Memory vs RAG: When to Use Each

| Use Case | Solution | Why |
|----------|----------|-----|
| Search documents/knowledge base | RAG | Large corpus, semantic search |
| Remember conversation history | Memory | Sequential, time-ordered |
| User preferences/facts | Memory | Personal, long-lived |
| Real-time external data | Tools/APIs | Dynamic, external source |

**Key insight**: RAG retrieves *relevant* information; memory retrieves *recent* or *personal* information.

#### Types of Memory

**Thread Memory (Short-term)**

Scoped to a single conversation, stores message history in sequence.

```python
# From ai-bootcamp-app/backend/app/memory/thread_provider.py
class ThreadMemoryProvider:
    """Provides conversation history for a specific thread."""

    def __init__(self, redis: Redis | None, settings: MemorySettings, thread_id: str):
        self._redis = redis
        self._settings = settings
        self._key = f"thread:{thread_id}:messages"
```

- Short TTL (24 hours default)
- Enables: "What did I just ask?" continuity

📁 **See implementation:** [thread_provider.py](https://github.com/propel-ventures/ai-bootcamp/blob/main/ai-bootcamp-app/backend/app/memory/thread_provider.py)

**User Preferences (Long-term)**

Scoped to a user across all conversations, stores facts and preferences.

```python
# From ai-bootcamp-app/backend/app/memory/user_provider.py
class UserPreferencesProvider:
    """Provides user preferences across all threads."""

    def __init__(self, redis: Redis | None, settings: MemorySettings, user_id: str):
        self._redis = redis
        self._settings = settings
        self._key = f"user:{user_id}:preferences"
```

- Long TTL (30 days default)
- Enables: "Remember I prefer Python" personalization

📁 **See implementation:** [user_provider.py](https://github.com/propel-ventures/ai-bootcamp/blob/main/ai-bootcamp-app/backend/app/memory/user_provider.py)

#### Memory Decay and Prioritization

Not all memories are equal. Strategies include:

| Strategy | How It Works |
|----------|--------------|
| **Recency weighting** | Recent messages matter more |
| **Sliding window** | Keep only last N messages |
| **Summarization** | Compress old context into summaries |
| **TTL expiration** | Automatic cleanup of stale data |
| **Importance scoring** | Retain high-value information longer |

#### Storage Options

| Tool | Best For | Notes |
|------|----------|-------|
| **Redis** | Fast key-value, lists, TTL | Production standard, simple |
| **Mem0** | Intelligent memory layer | Auto-extracts facts, manages decay |
| **PostgreSQL** | Relational + vector | When you need SQL + embeddings |
| **In-memory** | Development/testing | No persistence, simple |

#### Configuration

Use environment variables to configure memory behavior:

```bash
# From ai-bootcamp-app/backend/.env.example

# Redis Settings
REDIS__HOST=localhost
REDIS__PORT=6379
REDIS__PASSWORD=
REDIS__DB=0

# Memory Settings
MEMORY__THREAD_TTL_HOURS=24
MEMORY__USER_TTL_DAYS=30
MEMORY__MAX_THREAD_MESSAGES=50
```

📁 **See configuration:** [config.py](https://github.com/propel-ventures/ai-bootcamp/blob/main/ai-bootcamp-app/backend/app/memory/config.py)

> **Deep Dive**: See [Course 2, Module 3: Memory Management with Redis](/ai-bootcamp-pages/course-2/03-memory-management/) for production implementation patterns including the Context Provider pattern, TTL-based cleanup, and graceful degradation.

### 5. PDF Tooling

Extract text from documents for RAG pipelines.

**Tools:**
- **Docling** - IBM's document processing library
- Best practices for chunking and metadata extraction

## Hands-On Exercise

1. Start the bootcamp app with `docker-compose up`
2. Open the Chat UI at http://localhost:3000
3. Test thread memory:
   - Send: *"My name is Alice and I am learning Python"*
   - Send: *"What is my name and what am I learning?"*
   - Verify the agent remembers your context
4. Test memory isolation:
   - Open a new incognito tab
   - Ask: *"What is my name?"*
   - Verify the agent doesn't know (new thread = fresh context)
5. Inspect Redis storage at http://localhost:8001
   - Find `thread:{id}:messages` keys
   - View the JSON conversation history
   - Note the TTL countdown
