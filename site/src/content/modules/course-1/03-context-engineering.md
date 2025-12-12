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

Context engineering is a core skill for production AI systems - managing what the AI knows and when.

## Topics Covered

### Traditional RAG Pipelines
- Vector stores and embeddings
- Retrieval strategies
- S3 vectors for scale

### Progressive Context
- Avoiding context overload
- Tool flooding prevention
- On-the-fly vs pre-built RAG

### Structured Output
- Pydantic AI patterns
- Instructor library
- Outlines for constrained generation

### Memory Management

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
- Scoped to a single conversation
- Stores message history in sequence
- Short TTL (hours to days)
- Enables: "What did I just ask?" continuity

**User Preferences (Long-term)**
- Scoped to a user across all conversations
- Stores facts, preferences, learned information
- Long TTL (days to months)
- Enables: "Remember I prefer Python" personalization

#### Memory Decay and Prioritization

Not all memories are equal. Strategies include:

- **Recency weighting**: Recent messages matter more
- **Sliding window**: Keep only last N messages
- **Summarization**: Compress old context into summaries
- **TTL expiration**: Automatic cleanup of stale data
- **Importance scoring**: Retain high-value information longer

#### Storage Options

| Tool | Best For | Notes |
|------|----------|-------|
| **Redis** | Fast key-value, lists, TTL | Production standard, simple |
| **Mem0** | Intelligent memory layer | Auto-extracts facts, manages decay |
| **PostgreSQL** | Relational + vector | When you need SQL + embeddings |
| **In-memory** | Development/testing | No persistence, simple |

#### Hands-On: Test Memory in the App

Try these exercises using the Chat UI to see memory in action.

**Setup**

```bash
cd ai-bootcamp-app
docker-compose up
```

Wait for services to start, then open:
- **Chat UI**: http://localhost:3000
- **Redis Insight**: http://localhost:8001 (view stored memory)

**Exercise 1: Test Thread Memory**

1. Open the Chat UI at http://localhost:3000
2. Send a message: *"My name is Alice and I am learning Python"*
3. Wait for the streaming response
4. Send a follow-up: *"What is my name and what am I learning?"*

The agent remembers your name and learning goal. The UI maintains a `thread_id` for your session, so all messages share context.

**Exercise 2: Inspect Redis Storage**

1. Open Redis Insight at http://localhost:8001
2. Browse keys and find `thread:{id}:messages`
3. Click to view the JSON list of your conversation
4. Notice the TTL countdown (24 hours default)

You'll see your messages stored as:
```json
[
  {"role": "user", "content": "My name is Alice..."},
  {"role": "assistant", "content": "Nice to meet you..."},
  {"role": "user", "content": "What is my name..."},
  {"role": "assistant", "content": "Your name is Alice..."}
]
```

**Exercise 3: Test Memory Isolation**

1. Open a new browser tab (or incognito window)
2. Go to http://localhost:3000
3. Ask: *"What is my name?"*

The agent won't know - new tab means new `thread_id`, fresh context. This demonstrates that memory is scoped to each conversation thread.

**Exercise 4: Test Conversation Continuity**

Back in your original tab, continue the conversation:

1. Send: *"I also want to learn about Redis"*
2. Send: *"Summarize everything you know about me"*

The agent should recall: your name (Alice), that you're learning Python, and now Redis. This shows how thread memory accumulates over a conversation.

> **Deep Dive**: See [Course 2, Module 3: Memory Management with Redis](/ai-bootcamp-pages/course-2/03-memory-management/) for production implementation patterns including the Context Provider pattern, TTL-based cleanup, and graceful degradation.

### PDF Tooling
- Docling for document processing
- Text extraction best practices
