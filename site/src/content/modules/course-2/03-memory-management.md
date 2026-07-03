---
title: "Memory Management: Hybrid Redis + PostgreSQL Architecture"
course: 2
module: 3
description: "Implement persistent conversation memory using a dual-layer architecture with Redis for fast access and PostgreSQL for permanent storage"
objectives:
  - "Understand the hybrid dual-layer memory architecture (Redis L1 + PostgreSQL L2)"
  - "Implement the Context Provider pattern for memory injection"
  - "Configure Redis for fast conversation caching with TTL-based cleanup"
  - "Store conversations permanently in PostgreSQL with the ConversationSyncService"
  - "Link short-term memory (Redis) to permanent storage (PostgreSQL) via thread_id"
  - "Design graceful degradation when memory backends are unavailable"
resources:
  - title: "Memory Architecture Documentation"
    url: "https://github.com/propel-ventures/ai-bootcamp/blob/main/ai-bootcamp-app/docs/arch/memory.md"
    type: "docs"
  - title: "Thread Memory Provider Implementation"
    url: "https://github.com/propel-ventures/ai-bootcamp/blob/main/ai-bootcamp-app/backend/app/memory/thread_provider.py"
    type: "repo"
  - title: "Conversation Sync Service"
    url: "https://github.com/propel-ventures/ai-bootcamp/blob/main/ai-bootcamp-app/backend/app/memory/conversation_sync.py"
    type: "repo"
  - title: "Conversation Database Model"
    url: "https://github.com/propel-ventures/ai-bootcamp/blob/main/ai-bootcamp-app/backend/app/db/models/conversation.py"
    type: "repo"
  - title: "Message Database Model"
    url: "https://github.com/propel-ventures/ai-bootcamp/blob/main/ai-bootcamp-app/backend/app/db/models/message.py"
    type: "repo"
  - title: "Redis Python Client"
    url: "https://redis.io/docs/latest/develop/clients/redis-py/"
    type: "docs"
quiz:
  - question: "What is the primary difference between thread memory and user preferences?"
    options:
      - "Thread memory is faster than user preferences"
      - "Thread memory is conversation-scoped with short TTL, user preferences are user-scoped with long TTL"
      - "User preferences use JSON, thread memory uses plain text"
      - "There is no difference, they are interchangeable"
    answer: 1
  - question: "In the hybrid architecture, what links Redis short-term memory to PostgreSQL permanent storage?"
    options:
      - "A foreign key relationship"
      - "The thread_id shared between Redis keys and the conversations table"
      - "Redis replication to PostgreSQL"
      - "Manual database migrations"
    answer: 1
  - question: "What happens when Redis is unavailable in a gracefully degrading system?"
    options:
      - "The application crashes"
      - "An error is returned to the user"
      - "The system hydrates from PostgreSQL and continues working"
      - "Messages are queued until Redis recovers"
    answer: 2
  - question: "What is the purpose of the ConversationSyncService?"
    options:
      - "To replace Redis with PostgreSQL"
      - "To asynchronously persist Redis conversations to PostgreSQL without blocking"
      - "To migrate data between database versions"
      - "To validate message content"
    answer: 1
---

## Overview

Memory management enables AI agents to maintain context across conversations, providing a more natural and personalized user experience. This module covers implementing a **hybrid dual-layer memory architecture** that combines Redis for fast access with PostgreSQL for permanent storage.

> **Prerequisite**: This module builds on concepts from [Course 1, Module 3: Context Engineering & RAG](../../course-1/03-context-engineering/), which introduces memory management theory, memory decay strategies, and the role of Redis in context management. Here we provide hands-on implementation.

## Why Memory Matters

Without memory, each agent interaction starts fresh. Users must repeatedly provide context, and agents cannot learn preferences or recall previous discussions. Memory transforms stateless agents into contextual assistants.

## Hybrid Dual-Layer Architecture

The memory system uses two complementary storage layers:

