---
title: "Context Engineering & RAG"
course: 1
module: 3
description: "Understand when simple context injection is enough and when you need RAG - with practical trade-offs"
objectives:
  - "Implement simple in-memory document processing for small-scale use cases"
  - "Understand when and why to adopt RAG over simple context injection"
  - "Evaluate the complexity trade-offs RAG introduces"
  - "Build production-ready RAG pipelines when scale demands it"
  - "Understand memory types and when to use them vs RAG"
resources:
  - title: "LangChain RAG Tutorial"
    url: "https://python.langchain.com/docs/tutorials/rag/"
    type: "docs"
  - title: "Docling Documentation"
    url: "https://ds4sd.github.io/docling/"
    type: "docs"
  - title: "Bootcamp App - Documents Module"
    url: "https://github.com/propel-ventures/ai-bootcamp/tree/main/ai-bootcamp-app/backend/app/documents"
    type: "repo"
  - title: "Bootcamp App - Memory Module"
    url: "https://github.com/propel-ventures/ai-bootcamp/tree/main/ai-bootcamp-app/backend/app/memory"
    type: "repo"
  - title: "Conversation Sync Service"
    url: "https://github.com/propel-ventures/ai-bootcamp/blob/main/ai-bootcamp-app/backend/app/memory/conversation_sync.py"
    type: "repo"
  - title: "Memory Architecture Documentation"
    url: "https://github.com/propel-ventures/ai-bootcamp/blob/main/ai-bootcamp-app/docs/arch/memory.md"
    type: "docs"
quiz:
  - question: "What is the main advantage of simple context injection over RAG?"
    options:
      - "It handles larger document collections"
      - "It's simpler to implement with no embedding costs or vector store complexity"
      - "It provides better semantic search"
      - "It uses less memory"
    answer: 1
  - question: "When should you consider moving from simple context injection to RAG?"
    options:
      - "When you have any documents to process"
      - "When your documents exceed context limits or you need semantic search over large corpora"
      - "When you want faster response times"
      - "When you need conversation memory"
    answer: 1
  - question: "What is a key complexity RAG introduces compared to simple context injection?"
    options:
      - "RAG requires user authentication"
      - "RAG requires embedding models, vector stores, chunking strategies, and retrieval tuning"
      - "RAG only works with PDF files"
      - "RAG requires more API calls to the LLM"
    answer: 1
  - question: "Why does the bootcamp app use in-memory document storage instead of a vector store?"
    options:
      - "Vector stores are deprecated"
      - "For educational simplicity and because the use case (small docs, explicit selection) doesn't require semantic search"
      - "In-memory is always faster"
      - "Vector stores don't support PDF files"
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

Context engineering is about managing **what the AI knows and when**. A common mistake is jumping straight to complex RAG pipelines when simpler approaches would suffice. This module teaches you to start simple and add complexity only when needed.

**The progression:**
1. **Simple context injection** - Put the document directly in the prompt
2. **In-memory document stores** - Store and retrieve full documents by ID
3. **RAG pipelines** - Semantic search over large document collections

Each step adds capability but also complexity. Understanding these trade-offs is essential for building production AI systems.

## Codebase Reference

The bootcamp application demonstrates **simple context injection** - the first approach you should consider:

- **[Document Store](https://github.com/propel-ventures/ai-bootcamp/blob/main/ai-bootcamp-app/backend/app/documents/store.py)** - In-memory document storage
- **[Text Extraction](https://github.com/propel-ventures/ai-bootcamp/blob/main/ai-bootcamp-app/backend/app/documents/extraction.py)** - PDF to text conversion
- **[Thread Memory Provider](https://github.com/propel-ventures/ai-bootcamp/blob/main/ai-bootcamp-app/backend/app/memory/thread_provider.py)** - Manages conversation history per thread
- **[User Preferences Provider](https://github.com/propel-ventures/ai-bootcamp/blob/main/ai-bootcamp-app/backend/app/memory/user_provider.py)** - Stores long-term user facts

## Topics Covered

### 1. Start Simple: In-Memory Document Processing

Before reaching for vector databases and embedding models, consider whether you actually need them. The bootcamp app demonstrates a **simple context injection pattern** that works well for many use cases.

#### How It Works

```python
# From ai-bootcamp-app/backend/app/documents/store.py
class DocumentStore:
    """Simple in-memory document store - no embeddings, no vectors."""

    def __init__(self):
        self._documents: dict[str, Document] = {}

    def add(self, document: Document) -> None:
        self._documents[document.id] = document

    def get(self, document_id: str) -> Document | None:
        return self._documents.get(document_id)
```

📁 **See implementation:** [store.py](https://github.com/propel-ventures/ai-bootcamp/blob/main/ai-bootcamp-app/backend/app/documents/store.py)

#### The Flow

```
1. User uploads PDF
   → PyMuPDF extracts text
   → Store full text in memory (dict keyed by doc ID)
   → Return doc ID to client

2. User asks a question about the document
   → Retrieve full document text by ID
   → Inject text directly into system prompt
   → LLM processes question with full context

3. No embeddings. No vector search. No chunking.
```

#### Text Extraction

```python
# From ai-bootcamp-app/backend/app/documents/extraction.py
def extract_text_from_pdf(pdf_bytes: bytes) -> tuple[str, int]:
    """Extract text from PDF bytes using PyMuPDF."""
    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    text_parts = []
    for page in doc:
        text_parts.append(page.get_text())
    return "\n\n".join(text_parts), len(doc)
```

📁 **See implementation:** [extraction.py](https://github.com/propel-ventures/ai-bootcamp/blob/main/ai-bootcamp-app/backend/app/documents/extraction.py)

#### Context Injection Pattern

The magic happens when the agent runs. Document context is concatenated directly into the system instructions:

```python
# From ai-bootcamp-app/backend/app/api/routes/agents.py (simplified)
async def run_agent(request: AgentRunRequest):
    # Collect context from memory providers
    memory_context_parts = []
    for provider in context_providers:
        ctx = await provider.invoking()
        if ctx:
            memory_context_parts.append(ctx)

    # Inject context into system instructions
    enhanced_instructions = request.instructions
    if memory_context_parts:
        memory_context = "\n\n".join(memory_context_parts)
        enhanced_instructions = f"{request.instructions}\n\n{memory_context}"

    # Create agent with context-enhanced instructions
    agent = create_agent(instructions=enhanced_instructions, ...)
```

#### Why This Works

| Benefit | Explanation |
|---------|-------------|
| **No embedding costs** | No API calls to create embeddings |
| **No vector store** | Just a Python dictionary |
| **Full context preserved** | No lossy chunking or summarization |
| **Explicit control** | You know exactly what context the model sees |
| **Simple debugging** | Print the prompt, see what the model gets |

#### Limitations

| Limitation | Impact |
|------------|--------|
| **Context window limits** | Can't exceed ~100k tokens per document |
| **No semantic search** | Must select documents explicitly |
| **Memory usage** | All documents in RAM |
| **No relevance ranking** | All context weighted equally |

### 2. When Simple Isn't Enough: Enter RAG

The simple approach breaks down when:

- **Documents exceed context limits** - A 500-page manual won't fit in a prompt
- **You have many documents** - Can't inject 1000 documents at once
- **Semantic search is needed** - "Find documents about X" requires embeddings
- **Relevance matters** - Not all context is equally important

**RAG (Retrieval-Augmented Generation)** solves these problems by:
1. Chunking documents into smaller pieces
2. Creating embeddings (vector representations) of each chunk
3. Storing embeddings in a vector database
4. Retrieving only relevant chunks at query time

### 3. RAG Complexity Trade-offs

Before adopting RAG, understand what you're signing up for:

#### New Components Required

| Component | Purpose | Complexity |
|-----------|---------|------------|
| **Embedding model** | Convert text to vectors | API costs, model selection |
| **Vector store** | Store and search embeddings | Infrastructure, scaling |
| **Chunking strategy** | Split documents | Affects retrieval quality |
| **Retrieval strategy** | Find relevant chunks | Top-k, MMR, re-ranking |

#### New Failure Modes

| Problem | Description |
|---------|-------------|
| **Bad chunks** | Poor chunking loses context across boundaries |
| **Embedding drift** | Different embedding models = incompatible vectors |
| **Retrieval misses** | Semantically similar ≠ actually relevant |
| **Context fragmentation** | Retrieved chunks may lack necessary context |
| **Latency** | Embedding + search + retrieval adds overhead |

#### Decision Framework

```
START HERE:
│
├─ Documents fit in context window?
│   ├─ YES → Use simple context injection
│   └─ NO → Continue...
│
├─ Need to search across documents?
│   ├─ NO → Use explicit document selection
│   └─ YES → Continue...
│
├─ Need semantic similarity search?
│   ├─ NO → Consider keyword search (BM25, full-text)
│   └─ YES → RAG is appropriate
│
└─ RAG REQUIRED: Accept the complexity
```

### 4. Traditional RAG Pipelines

When you do need RAG, understanding its architecture helps you implement it effectively.

#### How RAG Works

RAG follows a two-phase approach: **indexing** (offline) and **retrieval + generation** (at query time).

```
INDEXING PHASE (Offline - done once per document)
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  Documents  │ -> │   Chunking  │ -> │  Embedding  │ -> │Vector Store │
│  (PDFs,     │    │  (Split     │    │  (Convert   │    │  (Store     │
│   text)     │    │   text)     │    │   to vecs)  │    │   & index)  │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘

QUERY PHASE (Online - every user query)
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│    Query    │ -> │   Embed     │ -> │   Search    │ -> │  Retrieve   │
│  "What is   │    │   Query     │    │   Vector    │    │   Top-K     │
│   X?"       │    │             │    │   Store     │    │   Chunks    │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
                                                                │
                                                                v
┌─────────────┐    ┌─────────────┐    ┌─────────────────────────────────┐
│   Answer    │ <- │     LLM     │ <- │  Query + Retrieved Context      │
│             │    │  Generate   │    │  "Given this context: [chunks]  │
│             │    │             │    │   Answer: What is X?"           │
└─────────────┘    └─────────────┘    └─────────────────────────────────┘
```

#### Core Components

**1. Chunking** - Splitting documents into retrievable pieces

| Strategy | Description | Best For |
|----------|-------------|----------|
| **Fixed size** | Split every N characters/tokens | Simple, predictable |
| **Semantic** | Split at paragraph/section boundaries | Preserves meaning |
| **Recursive** | Try multiple separators (paragraph → sentence → word) | General purpose |
| **Overlap** | Include N characters from previous chunk | Preserves context across boundaries |

```python
# Example: Recursive character splitting with overlap
from langchain.text_splitter import RecursiveCharacterTextSplitter

splitter = RecursiveCharacterTextSplitter(
    chunk_size=1000,      # Target chunk size in characters
    chunk_overlap=200,    # Overlap between chunks
    separators=["\n\n", "\n", ". ", " "]  # Try these in order
)
chunks = splitter.split_text(document_text)
```

**2. Embeddings** - Converting text to vectors for similarity search

Embeddings map text to high-dimensional vectors where similar meanings are close together.

| Model | Dimensions | Notes |
|-------|------------|-------|
| `text-embedding-3-small` (OpenAI) | 1536 | Good balance of cost/quality |
| `text-embedding-3-large` (OpenAI) | 3072 | Higher quality, higher cost |
| `all-MiniLM-L6-v2` (Sentence Transformers) | 384 | Free, runs locally |
| `voyage-large-2` (Voyage AI) | 1024 | Strong retrieval performance |

```python
# Example: Creating embeddings
from openai import OpenAI

client = OpenAI()
response = client.embeddings.create(
    model="text-embedding-3-small",
    input=["Your chunk of text here"]
)
vector = response.data[0].embedding  # List of 1536 floats
```

**3. Vector Stores** - Storing and searching embeddings

| Store | Type | Best For |
|-------|------|----------|
| **Chroma** | In-memory / SQLite | Development, small datasets |
| **Pinecone** | Managed cloud | Production, serverless |
| **Weaviate** | Self-hosted / cloud | Hybrid search, filtering |
| **pgvector** | PostgreSQL extension | When you already use Postgres |
| **FAISS** | In-memory library | High performance, local |

```python
# Example: Using Chroma for local development
import chromadb

client = chromadb.Client()
collection = client.create_collection("my_docs")

# Add documents (Chroma handles embedding automatically)
collection.add(
    documents=["chunk 1 text", "chunk 2 text"],
    ids=["chunk_1", "chunk_2"]
)

# Query
results = collection.query(
    query_texts=["What is machine learning?"],
    n_results=5
)
```

**4. Retrieval Strategies** - Finding the most relevant chunks

| Strategy | How It Works | Trade-off |
|----------|--------------|-----------|
| **Top-K** | Return K most similar chunks | Simple, may have redundancy |
| **MMR** (Maximal Marginal Relevance) | Balance relevance with diversity | Reduces redundant results |
| **Hybrid** | Combine vector search + keyword search (BM25) | Better for exact matches |
| **Re-ranking** | Use a cross-encoder to re-score top results | Higher quality, more latency |

#### Scaling Considerations

- **S3-backed vector stores** - For corpora too large to fit in memory
- **Metadata filtering** - Filter by date, source, category before vector search
- **Hierarchical indexing** - Summarize documents, search summaries first, then drill down
- **Caching** - Cache frequent queries to reduce latency and cost

#### Common Pitfalls

| Pitfall | Symptom | Solution |
|---------|---------|----------|
| Chunks too small | Retrieved context lacks necessary detail | Increase chunk size, add overlap |
| Chunks too large | Irrelevant content dilutes the answer | Decrease chunk size, use semantic splitting |
| Wrong embedding model | Poor retrieval despite good chunks | Evaluate models on your domain |
| No metadata | Can't filter by time/source | Add metadata during indexing |
| Stale index | New documents not searchable | Implement incremental indexing |

### 5. Progressive Context

Loading all context upfront wastes tokens and can overwhelm the model. Progressive context strategies load information as needed.

**Techniques:**
- **On-demand retrieval** - Fetch context only when relevant
- **Tool flooding prevention** - Limit available tools based on task
- **Lazy loading** - Start minimal, expand as conversation develops

| Approach | When to Use |
|----------|-------------|
| Simple injection | Small documents, explicit selection |
| Pre-built RAG | Known document corpus, predictable queries |
| On-the-fly RAG | Dynamic sources, exploratory queries |
| Progressive | Long conversations, multiple topics |

### 6. Structured Output

LLMs naturally produce free-form text, but applications need predictable data structures. Structured output techniques constrain model responses to match expected schemas, enabling reliable parsing and type safety.

#### The Problem with Free-Form Output

```python
# Without structured output - fragile string parsing
response = llm.complete("Extract the person's name and age from: 'John is 25 years old'")
# Response might be:
#   "Name: John, Age: 25"
#   "The person is John and they are 25."
#   "John (25)"
# Good luck parsing all these variations reliably!
```

#### The Solution: Schema-Constrained Generation

```python
# With structured output - guaranteed schema
from pydantic import BaseModel

class Person(BaseModel):
    name: str
    age: int

response = llm.complete_structured(
    "Extract the person's name and age from: 'John is 25 years old'",
    response_model=Person
)
# response.name = "John"
# response.age = 25  (already an int!)
```

#### How It Works

| Approach | Mechanism | Trade-off |
|----------|-----------|-----------|
| **JSON mode** | Model trained to output valid JSON | No schema enforcement |
| **Function calling** | Model fills function parameters | Provider-specific |
| **Constrained decoding** | Grammar restricts token generation | Guaranteed valid, slower |
| **Retry with validation** | Parse output, retry on failure | Works with any model |

#### Libraries

**Instructor** - Works with OpenAI, Anthropic, and other providers

```python
import instructor
from openai import OpenAI
from pydantic import BaseModel

client = instructor.from_openai(OpenAI())

class UserInfo(BaseModel):
    name: str
    age: int

user = client.chat.completions.create(
    model="gpt-4",
    response_model=UserInfo,
    messages=[{"role": "user", "content": "John Doe is 30 years old"}]
)
# user.name = "John Doe", user.age = 30
```

**Pydantic AI** - Native structured output support

```python
from pydantic_ai import Agent
from pydantic import BaseModel

class CityInfo(BaseModel):
    name: str
    country: str
    population: int

agent = Agent('openai:gpt-4', result_type=CityInfo)
result = agent.run_sync("Tell me about Paris")
# result.data.name = "Paris"
# result.data.country = "France"
```

**Native Provider Support** - OpenAI and Anthropic have built-in structured output

```python
# OpenAI structured outputs
from openai import OpenAI

client = OpenAI()
response = client.chat.completions.create(
    model="gpt-4o",
    response_format={
        "type": "json_schema",
        "json_schema": {
            "name": "person",
            "schema": {
                "type": "object",
                "properties": {
                    "name": {"type": "string"},
                    "age": {"type": "integer"}
                },
                "required": ["name", "age"]
            }
        }
    },
    messages=[{"role": "user", "content": "Extract: John is 25"}]
)
```

#### When to Use Structured Output

| Use Case | Why |
|----------|-----|
| **API responses** | Downstream systems need predictable formats |
| **Data extraction** | Pull structured data from unstructured text |
| **Tool/function calling** | Arguments must match expected types |
| **Multi-step workflows** | Output of one step feeds into next |
| **Database insertion** | Data must match schema |

#### Best Practices

- **Start with Pydantic models** - Define your schema as code, get validation free
- **Use optional fields** - `Optional[str]` for data that might not exist
- **Add descriptions** - Help the model understand field meaning with `Field(description="...")`
- **Validate beyond types** - Use Pydantic validators for business logic
- **Handle failures** - Always have a fallback for when parsing fails

### 7. Memory Management

Memory gives agents the ability to maintain context across interactions, transforming stateless request-response systems into contextual assistants.

#### Why Memory Matters

Without memory, every agent interaction starts fresh:
- Users must repeat context ("As I mentioned earlier...")
- Agents cannot learn user preferences
- Multi-turn conversations lose coherence
- Personalization is impossible

#### Hybrid Dual-Layer Architecture

The bootcamp app uses a **hybrid memory architecture** combining fast access with permanent storage:

| Layer | Storage | Purpose | Latency | Retention |
|-------|---------|---------|---------|-----------|
| **L1 Cache** | Redis | Fast access for active conversations | ~1ms | 24 hours TTL |
| **L2 Storage** | PostgreSQL | Permanent conversation history | ~10ms | Permanent |

**How they connect**: The `thread_id` links both layers. Redis stores messages at `thread:{thread_id}:messages`, and PostgreSQL has a `conversations` table with a unique `thread_id` column that references the same identifier.

```
Redis Key                         PostgreSQL
─────────────────────            ──────────────────────────────
thread:{thread_id}:messages  ←→  conversations.thread_id (UNIQUE)
                                       │
                                       ↓
                                 messages.conversation_id
```

This enables:
- **Fast retrieval**: Check Redis first for active conversations
- **Hydration**: If Redis TTL expired, reload from PostgreSQL and repopulate cache
- **Permanent history**: Conversations are never lost after Redis expiration

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

Scoped to a single conversation, stores message history in sequence. The `ThreadMemoryProvider` uses a **hybrid retrieval strategy**:

1. First checks Redis for fast access
2. If Redis is empty (TTL expired), hydrates from PostgreSQL
3. Falls back to PostgreSQL-only if Redis is unavailable

```python
# From ai-bootcamp-app/backend/app/memory/thread_provider.py
class ThreadMemoryProvider:
    """Provides conversation history with hybrid Redis/PostgreSQL retrieval."""

    def __init__(self, redis: Redis | None, db_session: Session, settings: MemorySettings, thread_id: str):
        self._redis = redis
        self._db_session = db_session
        self._settings = settings
        self._key = f"thread:{thread_id}:messages"
        self._thread_id = thread_id

    async def invoking(self) -> str:
        """Get context - Redis first, hydrate from PostgreSQL if needed."""
        messages = []

        if self._redis:
            raw = await self._redis.lrange(self._key, 0, -1)
            if raw:
                messages = [json.loads(m) for m in raw]
            elif self._db_session:
                # Redis empty - hydrate from PostgreSQL
                messages = await self._hydrate_from_db()
        elif self._db_session:
            messages = await self._get_messages_from_db()

        # Format for context injection...
```

- Short TTL in Redis (24 hours default)
- Permanent storage in PostgreSQL
- Automatic sync via `ConversationSyncService`

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

The bootcamp app uses a **hybrid approach** combining Redis and PostgreSQL:

| Layer | Tool | Role | Notes |
|-------|------|------|-------|
| **L1 Cache** | Redis | Fast access, TTL-based expiration | Sub-millisecond reads for active conversations |
| **L2 Storage** | PostgreSQL | Permanent history | Conversations and messages tables |
| **Sync** | ConversationSyncService | Async persistence | Fire-and-forget sync to PostgreSQL |

**Why hybrid?** Redis provides speed for active conversations, PostgreSQL ensures history is never lost. The `ConversationSyncService` bridges them asynchronously without blocking user interactions.

**Alternative options:**

| Tool | Best For | Notes |
|------|----------|-------|
| **Mem0** | Intelligent memory layer | Auto-extracts facts, manages decay |
| **pgvector** | Relational + vector | When you need SQL + embeddings |
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

> **Deep Dive**: See [Course 2, Module 3: Memory Management - Hybrid Redis + PostgreSQL Architecture](/ai-bootcamp-pages/course-2/03-memory-management/) for production implementation patterns including the Context Provider pattern, ConversationSyncService, database schemas, and graceful degradation strategies.

### 8. PDF Tooling

Extract text from documents for context injection or RAG pipelines. The right tool depends on your document complexity.

#### PyMuPDF (fitz) - Simple and Fast

Best for straightforward text extraction from standard PDFs.

```python
# Simple extraction with PyMuPDF (from bootcamp app)
import fitz

def extract_text(pdf_bytes: bytes) -> str:
    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    return "\n\n".join(page.get_text() for page in doc)
```

**Pros:** Fast, lightweight, no external dependencies
**Cons:** Struggles with complex layouts, tables, and images

#### Docling - Enterprise Document Understanding

[Docling](https://ds4sd.github.io/docling/) is IBM's open-source library for parsing complex documents. It goes beyond simple text extraction to understand document structure.

**What Docling handles that PyMuPDF doesn't:**

| Feature | PyMuPDF | Docling |
|---------|---------|---------|
| Basic text extraction | ✅ | ✅ |
| Table extraction | ❌ | ✅ (as structured data) |
| Image extraction | Basic | ✅ (with captions) |
| Layout understanding | ❌ | ✅ (headers, sections, lists) |
| Multi-format support | PDF only | PDF, DOCX, PPTX, HTML, images |
| OCR for scanned docs | ❌ | ✅ |
| Markdown output | ❌ | ✅ |

**Installation:**

```bash
pip install docling
```

**Basic Usage:**

```python
from docling.document_converter import DocumentConverter

converter = DocumentConverter()
result = converter.convert("document.pdf")

# Get markdown representation (great for LLM context)
markdown = result.document.export_to_markdown()

# Access structured elements
for table in result.document.tables:
    print(table.export_to_dataframe())  # Tables as pandas DataFrames
```

**Why Markdown output matters:**

LLMs understand markdown structure. Docling preserves:
- Headings hierarchy (`#`, `##`, `###`)
- Tables in markdown format
- Lists and bullet points
- Code blocks
- Image references with captions

```python
# Example: Converting a technical PDF for RAG
from docling.document_converter import DocumentConverter

converter = DocumentConverter()
result = converter.convert("technical_manual.pdf")

# This markdown preserves structure the LLM can reason about
context = result.document.export_to_markdown()

# Now inject into your prompt
prompt = f"""Based on this documentation:

{context}

Answer: How do I configure the system?"""
```

#### When to Use Each

| Scenario | Recommended Tool |
|----------|------------------|
| Simple text PDFs (articles, reports) | PyMuPDF |
| PDFs with tables you need to query | Docling |
| Scanned documents | Docling (with OCR) |
| Mixed document types (PDF, DOCX, PPTX) | Docling |
| Maximum speed, minimal dependencies | PyMuPDF |
| Complex layouts (multi-column, figures) | Docling |

#### Best Practices for Document Processing

1. **Preserve structure** - Use markdown output to maintain headings and sections
2. **Handle tables specially** - Extract tables as structured data, not flattened text
3. **Add metadata** - Track source document, page numbers, section titles
4. **Chunk intelligently** - Split at section boundaries, not arbitrary character counts
5. **Test with real documents** - Your production documents may have quirks

## Hands-On Exercise

### Part 1: Test Simple Document Processing

1. Start the bootcamp app with `docker-compose up`
2. Open the Chat UI at http://localhost:3000
3. Click the **Upload Document** button in the chat interface
4. Select a PDF file from your computer
5. The document text is extracted and stored in memory - no embeddings, no vector store
6. Ask the agent questions about your uploaded document
7. Notice how the full document context is injected into the conversation

### Part 2: Test Thread Memory

1. Open the Chat UI at http://localhost:3000
2. Test conversation continuity:
   - Send: *"My name is Alice and I am learning Python"*
   - Send: *"What is my name and what am I learning?"*
   - Verify the agent remembers your context
3. Test memory isolation:
   - Open a new incognito tab
   - Ask: *"What is my name?"*
   - Verify the agent doesn't know (new thread = fresh context)

### Part 3: Inspect Storage

1. Access Redis Commander at http://localhost:8001
2. Find `thread:{id}:messages` keys
3. View the JSON conversation history
4. Note the TTL countdown (24 hours default)

### Key Takeaway

The bootcamp app demonstrates that **simple works**. No vector database, no embedding API calls - just a Python dictionary and direct context injection. Start here. Add RAG only when you outgrow these limits.
