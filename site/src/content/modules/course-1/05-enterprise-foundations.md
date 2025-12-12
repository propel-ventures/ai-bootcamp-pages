---
title: "Enterprise Foundations"
course: 1
module: 5
description: "Test, debug, secure, and manage costs in production AI systems"
objectives:
  - "Test and debug AI systems effectively"
  - "Implement security boundaries"
  - "Manage costs in production"
resources:
  - title: "DeepEval Documentation"
    url: "https://docs.confident-ai.com/"
    type: "docs"
  - title: "Phoenix Observability"
    url: "https://docs.arize.com/phoenix"
    type: "docs"
  - title: "Presidio PII Detection"
    url: "https://microsoft.github.io/presidio/"
    type: "docs"
quiz:
  - question: "What is the primary purpose of structured logging in AI systems?"
    options:
      - "Reduce log file size"
      - "Enable debugging and observability at scale"
      - "Comply with regulations"
      - "Speed up inference"
    answer: 1
  - question: "What is prompt injection?"
    options:
      - "A way to optimize prompts"
      - "Malicious input that manipulates AI behavior"
      - "A caching technique"
      - "A model fine-tuning method"
    answer: 1
---

## Overview

Real-world AI deployment requires evaluation, security, and cost management.

## Topics Covered

### Evaluation & Observability
- Testing agents with DeepEval
- Debugging off-rails agents
- Phoenix and OpenInference logging

### Security
- Prompt injection detection
- MCP-Scan for tool permissions
- Presidio for PII handling
- Toxic flow analysis

### Cost Management
- Token economics
- LMCache and LiteLLM caching
- Usage monitoring

### Enterprise vs Greenfield
- Legacy integration
- Compliance gates
- Iteration cycles