| Layer | Storage | Purpose | Latency | Retention |
|-------|---------|---------|---------|-----------|
| **L1 Cache** | Redis | Fast access for active conversations | ~1ms | 24 hours TTL |
| **L2 Storage** | PostgreSQL | Permanent conversation history | ~10ms | Permanent |

**Why two layers?**
- **Redis** provides sub-millisecond access for real-time conversations but data expires
- **PostgreSQL** provides permanent storage for conversation history and analytics
- **The sync service** bridges them asynchronously without blocking user interactions

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
    3. invoking() → retrieve context (Redis first, fallback to PostgreSQL)
    4. Enhance instructions with context
    5. Execute agent
    6. invoked() → store in Redis
    7. Async sync to PostgreSQL (fire-and-forget)
         │
         ├─────────────────────────────────────────┐
         ▼                                         ▼
    Memory Providers                      ConversationSyncService
    ┌─────────────────────┐               ┌──────────────────────┐
    │ ThreadMemoryProvider│ ←→ Redis      │ sync_exchange()      │
    │ UserPrefsProvider   │ ←→ Redis      │   ↓                  │
    └─────────────────────┘               │ PostgreSQL           │
                                          │ (conversations +     │
                                          │  messages tables)    │
                                          └──────────────────────┘
```

### How Short-Term Memory Links to the Database

The **`thread_id`** is the key that connects both storage layers:

```
Redis Key                         PostgreSQL
─────────────────────            ──────────────────────────────
thread:{thread_id}:messages  ←→  conversations.thread_id (UNIQUE)
                                       │
                                       ↓
                                 messages.conversation_id
```

When a conversation starts:
1. A `thread_id` (e.g., `conv_12345`) is generated by the frontend
2. Redis stores messages at key `thread:conv_12345:messages`
3. PostgreSQL creates a `conversations` row with `thread_id = 'conv_12345'`
4. All messages reference this conversation via `conversation_id`

This design allows:
- **Fast retrieval**: Check Redis first for active conversations
- **Hydration**: If Redis expired, reload from PostgreSQL
- **Permanent history**: Conversations are never lost after Redis TTL expires

## The Context Provider Pattern

Memory providers implement a consistent interface with two key methods:

### `invoking()` - Before Execution

Called before the agent processes a request. Uses a **hybrid retrieval strategy**:
1. First tries Redis for fast access
2. If Redis is empty, hydrates from PostgreSQL
3. Falls back to PostgreSQL-only if Redis is unavailable

```python
async def invoking(self) -> str:
    """Get conversation history with hybrid Redis/PostgreSQL retrieval."""
    messages: list[dict] = []

    # Try Redis first (L1 cache)
    if self._redis:
        raw_messages = await self._redis.lrange(self._key, 0, -1)
        if raw_messages:
            messages = [json.loads(m) for m in raw_messages]
        elif self._db_session:
            # Redis empty - hydrate from PostgreSQL (L2 storage)
            messages = await self._hydrate_from_db()
    elif self._db_session:
        # Redis unavailable - use PostgreSQL directly
        messages = await self._get_messages_from_db()

    if not messages:
        return ""

    formatted = [f"{m['role']}: {m['content']}" for m in messages]
    return f"Previous conversation:\n" + "\n".join(formatted)

async def _hydrate_from_db(self) -> list[dict]:
    """Load messages from PostgreSQL and repopulate Redis cache."""
    conversation = self._conversation_repo.get_by_thread_id(self._thread_id)
    if not conversation:
        return []

    db_messages = self._message_repo.get_by_conversation(conversation.id)
    messages = [{"role": m.role, "content": m.content} for m in db_messages]

    # Repopulate Redis cache for future fast access
    if self._redis and messages:
        for msg in messages:
            await self._redis.rpush(self._key, json.dumps(msg))
        await self._redis.expire(self._key, self._settings.thread_ttl_hours * 3600)

    return messages

async def _get_messages_from_db(self) -> list[dict]:
    """Load messages straight from PostgreSQL (Redis unavailable — no cache to fill)."""
    conversation = self._conversation_repo.get_by_thread_id(self._thread_id)
    if not conversation:
        return []
    db_messages = self._message_repo.get_by_conversation(conversation.id)
    return [{"role": m.role, "content": m.content} for m in db_messages]
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

