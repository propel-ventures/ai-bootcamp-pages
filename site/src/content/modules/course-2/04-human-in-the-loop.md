---
title: "Long-Running & Human-in-the-Loop Workflows"
course: 2
module: 4
description: "Design workflows with human checkpoints and implement async patterns"
objectives:
  - "Design workflows with human checkpoints"
  - "Implement async workflows with state persistence"
  - "Create validation and approval patterns"
resources:
  - title: "Temporal.io Documentation"
    url: "https://docs.temporal.io/"
    type: "docs"
quiz:
  - question: "Why are human checkpoints important in AI workflows?"
    options:
      - "To slow down the process"
      - "To ensure quality and catch errors before they propagate"
      - "To reduce costs"
      - "To comply with laws"
    answer: 1
---

## Overview

Production AI requires human validation and approval gates.

## Topics Covered

### Human Checkpoints
- Approval gate design
- Validation patterns

### Async Workflows
- State persistence
- Resumable workflows

### Safety
- Toxic flow analysis
- Escalation patterns

### Notifications
- Alerting strategies
- Human intervention triggers
