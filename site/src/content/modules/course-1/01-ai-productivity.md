---
title: "AI-Powered Developer Productivity"
course: 1
module: 1
description: "Master AI coding assistants for daily productivity across all environments"
objectives:
  - "Master AI coding assistants for daily productivity across all environments"
  - "Apply pipeline-first development strategies (desktop and pipeline parity)"
  - "Tailor workflows for different contexts (enterprise vs greenfield)"
resources:
  - title: "Cursor Documentation"
    url: "https://docs.cursor.com/"
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

Essential for all developers, this module aligns with development excellence principles. Be efficient in using AI for development in all settings: desktop, pipeline, enterprise, and greenfield projects.

## Topics Covered

### Working with AI Coding Assistants
- Cursor, Claude Code, GitHub Copilot, Codex CLI
- Understanding each tool's strengths and ideal use cases
- Combining multiple assistants for maximum productivity

### Pipeline-First Development
- Local workflows vs pipeline integration
- Ensuring consistency between development and CI/CD
- Best practices for reproducible builds

### Best Practices
- AGENTS.md patterns for AI context
- Workflow spec-driven development approaches
- Using AI to understand legacy codebases

### Team Configuration
- Developer MCP integrations
- Instructions and skills configuration
- Team-wide standardization

---
# Hands-on Exercise



## Exercise 1: Never Vibe Code; Rather Guide Code