> **Trade-off:** `ltrim` keeps only the most recent `max_thread_messages` exchanges — older turns are dropped, not summarised, so long conversations lose their earliest context. For long-running threads, consider summarising trimmed history into a rolling summary rather than discarding it (see [Course 1, Module 3](../../course-1/03-context-engineering/) on memory decay strategies).

### User Preferences Provider

The `UserPreferencesProvider` follows the same pattern for long-lived, user-scoped facts. It stores preferences as a Redis **hash** (keyed by `user:{user_id}:preferences`) with a longer TTL, and is a no-op when no `user_id` is supplied:

```python
class UserPreferencesProvider:
    """User-scoped preferences, stored as a Redis hash with a long TTL."""

    def __init__(self, redis: Redis | None, settings: MemorySettings, user_id: str | None):
        self._redis = redis
        self._settings = settings
        self._key = f"user:{user_id}:preferences" if user_id else None

    async def invoking(self) -> str:
        """Return stored preferences as context (empty string if none)."""
        if not self._redis or not self._key:
            return ""
        prefs = await self._redis.hgetall(self._key)
        if not prefs:
            return ""
        formatted = [f"{key.decode()}: {value.decode()}" for key, value in prefs.items()]
        return "User preferences:\n" + "\n".join(formatted)

    async def remember(self, key: str, value: str) -> None:
        """Store or update a single preference and refresh its TTL."""
        if not self._redis or not self._key:
            return
        await self._redis.hset(self._key, key, value)
        await self._redis.expire(self._key, self._settings.user_ttl_days * 86400)
```

Guarding on `self._key` is what implements the "no `user_id` → preferences not used" row in the degradation table below.

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

## PostgreSQL Database Schema

The permanent storage layer uses two main tables:

### conversations table

```sql
CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    thread_id VARCHAR(255) UNIQUE NOT NULL,  -- Links to Redis key
    user_id VARCHAR(255),
    title VARCHAR(500),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_conversations_thread_id ON conversations(thread_id);
CREATE INDEX idx_conversations_user_id ON conversations(user_id);
```

### messages table

```sql
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL,  -- 'user' or 'assistant'
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
```

### SQLAlchemy Models

```python
from datetime import datetime, UTC

class ConversationModel(Base):
    __tablename__ = "conversations"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    thread_id: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    user_id: Mapped[str | None] = mapped_column(String(255), index=True)
    title: Mapped[str | None] = mapped_column(String(500))
    created_at: Mapped[datetime] = mapped_column(default=lambda: datetime.now(UTC))
    updated_at: Mapped[datetime] = mapped_column(default=lambda: datetime.now(UTC), onupdate=lambda: datetime.now(UTC))

    messages: Mapped[list["MessageModel"]] = relationship(back_populates="conversation")


class MessageModel(Base):
    __tablename__ = "messages"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    conversation_id: Mapped[UUID] = mapped_column(ForeignKey("conversations.id"))
    role: Mapped[str] = mapped_column(String(50))
    content: Mapped[str] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(default=lambda: datetime.now(UTC))

    conversation: Mapped["ConversationModel"] = relationship(back_populates="messages")
```

## ConversationSyncService

The sync service bridges Redis and PostgreSQL with **asynchronous, fire-and-forget** synchronization:

