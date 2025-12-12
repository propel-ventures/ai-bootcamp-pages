---
title: "Workflow Frameworks - An Engineer's Perspective"
course: 2
module: 1
description: "Understand frameworks with engineering rigor and make informed decisions"
objectives:
  - "Understand frameworks with engineering rigor"
  - "Make informed framework vs custom decisions"
  - "Understand when workflows don't need to be agentic"
resources:
  - title: "LangGraph Documentation"
    url: "https://langchain-ai.github.io/langgraph/"
    type: "docs"
  - title: "Microsoft Agents Framework"
    url: "https://github.com/microsoft/agents"
    type: "repo"
quiz:
  - question: "When should you choose deterministic workflows over agentic?"
    options:
      - "Never, agentic is always better"
      - "When the task has predictable, well-defined steps"
      - "Only for simple tasks"
      - "When budget is limited"
    answer: 1
  - question: "What is a key advantage of LangGraph?"
    options:
      - "It's the oldest framework"
      - "ThoughtWorks 'Adopt' tier with TypeScript support"
      - "It doesn't require any coding"
      - "It only works with OpenAI"
    answer: 1
---

## Overview

Understand when to use frameworks, when to build custom, and when workflows don't need to be agentic.

## Topics Covered

### Framework vs Custom
- When frameworks add value
- Integration with existing codebases
- Build vs buy decisions

### Key Question: Does it need to be agentic?
- Deterministic vs agentic workflows
- Complexity trade-offs

### Framework Overview
- LangGraph (TypeScript focus)
- Microsoft Agent Framework (Aspire integration)
- n8n, Kueue (theory only)

### Engineering Mindset
- Why this framework?
- What problem does it solve?
- Evaluation criteria