- Most of the time will be guide coding which means you let the AI coding assistant do the heavy lifting while you guide it through the process. 
- You are ready, comprehending and understand every change made line by line, word by word. 
- You are in control of the process at all times.
- There is a place for vibe coding such as prototyping, spike and research but not code for production systems.
- Cursor is the recommened AI coding assistant for high quality vibe coding meanwhile we recommend Claude code with Optus latest models for guide coding.
- To learn about best AI model + tool combinations, follow Gosucoder on Youtube and watch [this episode](https://www.youtube.com/watch?v=jrQ8z-KMtek)

### Prerequisites
- .NET Core SDK installed on your machine
- An AI coding assistant of your choice (e.g., GitHub Copilot, Claude Code, Cursor)
- A github repository you can push code (it should be private)

### Task1
- create an API in dotnet core that exposes a single endpoint which returns "Hello, World!" when accessed via HTTP GET request. Use an AI coding assistant of your choice to help you generate the code and set up the project structure. Document the steps you took and any challenges you faced during the process.
- Add another endpoint that takes a name as a query parameter and returns a personalized greeting message, e.g., "Hello, [Name]!".

### Task2
- Say when you wanted to deploy this API, security requests to show that no PII is returned on any endpoints
- Create a custom/sub agent (e.g., name it `implementation-plan`) to help generate a plan for any requirments in this repository
- We usually donot create the conent of the custom/sub agents manually, rathe we copy from the community such as:
  - Superpowers: https://github.com/obra/superpowers
  - Awesome Copilot: https://github.com/github/awesome-copilot/tree/main

**⚠️ Heads Up:** If you're installing the Superpowers skills repo, you need to have Superpowers installed first.
In Claude Code:
```bash
/plugin marketplace add obra/superpowers-marketplace
/plugin install superpowers@superpowers-marketplace
```

- After you choose an Implementation-plan agent, select that agent and ask to to create a plan to implement PII redaction middleware that redacts email addresses, phone numbers, and tax file numbers (TFNs) from all API responses.
- Depending on the model and AI coding assistant, the agent might overengineer the solution, so make sure to review the plan (no vibe planning)
- Example of what to prompt: 
  - "Follow ALL instructions files in this repository"
  - "We need MVP solution with acceptable level of test coverage"
  - "We should not move more than 2 integration tests and 5-10 unit tests"
  - So you don't end up with poor solution say: "We need middleware so future endpoints can also benefit from this solution"
- Notice how iteration in prompting and the order of the prompts matter and make a difference in the output.
- They might call this prompt engineering, but it's really just effective solution design. 
- You are making tradeoffs and balancing complexity with delivery speed.

**Example iteration progression:**
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

- Now that you're happy with the plan, create another custom/sub agent (e.g., `jira-ticket-creator`) that helps you create Jira cards to track the work.
- In scrum, you then discuss the ticket with your team during backlog grooming to get their input and ensure everyone is aligned on the implementation approach.



### Task 3 Implement the plan

- Before you start coding, check if you need to start a new session with your AI coding assistant
- Rule of thumb: is context windows is more than 125k tokens, start a new session. Always keen an eye on the token usage
- as of Dec 2025, Copilot doesn't show token usage, in the ai kit, there will be a prompt to get that infomation.

**Check context usage example:**
```
📊 Usage: 83.8k / 125k (67% Context Rot) → 🟡 5-8 turns remaining
Consumers: MCP (35k) + Instructions (25k) + Attachments (12k) + History (8k)
```

- Next we will use TDD to implement the plan created in Task 2
- Create custom/sub agents to help with TDD workflow (e.g., `tdd-red`, `tdd-green`, `tdd-refactor`)
- You will find them in the Awesome Copilot repo mentioned earlier; adapt them to your ai coding assistant of choice
- These agents should contain instructions for each TDD phase (you'll define what they do)
- Use your `tdd-red` agent to implement the first test case from the plan created in Task 2.
- It should create the test case and ensure it fails *for the right reason* and then stop.

**RED phase example (failing test):**
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

- Review the test case, ensure it aligns with your expectations and the plan.
- Notice with AI coding assistants, your red/green/refactor cycles will be much bigger than the usual small increments. That is OK as long you fully understand and review each step.
- Next, use your `tdd-green` agent to implement the minimum code required to make the test case pass.

**GREEN phase example (minimal implementation):**
```csharp
public class PiiRedactionService
{
    private readonly Regex _emailPattern = new(@"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b");
    
    public string Redact(string input)
        => _emailPattern.Replace(input, "[REDACTED]");
}
// ✅ Test passes
```

- Review the code, ensure it aligns with your expectations and the plan.
- Repeat the process for each test case in the plan until all test cases are implemented and passing
- While the agent is running, take the time to think about what refactoring might be needed before the code gets too complex or messy
- refactoring might include:
  - refactoring the test cases themselves for clarity and maintainability
  - adding highlevel tests such as integration tests to ensure the middleware works as expected
  - the timing of the refactor phase is important for best implementation and no plan can make this upfront
  - It is OK to go back to the plan if needed and refactor is the window to reconsider the overall design
  - It is OK to start new totally different approach since as you have seen, 90% of the code is generated by the AI coding assistant

- Once all test cases are passing, use your `tdd-refactor` agent to refactor the code for readability, maintainability, and performance.
- Finally, run all tests to ensure everything is working as expected.

### Task 4: Reflect and Share
- Take a 10-15 minute break from the coding excercise and read the [DORA report on AI in 2025] (https://dora.dev/research/2025/dora-report/)
- The main take away is how AI speeds up both you good practices as well as anti-patterns.
- Post in the bootcamp channel your takeaways from the report. Keep an eye what others are saying as well.

### Task 5: Pull Request, Code Review
- Create a pull request for your changes.
- You can ask the agent to do reveiw the code locally (against your current instrustions/skills)
- You can then ask the agent to create the pull request description based on the changes made
- Consider creating custom prompts/slash commands (e.g., `/raise-pull-request`, `/draft-commit-message`) for common workflows
- Set up GitHub MCP integration if available.
- It appears lazy but overtime, you will have standardised and high quality pull request descriptions while saving your time
- In practice, once the PR is raised, you would ask a team member to review the code. Small PRs for the win; nothing chnaged with AI since we are not vibe coding!
- In addition, you should have AI agent set up to do code reviews as well.
- Github Copilot allows you to assign agent reviewers to PRs (soon it will be also allowing anthropic agents to do that)
- Whatever tool you use, make sure to ask your Platform Engineering team to help:
  - Set up the ai code reviewers for your team
  - Configure the instructions/skills for the reviewers
  - Setup MCP running in the pipeline

**Essential MCP Servers:**

These MCP servers are must-haves for productive AI-assisted development:

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
      "args": ["-y", "@modelcontextprotocol/server-playwright"]
    },
    "apm": {
      "type": "http",
      "url": "<APM endpoint: Datadog, NewRelic, or CloudWatch>"
    }
  }
}
```

**Why these MCPs are essential:**

- **Context7**: Fetches up-to-date library documentation and API references
  - _Why critical_: AI models were trained on outdated data; Context7 provides current docs for frameworks like Next.js, React, .NET
  - _Use case_: "How do I use the latest .NET 9 features?" → Context7 retrieves current documentation

- **Atlassian (Jira/Confluence)**: Access to tickets, documentation, and team knowledge
  - _Why critical_: Understands project context, requirements, and existing decisions without manual copy-paste
  - _Use case_: "Implement JIRA-12345" → Agent reads ticket, understands acceptance criteria, checks related docs

- **Playwright**: Browser automation and testing capabilities
  - _Why critical_: AI can write, run, and debug E2E tests; validate UI changes automatically
  - _Use case_: "Write E2E test for login flow" → Agent generates test, runs in browser, reports results

- **APM (Datadog/NewRelic/CloudWatch)**: Production logs, metrics, and traces
  - _Why critical_: Diagnose production issues with real data; understand actual system behaviour
  - _Use case_: "Why is checkout failing?" → Agent searches logs, finds errors, proposes fixes based on traces

**Impact without these MCPs:**
- ❌ AI gives outdated or incorrect API usage (no Context7)
- ❌ Duplicate work or miss requirements (no Atlassian)
- ❌ Manual E2E testing slows feedback cycle (no Playwright)
- ❌ Debugging production issues blind (no APM)


### Task 6 Spike (optional)
- Having the default ai coder reviewers without the above is usally useless.
- Once you have that ai agent setup in the pipeline, you can also assign a plan to the ai agent to resolve in the pipeline
- You can save instructions for a percentage of pullrequest that are boring, safe or repetative for the agent to implement
- You should aim 5-10% of your pull requests to be handled by the ai agent in the pipeline
- Using Propel Copilot, try to assign the ai agent the same plan and see if it can produce the same results as your TDD workflow

### Task 7: Learn more working in legacy systems
- Working in legacy systems is always challenging. AI coding assistants are not as productive in these systems.
- Watch this talk https://www.youtube.com/watch?v=rmvDxxNubIg
- Familiarise yourself with terms and concepts such as:
  - The research - plan - implement workflow
  - Spec-driven development
  - Dump zone
  - Plans include what code will change
- Share your thoughts in the bootcamp channel and keep an eye on what others are saying as well.



## Exercise 2: AI Kit Setup [for you and your team and organisation]

- Throughout the previous exercise, you have created custom/sub agents and instructions/skills for your AI coding assistants
- Ideally, you would want to standardise these for your team and organisation
- Since most of the work is around md files and MCP JSON settings, one of the best ways is to use git alias and git hooks to sync from a single repository that has source of truth for all prompts and settings
- Create a repository

## Task 1: Standardize Your Team's AI Kit

**Goal:** Create a single source of truth for prompts, agents, and MCP configurations that syncs across all team repositories.

### Setup GitHub Repository

**Create central config repo:**
```bash
# 1. Create new repo on GitHub: yourorg/ai-kit-config
# 2. Clone and add structure:
mkdir -p .github/{instructions,mcp-servers}
touch .github/instructions/{coding-standards,tdd-workflow}.instructions.md
touch .vscode/mcp.json
```

**Configure git alias for sync:**
```bash
# Add to ~/.gitconfig
git config --global alias.ai-kit '!bash -c "
  TEMP_DIR=/tmp/ai-kit-sync-$$;
  git clone https://github.com/yourorg/ai-kit-config $TEMP_DIR;
  bash $TEMP_DIR/sync-ai-config.sh;
  rm -rf $TEMP_DIR