```python
class ConversationSyncService:
    """Persists Redis conversations to PostgreSQL as a background task.

    Critically, it opens its OWN database session rather than reusing the
    request-scoped one. The sync runs *after* the HTTP response is sent, by
    which point FastAPI has already closed the request's session — reusing it
    would raise. So the service is constructed with a session *factory*, not a
    live session.
    """

    def __init__(self, session_factory: sessionmaker[Session]):
        self._session_factory = session_factory

    async def sync_exchange(
        self,
        thread_id: str,
        user_id: str | None,
        user_message: str,
        assistant_message: str,
        document_ids: list[UUID] | None = None,
    ) -> None:
        """Sync one exchange to PostgreSQL, off the request path."""
        try:
            # The repo calls are blocking, so run them in a worker thread to
            # avoid stalling the event loop for other in-flight requests.
            await asyncio.to_thread(
                self._persist_exchange,
                thread_id,
                user_id,
                user_message,
                assistant_message,
                document_ids,
            )
        except Exception as e:
            # Log but don't crash - sync failures must not affect the user.
            logger.error("Sync failed for thread %s: %s", thread_id, e)

    def _persist_exchange(
        self,
        thread_id: str,
        user_id: str | None,
        user_message: str,
        assistant_message: str,
        document_ids: list[UUID] | None,
    ) -> None:
        # Dedicated session, scoped to this task and closed on block exit.
        with self._session_factory() as session:
            conversation_repo = ConversationRepository(session)
            message_repo = MessageRepository(session)

            # Idempotent get-or-create by thread_id
            conversation = conversation_repo.get_by_thread_id(thread_id)
            if not conversation:
                conversation = conversation_repo.create(
                    Conversation(thread_id=thread_id, user_id=user_id)
                )

            message_repo.add_many([
                Message(conversation_id=conversation.id, role="user", content=user_message),
                Message(conversation_id=conversation.id, role="assistant", content=assistant_message),
            ])

            if document_ids:
                for doc_id in document_ids:
                    conversation_repo.attach_document(conversation.id, doc_id)

            conversation.updated_at = datetime.now(UTC)
            session.commit()
```

### Key Design Decisions

1. **Own session, not the request's**: The task opens a fresh session from a factory — the request-scoped session is already closed by the time the sync runs
2. **Off the event loop**: Blocking repo calls run in a worker thread (`asyncio.to_thread`) so they don't stall other requests
3. **Graceful failures**: Sync errors are logged but don't crash the system
4. **Idempotent creates**: Uses `get_by_thread_id` to avoid duplicate conversations
5. **Document tracking**: Automatically links uploaded documents to conversations

## Graceful Degradation

The hybrid architecture provides multiple fallback levels:

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
| Redis unavailable | Uses PostgreSQL directly for retrieval, continues working |
| PostgreSQL unavailable | Redis caching continues, sync logs errors but doesn't block |
| Both unavailable | Agent runs stateless without memory |
| No thread_id provided | Thread memory not used |
| No user_id provided | User preferences not used |
| Sync service failure | Logged and ignored (fire-and-forget) |

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
# Keep references to background sync tasks so they aren't garbage-collected
# mid-flight (the event loop only holds a weak reference to a running task).
_sync_tasks: set[asyncio.Task] = set()


@router.post("/run")
async def run_agent(
    request: AgentRunRequest,
    redis: Redis | None = Depends(get_redis_client),
    db: Session = Depends(get_db_session),
    sync_service: ConversationSyncService = Depends(get_sync_service),
):
    # 1. Initialize memory providers with both Redis and DB access
    thread_provider = ThreadMemoryProvider(
        redis=redis,
        db_session=db,
        settings=memory_settings,
        thread_id=request.thread_id,
    )
    user_provider = UserPreferencesProvider(redis, memory_settings, request.user_id)

    # 2. Retrieve context (tries Redis first, falls back to PostgreSQL)
    thread_context = await thread_provider.invoking()
    user_context = await user_provider.invoking()

    # 3. Enhance instructions with memory context
    enhanced_instructions = f"{request.instructions}\n\n{thread_context}\n\n{user_context}"

    # 4. Execute agent
    response = await agent.run(request.prompt, instructions=enhanced_instructions)

    # 5. Store in Redis (fast, synchronous)
    await thread_provider.invoked(request.prompt, response)

    # 6. Sync to PostgreSQL off the request path. The sync service opens its own
    #    session; keep a reference to the task so it isn't garbage-collected.
    task = asyncio.create_task(
        sync_service.sync_exchange(
            thread_id=request.thread_id,
            user_id=request.user_id,
            user_message=request.prompt,
            assistant_message=response,
        )
    )
    _sync_tasks.add(task)
    task.add_done_callback(_sync_tasks.discard)

    return {"response": response}
