---
title: "Memory Management with Redis"
course: 2
module: 3
description: "Implement persistent conversation memory and user preferences using Redis for stateful AI agents"
objectives:
  - "Understand the difference between thread memory and user preferences"
  - "Implement the Context Provider pattern for memory injection"
  - "Configure Redis for conversation persistence with TTL-based cleanup"
  - "Design graceful degradation when memory backends are unavailable"
  - "Integrate memory providers with agent endpoints"
resources:
  - title: "Memory Architecture Documentation"
    url: "https://github.com/propel-ventures/ai-bootcamp/blob/main/ai-bootcamp-app/docs/arch/memory.md"
    type: "docs"
  - title: "Redis Python Client"
    url: "https://redis-py.readthedocs.io/en/stable/"
    type: "docs"
  - title: "Thread Memory Provider Implementation"
    url: "https://github.com/propel-ventures/ai-bootcamp/blob/main/ai-bootcamp-app/backend/app/memory/thread_provider.py"
    type: "repo"
  - title: "User Preferences Provider Implementation"
    url: "https://github.com/propel-ventures/ai-bootcamp/blob/main/ai-bootcamp-app/backend/app/memory/user_provider.py"
    type: "repo"
quiz:
  - question: "What is the primary difference between thread memory and user preferences?"
    options:
      - "Thread memory is faster than user preferences"
      - "Thread memory is conversation-scoped with short TTL, user preferences are user-scoped with long TTL"
      - "User preferences use JSON, thread memory uses plain text"
      - "There is no difference, they are interchangeable"
    answer: 1
  - question: "What Redis data structure is used for storing conversation history?"
    options:
      - "String"
      - "Hash"
      - "List"
      - "Set"
    answer: 2
  - question: "What happens when Redis is unavailable in a gracefully degrading system?"
    options:
      - "The application crashes"
      - "An error is returned to the user"
      - "The system continues stateless without memory"
      - "Messages are queued until Redis recovers"
    answer: 2
  - question: "What is the purpose of the invoking() method in the Context Provider pattern?"
    options:
      - "To initialize the Redis connection"
      - "To retrieve context before agent execution"
      - "To close the Redis connection"
      - "To clear conversation history"
    answer: 1
---

## Overview

Memory management enables AI agents to maintain context across conversations, providing a more natural and personalized user experience. This module covers implementing persistent memory using Redis, a high-performance in-memory data store.

> **Prerequisite**: This module builds on concepts from [Course 1, Module 3: Context Engineering & RAG](/ai-bootcamp-pages/course-1/03-context-engineering/), which introduces memory management theory, memory decay strategies, and the role of Redis in context management. Here we provide hands-on implementation.

## Why Memory Matters

Without memory, each agent interaction starts fresh. Users must repeatedly provide context, and agents cannot learn preferences or recall previous discussions. Memory transforms stateless agents into contextual assistants.

## Memory Types

### Thread Memory (Short-term)

Conversation history scoped to a specific thread or session.

| Property | Value |
|----------|-------|
| **Scope** | Single conversation thread |
| **TTL** | 24 hours (configurable) |
| **Redis Type** | List |
| **Key Pattern** | `thread:{thread_id}:messages` |

### User Preferences (Long-term)

Persistent facts and preferences tied to a user across all threads.

| Property | Value |
|----------|-------|
| **Scope** | User across all conversations |
| **TTL** | 30 days (configurable) |
| **Redis Type** | Hash |
| **Key Pattern** | `user:{user_id}:preferences` |

## Architecture

```
Frontend (thread_id, user_id)
         │
         ▼
    API Endpoints
         │
         ▼
  Memory Integration Layer
    1. Get Redis client
    2. Initialize providers
    3. invoking() → retrieve context
    4. Enhance instructions
    5. Execute agent
    6. invoked() → store conversation
         │
         ▼
    Memory Providers
    ┌─────────────────────┐
    │ ThreadMemoryProvider│ ←→ Redis List
    │ UserPrefsProvider   │ ←→ Redis Hash
    └─────────────────────┘
```

## The Context Provider Pattern

Memory providers implement a consistent interface with two key methods:

### `invoking()` - Before Execution

Called before the agent processes a request. Returns formatted context to inject into instructions.

```python
async def invoking(self) -> str:
    """Get conversation history before agent processes request."""
    if not self._redis:
        return ""  # Graceful degradation

    messages = await self._redis.lrange(self._key, 0, -1)
    if not messages:
        return ""

    formatted = []
    for msg_json in messages:
        msg = json.loads(msg_json)
        formatted.append(f"{msg['role']}: {msg['content']}")

    history = "\n".join(formatted)
    return f"Previous conversation:\n{history}"
```

### `invoked()` - After Execution

Called after the agent responds. Stores the exchange for future retrieval.