"'
```

**Create sync script (sync-ai-config.sh):**
```bash
#!/bin/bash
# Copy .github/ files to current repo
cp -r .github/instructions/* ../.github/instructions/
cp -r .vscode/mcp.json ../.vscode/

# Update .gitignore
echo ".github/instructions/*.instructions.md" >> ../.gitignore
echo ".vscode/mcp.json" >> ../.gitignore

echo "✅ AI Kit synced successfully"
```

### Daily Usage

**Developers run:**
```bash
# In any repository
git ai-kit
```

**What happens:**
1. Clones ai-kit-config to `/tmp`
2. Copies instructions/prompts to local repo
3. Updates MCP server configs
4. Cleans up automatically

### Optional: MCP Server Distribution
 - Add a git hook on new branches to run the same script.

### Optional: MCP Server Distribution

**Add pre-built MCP servers:**
```
ai-kit-config/
├── .github/mcp-servers/
│   ├── datadog-mcp.exe
│   └── github-mcp.exe
└── sync-ai-config.sh  # Updated to copy exe files
```

**Updated sync script:**
```bash
# Copy MCP server executables
mkdir -p ~/mcp-servers
cp .github/mcp-servers/*.exe ~/mcp-servers/
chmod +x ~/mcp-servers/*.exe
```

### Benefits
- ✅ Single command syncs latest team standards
- ✅ Instructions update without PR overhead  
- ✅ New team members get standards instantly
- ✅ Cross-IDE support (VSCode, Rider, VS2022). You can customise the script so that it works across IDEs (if needed)


### Watch For
- Resist supporting multiple IDEs within a team and even organisation. As in previous exercise, it is not only your machine but also the pipeline that needs to use this kit

---