```

### Complete Flow Example

```python
# User sends: "Tell me about Python" with thread_id="conv_12345"

# 1. RETRIEVAL (invoking)
thread_provider = ThreadMemoryProvider(redis, db, settings, "conv_12345")
context = await thread_provider.invoking()
# Checks Redis key "thread:conv_12345:messages"
# If empty, hydrates from PostgreSQL conversations table
# Returns: "Previous conversation:\nuser: Hello\nassistant: Hi there!"

# 2. ENHANCE INSTRUCTIONS
enhanced = f"""You are a helpful assistant.

Previous conversation:
user: Hello
assistant: Hi there!"""

# 3. RUN AGENT
result = await agent.run("Tell me about Python", instructions=enhanced)

# 4. STORE IN REDIS (invoked) - ~1ms, synchronous
await thread_provider.invoked("Tell me about Python", result.text)
# Pushes to Redis list, trims to max, sets TTL

# 5. SYNC TO POSTGRESQL - background task with its own DB session
task = asyncio.create_task(sync_service.sync_exchange(
    thread_id="conv_12345",
    user_id="user_456",
    user_message="Tell me about Python",
    assistant_message=result.text,
))
_sync_tasks.add(task)  # keep a reference (see Endpoint Flow above)
task.add_done_callback(_sync_tasks.discard)
# Creates conversation row if new, inserts message rows
# Doesn't block the response to the user
```

## Docker Compose Setup

```yaml
services:
  redis:
    image: redis:8   # Redis 8+ bundles the query engine / data structures formerly shipped as Redis Stack
    ports:
      - "6379:6379"
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 3s
      retries: 5

  postgres:
    image: postgres:18
    environment:
      POSTGRES_USER: bootcamp
      POSTGRES_PASSWORD: bootcamp
      POSTGRES_DB: bootcamp
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U bootcamp"]
      interval: 5s
      timeout: 3s
      retries: 5

  backend:
    depends_on:
      redis:
        condition: service_healthy
      postgres:
        condition: service_healthy
    environment:
      - REDIS__HOST=redis
      - REDIS__PORT=6379
      - DATABASE__URL=postgresql://bootcamp:bootcamp@postgres:5432/bootcamp

volumes:
  postgres_data:
```

## Frontend Integration

React hooks manage thread identity and pass it with each request:

```typescript
const { threadId, userId, sendMessage, messages } = useAgentChat({
  threadId: "optional-custom-id",  // Auto-generated if omitted
  userId: "optional-user-id"
});
```

## Hands-On Exercise

Run the memory stack and watch all three behaviours the architecture promises — caching, hydration, and graceful degradation.

### Part 1: Start the stack

```bash
docker compose up -d
docker compose ps   # wait for redis + postgres healthchecks to pass
```

### Part 2: Watch Redis fill (L1 cache)

Send a couple of messages from the chat UI (or `curl` the `/run` endpoint) using a known `thread_id`, then inspect the Redis list directly:

```bash
docker compose exec redis redis-cli LRANGE thread:conv_12345:messages 0 -1
docker compose exec redis redis-cli TTL thread:conv_12345:messages   # ~86400s (24h)
```

### Part 3: Hydration from PostgreSQL (L2 storage)

Simulate the Redis TTL expiring by deleting the key, then send a follow-up on the same thread:

```bash
docker compose exec redis redis-cli DEL thread:conv_12345:messages
```

Ask something that depends on earlier context ("what did I just ask about?"). The agent still has the history — it was rehydrated from PostgreSQL. Confirm the rows exist:

```bash
docker compose exec postgres psql -U bootcamp -c \
  "SELECT role, left(content, 40) FROM messages m \
   JOIN conversations c ON c.id = m.conversation_id \
   WHERE c.thread_id = 'conv_12345' ORDER BY m.created_at;"
