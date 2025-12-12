# AI Engineering Bootcamp

A two-week intensive program covering AI-powered development, context engineering, agentic workflows, and production systems.

**Live site:** https://propel-ventures.github.io/ai-bootcamp-pages/

## Curriculum

### Week 1: Elements of AI Engineering

| Module | Topic |
|--------|-------|
| 1 | AI-Powered Developer Productivity |
| 2 | Working with Models |
| 3 | Context Engineering & RAG |
| 4 | Model Context Protocol (MCP) |
| 5 | Enterprise Foundations |

### Week 2: AI Workflows & Engineering

| Module | Topic |
|--------|-------|
| 1 | Workflow Frameworks |
| 2 | Agentic Development in Practice |
| 3 | Human-in-the-Loop Patterns |
| 4 | Production Systems |
| 5 | Emerging Protocols |

## Local Development

```bash
cd site
npm install
npm run dev
```

The dev server runs at http://localhost:4321

## Adding Content

Module content lives in `site/src/content/modules/course-{N}/`. Each module is a markdown file with frontmatter:

```yaml
---
title: "Module Title"
course: 1
module: 1
description: "Brief description"
objectives:
  - "Learning objective 1"
  - "Learning objective 2"
resources:
  - title: "Resource Name"
    url: "https://..."
    type: "docs"  # docs | video | repo | article
quiz:
  - question: "Question text?"
    options:
      - "Option A"
      - "Option B"
      - "Option C"
      - "Option D"
    answer: 0  # Zero-indexed
---

## Overview

Module content in markdown...
```

## Deployment

The site deploys automatically to GitHub Pages when changes to `site/**` are pushed to `main`.

## Tech Stack

- [Astro](https://astro.build/) - Static site generator
- [React](https://react.dev/) - Interactive components (quizzes)
- [Tailwind CSS](https://tailwindcss.com/) - Styling