```python
async def invoked(self, user_message: str, assistant_message: str) -> None:
    """Store conversation exchange after agent responds."""
    if not self._redis:
        return

    user_entry = json.dumps({"role": "user", "content": user_message})
    assistant_entry = json.dumps({"role": "assistant", "content": assistant_message})

    await self._redis.rpush(self._key, user_entry)
    await self._redis.rpush(self._key, assistant_entry)

    # Trim to max messages (keep most recent)
    max_entries = self._settings.max_thread_messages * 2
    await self._redis.ltrim(self._key, -max_entries, -1)

    # Set TTL for automatic cleanup
    ttl_seconds = self._settings.thread_ttl_hours * 3600
    await self._redis.expire(self._key, ttl_seconds)
```

## Configuration

### Environment Variables

```bash
# Redis Connection
REDIS__HOST=localhost
REDIS__PORT=6379
REDIS__PASSWORD=
REDIS__DB=0

# Memory Settings
MEMORY__THREAD_TTL_HOURS=24
MEMORY__USER_TTL_DAYS=30
MEMORY__MAX_THREAD_MESSAGES=50
```

### Pydantic Settings

```python
class RedisSettings(BaseSettings):
    host: str = "localhost"
    port: int = 6379
    password: str | None = None
    db: int = 0

    model_config = SettingsConfigDict(
        env_prefix="REDIS__",
        env_file=".env",
    )

    @property
    def url(self) -> str:
        auth = f":{self.password}@" if self.password else ""
        return f"redis://{auth}{self.host}:{self.port}/{self.db}"


class MemorySettings(BaseSettings):
    thread_ttl_hours: int = 24
    user_ttl_days: int = 30
    max_thread_messages: int = 50

    model_config = SettingsConfigDict(
        env_prefix="MEMORY__",
        env_file=".env",
    )
```

## Graceful Degradation

A production-ready memory system must handle Redis unavailability without crashing:

```python
async def get_redis_client(settings: RedisSettings) -> Redis | None:
    """Returns None if Redis unavailable (system continues without memory)."""
    try:
        client = Redis.from_url(settings.url)
        await client.ping()
        return client
    except Exception as e:
        logger.warning("Redis unavailable: %s", e)
        return None
```

| Scenario | Behavior |
|----------|----------|
| Redis unavailable | System continues stateless |
| No thread_id provided | Thread memory not used |
| No user_id provided | User preferences not used |

## Context Injection

Memory context is appended to agent instructions, not passed as separate messages:

```
[Original Instructions]

Previous conversation:
user: Hello
assistant: Hi there! How can I help?
user: Tell me about Python
assistant: Python is a programming language...

User preferences:
preferred_language: Python
expertise_level: intermediate
```

## API Integration

### Request Model

```python
class AgentRunRequest(BaseModel):
    prompt: str
    agent_name: str = "assistant"
    instructions: str = "You are a helpful assistant."
    tools: list[str] = []
    thread_id: str | None = None   # Enables conversation history
    user_id: str | None = None     # Enables user preferences
```

### Endpoint Flow

```python
@router.post("/run")
async def run_agent(request: AgentRunRequest):
    # 1. Get Redis client (gracefully handles unavailability)
    redis = await get_redis_client(redis_settings)

    # 2. Initialize memory providers
    thread_provider = ThreadMemoryProvider(redis, memory_settings, request.thread_id)
    user_provider = UserPreferencesProvider(redis, memory_settings, request.user_id)

    # 3. Retrieve context
    thread_context = await thread_provider.invoking()
    user_context = await user_provider.invoking()

    # 4. Enhance instructions
    enhanced_instructions = f"{request.instructions}\n\n{thread_context}\n\n{user_context}"

    # 5. Execute agent
    response = await agent.run(request.prompt, instructions=enhanced_instructions)

    # 6. Store conversation
    await thread_provider.invoked(request.prompt, response)

    return {"response": response}
```

## Docker Compose Setup

```yaml
services:
  redis:
    image: redis/redis-stack:latest
    ports:
      - "6379:6379"
      - "8001:8001"  # Redis Insight UI
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 3s
      retries: 5

  backend:
    depends_on:
      redis:
        condition: service_healthy
    environment:
      - REDIS__HOST=redis
      - REDIS__PORT=6379
```

## Frontend Integration

React hooks manage thread identity and pass it with each request:

```typescript
const { threadId, userId, sendMessage, messages } = useAgentChat({
  threadId: "optional-custom-id",  // Auto-generated if omitted
  userId: "optional-user-id"
});
```

## Production Checklist

- [ ] Configure `REDIS__HOST` for production Redis endpoint
- [ ] Set `REDIS__PASSWORD` for authenticated connections
- [ ] Adjust TTL values based on data retention requirements
- [ ] Monitor Redis memory usage
- [ ] Configure Redis persistence (RDB/AOF) for durability
- [ ] Consider Redis Sentinel or Cluster for high availability

## Key Takeaways

1. **Two memory types**: Thread memory for conversations, user preferences for personalization
2. **Context Provider pattern**: `invoking()` retrieves, `invoked()` stores
3. **Graceful degradation**: System works without Redis, just stateless
4. **TTL-based cleanup**: Automatic expiration prevents unbounded growth
5. **Instruction augmentation**: Memory enhances agent instructions, not message history
