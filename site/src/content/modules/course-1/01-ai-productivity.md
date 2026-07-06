---
title: "AI-Powered Developer Productivity"
course: 1
module: 1
description: "Use AI coding assistants effectively across desktop, pipeline, enterprise, and greenfield work"
objectives:
  - "Master AI coding assistants for daily productivity across all environments"
  - "Apply pipeline-first development strategies (desktop and pipeline parity)"
  - "Tailor workflows for different contexts (enterprise vs greenfield)"
resources:
  - title: "Cursor Documentation"
    url: "https://cursor.com/docs"
    type: "docs"
  - title: "Claude Code Guide"
    url: "https://docs.anthropic.com/en/docs/claude-code"
    type: "docs"
  - title: "GitHub Copilot Docs"
    url: "https://docs.github.com/en/copilot"
    type: "docs"
quiz:
  - question: "What is the primary benefit of pipeline-first development?"
    options:
      - "Faster local builds"
      - "Desktop and pipeline parity"
      - "Reduced cloud costs"
      - "Simpler CI configuration"
    answer: 1
  - question: "Which file pattern helps AI tools understand your codebase structure?"
    options:
      - "README.md"
      - "AGENTS.md"
      - ".gitignore"
      - "package.json"
    answer: 1
---

## Overview

AI coding assistants change how you work in every setting — your editor, the pipeline, greenfield prototypes, and large enterprise codebases. This module is about using them *well*: staying in control, giving them the right context, and building habits that hold up in production rather than just in a demo.

You'll learn the core discipline first, then put it into practice by taking a small .NET API from an empty repository to a reviewed pull request — planning, testing, securing, and shipping a change with AI at each step, the way you would on a real team.

## Guide code, don't vibe code

The single most important habit in this module is **guide coding**. You let the AI assistant do the heavy lifting, but you direct it and you understand every change it makes — line by line, word by word. The AI writes most of the code; you own the design decisions and the review, and you stay in control of the process at all times.

That's the opposite of **vibe coding**, where you accept output without fully reading it. Vibe coding has its place — prototypes, spikes, throwaway research — but not in code headed for production. When something ships, you should be able to explain every line of it.