```

### Part 4: Graceful degradation

Stop Redis entirely and send another message:

```bash
docker compose stop redis
```

The request should still succeed — `get_redis_client` returns `None` and the provider reads history straight from PostgreSQL. Restart Redis (`docker compose start redis`) and confirm the cache repopulates on the next request.

**What you've observed:** the same `thread_id` links both layers; Redis serves fast reads; PostgreSQL is the durable source of truth; and losing either layer degrades gracefully instead of failing.

## Concurrency & Consistency

The hybrid design favours availability and speed, which introduces a few consistency edges worth knowing:

- **Concurrent writes to one thread**: Two requests on the same `thread_id` can interleave their Redis `rpush` calls and both hit the non-atomic get-or-create in `sync_exchange`, racing to create the conversation row. The `UNIQUE` constraint on `conversations.thread_id` is the backstop — treat a duplicate-key error as "already created" and re-fetch. For strict ordering, serialise writes per thread (e.g. a per-thread lock or queue).
- **Redis vs PostgreSQL divergence**: Because sync is fire-and-forget, PostgreSQL can lag Redis briefly, and a failed sync means an exchange lives only in Redis until its TTL expires. Monitor sync failures (see the checklist); for stronger guarantees, use a durable queue with retries instead of a bare background task.
- **Trim vs hydration**: Redis keeps only the last `max_thread_messages` exchanges while PostgreSQL keeps everything, so a rehydrated cache reflects the trimmed window, not full history — intentional, but worth remembering when debugging "missing" context.

## Memory & Data Governance

Storing conversation history means storing whatever users typed — often including PII. Treat the memory layer as regulated data:

- **PII in stored messages**: The same detection you apply at the edge applies here. See [Course 1, Module 5](../../course-1/05-enterprise-foundations/) for Presidio-based PII scanning; decide whether to redact before persisting or to store raw with restricted access.
- **Encryption at rest**: Enable encryption on both Redis and PostgreSQL (managed services usually offer it as a toggle) — conversation content shouldn't sit in plaintext on disk.
- **Retention & deletion**: Redis TTL handles short-term cleanup, but PostgreSQL rows are permanent. Implement a deletion path for a user's right to erasure (GDPR/CCPA): delete the `conversations` row (cascades to `messages`) **and** purge the matching `thread:{thread_id}:messages` Redis key — clearing one layer isn't enough.
- **Access & audit**: Restrict who can read the conversations/messages tables, and log access the same way you would for any sensitive store.

## Production Checklist

### Redis (L1 Cache)
- [ ] Configure `REDIS__HOST` for production Redis endpoint
- [ ] Set `REDIS__PASSWORD` for authenticated connections
- [ ] Adjust TTL values based on data retention requirements
- [ ] Monitor Redis memory usage
- [ ] Consider Redis Sentinel or Cluster for high availability

### PostgreSQL (L2 Storage)
- [ ] Configure `DATABASE__URL` for production database
- [ ] Run database migrations for conversations/messages tables
- [ ] Set up database backups for conversation history
- [ ] Configure connection pooling (e.g., PgBouncer)
- [ ] Monitor database size and query performance

### Sync Service
- [ ] Configure async task queue for high-volume sync (optional)
- [ ] Set up error monitoring for sync failures
- [ ] Consider dead letter queue for failed syncs

## Key Takeaways

1. **Hybrid dual-layer architecture**: Redis (L1) for speed, PostgreSQL (L2) for permanence
2. **thread_id is the link**: Same identifier connects Redis keys to PostgreSQL rows
3. **Hydration pattern**: If Redis is empty, reload from PostgreSQL and repopulate cache
4. **Fire-and-forget sync**: PostgreSQL sync is async and doesn't block responses
5. **Graceful degradation**: System works with Redis only, PostgreSQL only, or stateless
6. **Context Provider pattern**: `invoking()` retrieves, `invoked()` stores
7. **TTL-based cleanup**: Redis expires automatically, PostgreSQL stores permanently
8. **Memory is regulated data**: stored conversations may contain PII — scan, encrypt at rest, and support deletion across both layers