As a rule of thumb, Cursor is a strong choice for fast, exploratory vibe coding, while Claude Code with the latest Opus models (currently Claude Opus 4.8) suits the careful, review-every-step guide coding this module is built around. To go deeper on which model-and-tool combinations work best, follow [GosuCoder on YouTube](https://www.youtube.com/watch?v=jrQ8z-KMtek).

## Picking a tool

How you work matters far more than which assistant you use — and that's a position we take deliberately in this bootcamp. The research points the same way: what drives real returns is your workflow, review discipline, and context, not the specific tool — the DORA (DevOps Research and Assessment) report, for example, describes AI as an *amplifier* of your existing practices. So this whole walkthrough is intentionally tool-agnostic — do it in whatever you're comfortable with. If you want to dig into the evidence, start with the [2025 DORA report](https://dora.dev/research/2025/dora-report/), the [Stack Overflow Developer Survey](https://survey.stackoverflow.co/2025/ai), and [JetBrains' developer research](https://blog.jetbrains.com/research/2026/04/which-ai-coding-tools-do-developers-actually-use-at-work/).

In practice, most engineers settle on a primary daily driver rather than switching per task. It's common to *layer* a couple of complementary tools — in-editor autocomplete (GitHub Copilot) as a baseline, alongside an agentic tool (Claude Code or Cursor) for larger, multi-step work — but that's a stable setup, not constant tool-hopping. The main options today:

- **Claude Code** — Anthropic's CLI; strong for guided multi-step work, planning, and agentic tasks across a repo.
- **GitHub Copilot** — deeply integrated into VS Code and GitHub; inline completions, chat, PR review, coding agent.
- **Cursor** — an AI-first editor; strong for fast, in-editor work.
- **Codex CLI** — OpenAI's terminal agent.

Pick one that fits how you work, and put your energy into the workflow the rest of this module teaches.

## Key ideas this module builds on

Three ideas run underneath everything that follows:

- **Pipeline-first development.** The habit that matters most for reproducibility is *desktop and pipeline parity*: whatever an AI assistant does on your machine — running tests, applying instructions, using MCP (Model Context Protocol) servers — should also run in CI (continuous integration). If the pipeline can't reproduce it, it isn't real.
- **Give AI the right context.** Tools work far better when the repo tells them how it's built. The cross-tool standard for this is **AGENTS.md**, a file at the repo root that gives coding agents project context (it complements tool-specific files like `CLAUDE.md`). Together with spec-driven prompts, good context is what lets AI stay useful even in unfamiliar or legacy code.
- **Standardise across the team.** Custom agents, instructions/skills, and MCP configs are only valuable if the whole team — and the pipeline — share them. The final section shows one way to do that.

---

## Hands-on walkthrough: from empty repo to reviewed PR

The rest of the module is one continuous exercise. You'll build a small .NET API, then use AI to plan, test, secure, and ship a change to it — practising guide coding at every step.

### Prerequisites

You'll need:

- The .NET SDK installed on your machine
- An AI coding assistant of your choice (e.g., Claude Code, GitHub Copilot, or Cursor)
- A private GitHub repository you can push to

### Step 1 — Scaffold the API

Start by building the thing you'll later secure. Using your AI assistant, create a .NET API that exposes a single `GET` endpoint returning `"Hello, World!"`. Let the assistant generate the project structure and code — but read what it produces, and note the steps you took and any friction along the way.

Then extend it: add a second endpoint that takes a `name` query parameter and returns a personalised greeting, e.g. `"Hello, [Name]!"`.

### Step 2 — A security requirement lands: plan the change

Suppose you now want to deploy this API, and security requires you to demonstrate that no personally identifiable information (PII) is returned from any endpoint. Rather than jumping straight to code, you'll plan the change first.

Create a custom sub-agent — call it `implementation-plan` — to generate an implementation plan for requirements in this repo. You usually don't write these agents by hand; you copy proven ones from the community and adapt them, for example:

- [Superpowers](https://github.com/obra/superpowers)
- [Awesome Copilot](https://github.com/github/awesome-copilot/tree/main)

> **⚠️ Heads up:** the Superpowers skills repo requires Superpowers to be installed first. In Claude Code:
>
> ```bash
> /plugin marketplace add obra/superpowers-marketplace
> /plugin install superpowers@superpowers-marketplace
> ```

With the agent selected, ask it to plan a **PII redaction middleware** that redacts email addresses, phone numbers, and tax file numbers (TFNs) from all API responses. Review the plan carefully — depending on the model and tool, agents tend to over-engineer, so there's no vibe *planning* either.

The plan you get back depends heavily on how you prompt, and on the order of your prompts. A progression that works:

1. "Follow ALL instructions files in this repository"
2. "We need an MVP (minimum viable product) solution with an acceptable level of test coverage"
3. "We should not write more than 2 integration tests and 5–10 unit tests"
4. To avoid an under-engineered result: "We need middleware so future endpoints can also benefit from this solution"

People call this prompt engineering, but it's really just effective solution design — you're making trade-offs and balancing complexity against delivery speed. Watch how each prompt reshapes the output:

```
Initial plan: 24 files (too complex)
  ├── After "MVP + no dependencies": 8 files
  └── Final "middleware pattern": 6 files ✅
      ├── PiiRedactionService.cs
      ├── PiiRedactionMiddleware.cs
      ├── PiiRedactionServiceTests.cs (6-10 tests)
      ├── PiiRedactionMiddlewareTests.cs (1 integration)
      ├── Program.cs (registration)
      └── appsettings.json (config)
```

Once you're happy with the plan, create a second sub-agent — `jira-ticket-creator` — to turn it into Jira cards. On a real team you'd then take that ticket into backlog grooming so everyone is aligned on the approach before any code is written.

### Step 3 — Implement it test-first

Before coding, check whether you need to reset context. Modern models carry large context windows (200k–1M tokens), and tools like Claude Code auto-compact the conversation when it fills up (around 84% full). Rather than watching a fixed token count, use the built-in controls: `/context` to inspect usage, `/compact` (optionally with focus instructions) to summarise and continue, and `/clear` at natural task boundaries. VS Code and GitHub Copilot now surface token and context-window usage directly in the chat input, so keep an eye on it as you work.

```
📊 Usage: 83.8k / 200k (67% Context Rot) → 🟡 5-8 turns remaining
Consumers: MCP (35k) + Instructions (25k) + Attachments (12k) + History (8k)
```

Now implement the plan with test-driven development (TDD). Create three sub-agents for the cycle — `tdd-red`, `tdd-green`, and `tdd-refactor` — adapting versions from the Awesome Copilot repo above; each holds the instructions for its phase.

Start with **red**: have `tdd-red` write the first test case from your plan and confirm it fails *for the right reason*, then stop.

```csharp
[Fact]
public void Redact_EmailAddress_ReturnsRedacted()
{
    var service = new PiiRedactionService();
    var result = service.Redact("Email: test@example.com");
    Assert.Equal("Email: [REDACTED]", result);
}
// ❌ Error: Type 'PiiRedactionService' not found ✅ Correct failure
```

Review the test against your expectations and the plan. (With AI, your red/green/refactor cycles will be much larger than the usual small increments — that's fine, as long as you understand and review each step.) Then have `tdd-green` write the minimum code to make it pass:

```csharp
public class PiiRedactionService
{
    private readonly Regex _emailPattern = new(@"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b");

    public string Redact(string input)
        => _emailPattern.Replace(input, "[REDACTED]");
}
// ✅ Test passes
```

Review the code, then repeat red → green for each test case in the plan. While the agent works, think ahead about refactoring — before the code gets complex or messy. Refactoring might mean:

- tidying the test cases themselves for clarity and maintainability
- adding higher-level tests (e.g. integration tests) to confirm the middleware works end to end
- revisiting the plan — the refactor phase is your window to reconsider the overall design, and it's fine to restart with a different approach, since the AI generated most of the code anyway

The right *timing* for the refactor phase is a judgement call no plan can make up front. Once all tests pass, use `tdd-refactor` to improve readability, maintainability, and performance — then run the full suite to confirm everything still works.

### Step 4 — Reflect on how AI changes the work

Take a 10–15 minute break and read the [2025 DORA report on AI](https://dora.dev/research/2025/dora-report/). The key takeaway: AI accelerates your *good* practices and your anti-patterns alike — it amplifies whatever discipline (or lack of it) you bring. Post your takeaways in the bootcamp channel, and read what others share.

### Step 5 — Raise the pull request and set up AI review

Open a pull request (PR) for your change. You can have your assistant review the code locally against your instructions/skills first, then draft the PR description from the actual diff. It feels lazy, but over time you get standardised, high-quality PR descriptions for almost no effort — consider wrapping these in custom slash commands like `/raise-pull-request` and `/draft-commit-message`.

Then a human reviews it, as always: small PRs win, and nothing about that changes with AI — because you're guide coding, not vibe coding. You should *also* have an AI reviewer in the loop. GitHub Copilot lets you assign agent reviewers to PRs — you can request a Copilot code review from the GitHub UI or the `gh` CLI, and Claude models are already selectable in Copilot. Whatever you use, ask your Platform Engineering team to help set up AI reviewers for the team, configure their instructions/skills, and run MCP in the pipeline.

Most of an AI reviewer's value comes from the context you give it, and much of that context comes from **MCP servers**. A few are close to essential for AI-assisted development:

```json
{
  "mcpServers": {
    "context7": {
      "type": "http",
      "url": "https://mcp.context7.com/mcp"
    },
    "atlassian": {
      "type": "http",
      "url": "https://mcp.atlassian.com/v1/mcp"
    },
    "playwright": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@playwright/mcp@latest"]
    },
    "apm": {
      "type": "http",
      "url": "<APM endpoint: Datadog, NewRelic, or CloudWatch>"
    }
  }
}
```

Why each matters:

- **Context7** fetches up-to-date library documentation and API references. Models are trained on older data, so Context7 gives them current docs for frameworks like Next.js, React, and .NET — ask *"How do I use the latest .NET features?"* and it retrieves the current documentation.
- **Atlassian (Jira/Confluence)** gives the agent your tickets, docs, and team knowledge, so it understands requirements and prior decisions without manual copy-paste — *"Implement JIRA-12345"* and it reads the ticket, acceptance criteria, and related docs.
- **Playwright** adds browser automation and testing, so the AI can write, run, and debug end-to-end (E2E) tests and validate UI changes — *"Write an E2E test for the login flow"* and it generates the test, runs it in a browser, and reports back.
- **APM (application performance monitoring)** tools — Datadog, New Relic, CloudWatch — surface production logs, metrics, and traces, so the agent can diagnose real issues from real data — *"Why is checkout failing?"* and it searches the logs and proposes fixes from the traces.

Without these, the failure modes are predictable: outdated or incorrect API usage (no Context7), duplicated work or missed requirements (no Atlassian), slow manual E2E testing (no Playwright), and debugging production blind (no APM).

### Step 6 — Push work into the pipeline (optional)

An AI reviewer on its own — without the MCP context above — is usually useless. Once the agent is set up in the pipeline *with* that context, you can go further and assign it whole tasks to resolve there. Save instructions so that a slice of your boring, safe, or repetitive PRs are handled entirely by the agent in the pipeline — aim for around 5–10% to start. Try it: using Propel Copilot, assign the agent the same plan from Step 2 and see whether it produces results comparable to your own TDD run.

### Step 7 — Working in legacy systems

Legacy systems are where AI assistants struggle most — they're far less productive without good context and structure. Watch [this talk](https://www.youtube.com/watch?v=rmvDxxNubIg), then get familiar with the techniques that make AI viable in legacy code:

- the **research → plan → implement** workflow
- **spec-driven development**
- the **dump zone** (a scratch space for gathering context)
- writing **plans that state exactly what code will change**

Share your thoughts in the bootcamp channel, and keep an eye on what others are finding.

---

## Standardise your team's AI kit

Throughout the walkthrough you built custom agents and instructions/skills for your assistant. On a team, those are only worth it if everyone — and the pipeline — uses the same ones. Since most of the artefacts are just markdown files and MCP JSON, a simple approach is a single source-of-truth repository that each project syncs from via a git alias and git hooks.

**Goal:** create one repository of prompts, agents, and MCP configuration that syncs across all your team's repos.

### Set up the central repo

```bash
# 1. Create new repo on GitHub: yourorg/ai-kit-config
# 2. Clone and add structure:
mkdir -p .github/{instructions,mcp-servers}
touch .github/instructions/{coding-standards,tdd-workflow}.instructions.md
touch .vscode/mcp.json
```

Add a git alias that clones the config repo and runs its sync script:

```bash
# Add to ~/.gitconfig
git config --global alias.ai-kit '!bash -c "
  TEMP_DIR=/tmp/ai-kit-sync-$$;
  git clone https://github.com/yourorg/ai-kit-config $TEMP_DIR;
  bash $TEMP_DIR/sync-ai-config.sh;
  rm -rf $TEMP_DIR
"'
```

The sync script copies the shared files into the current repo (and keeps `.gitignore` clean on repeat runs):

```bash
#!/bin/bash
# Copy .github/ files to current repo
cp -r .github/instructions/* ../.github/instructions/
cp -r .vscode/mcp.json ../.vscode/

# Update .gitignore (only add entries that aren't already present)
grep -qxF ".github/instructions/*.instructions.md" ../.gitignore || echo ".github/instructions/*.instructions.md" >> ../.gitignore
grep -qxF ".vscode/mcp.json" ../.gitignore || echo ".vscode/mcp.json" >> ../.gitignore

echo "✅ AI Kit synced successfully"
```

### Daily use

In any repository, a developer just runs:

```bash
git ai-kit
```

which clones the config to `/tmp`, copies the instructions/prompts and MCP configs into the repo, and cleans up after itself. You can also add a git hook that runs the same script on new branches, so the kit stays current automatically.

### Optional: distribute pre-built MCP servers

You can ship pre-built MCP server binaries alongside the config and have the sync script install them:

```
ai-kit-config/
├── .github/mcp-servers/
│   ├── datadog-mcp.exe
│   └── github-mcp.exe
└── sync-ai-config.sh  # Updated to copy exe files
```

```bash
# Copy MCP server executables
mkdir -p ~/mcp-servers
cp .github/mcp-servers/*.exe ~/mcp-servers/
chmod +x ~/mcp-servers/*.exe
```

> **Note:** the `.exe` binaries above assume Windows. For Mac/Linux (or a mixed team), distribute platform-appropriate binaries or install servers via `npx`/package managers instead.

### Why it's worth it

- One command syncs the latest team standards
- Instructions update without PR overhead
- New team members get the standards instantly
- It works across IDEs (VS Code, Rider, VS 2022) — adapt the script if you need to

One thing to watch: resist supporting lots of different IDEs across the team or org. As with everything in this module, it's not only your machine that needs the kit — the pipeline does too, and every extra IDE is another thing to keep in parity.
