---
description: Review and improve a bootcamp course module (currency, correctness, editorial, pedagogy) with online verification, then apply fixes on approval
argument-hint: <course-N/mM | module file path | e.g. "course-2 module 4">
---

You are reviewing a single AI-bootcamp course module and improving it to client-delivery quality. The target module is: **$ARGUMENTS**

Content lives in `site/src/content/modules/course-{N}/NN-*.md`. If the argument is ambiguous, resolve it by listing that course's files and matching the module number; confirm the resolved file before proceeding.

## Method

1. **Read the WHOLE module file first** — every line, not excerpts. Files can be longer than they look; a grep afterwards to confirm you've seen the end (`wc -l`) is worth it. (We once missed a whole section by stopping early.)

2. **Review across four lenses.** Track findings with a todo list.

   - **Factual currency (the top priority — verify, don't trust memory).** Today's date matters: model lineups, prices, and URLs move fast. Identify every checkable claim — model names/IDs, token prices, SDK/library APIs and idioms, tool/product names, documentation URLs, version numbers, protocol/spec details — and **verify each against current official documentation using WebSearch/WebFetch**. For several independent claims, dispatch **parallel subagents** (general-purpose) to verify in batches and keep your context clean. Never state a model name, price, or "current version" from memory. Watch for the replacement-is-also-stale trap (e.g. a "fix" that names a model which has itself since been superseded).
   - **Code correctness (if the module has code).** Look for broken or deprecated APIs (verify library idioms are current), and real bugs — e.g. request-scoped DB sessions used in fire-and-forget background tasks, `async` functions doing blocking I/O, un-referenced `asyncio` tasks, deprecated stdlib calls (`datetime.utcnow()`). A "production"-titled section should not model a bug.
   - **Editorial / structure.** Spelling and grammar; broken markdown links (a space between `]` and `(`); duplicate headings; a `description` frontmatter that duplicates the first objective; and the recurring **"opener wrongly bulleted"** pattern — a framing/scenario sentence sitting as the first bullet of a list should be a standalone intro paragraph, since bullets are for listing related items.
   - **Pedagogy / quality.** Does it read as a **walkthrough a learner can follow and build from**, or a bullet-point outline that only *describes* things? Prefer teaching prose and connected, numbered steps over topic fragments. **Expand every acronym on first use** as "full form (ACRONYM)" — except universally-known developer terms (API, CLI, SDK, IDE, UI, JSON, HTTP). Ensure a hands-on exercise exists; add governance/security or cross-links to related modules where a production topic is thin.

3. **Present a prioritised review** before changing anything: group as must-fix / should-fix / nice-to-have, cite `file:line`, and give the proposed fix for each. **Surface genuine user decisions rather than guessing** — e.g. deployment names or config strings tied to their own infrastructure (verify separately, don't invent), the depth of a rewrite, or which of several current options to standardise on. Ask, using a multiple-choice question when the options are discrete.

4. **Apply only what's approved.** Mechanical, unambiguous fixes can be applied straight away once the user says go; large rewrites need explicit sign-off on scope/voice (show a short before/after sample if the voice is in question).

5. **Preserve the spine on any rewrite.** When restructuring for style, do not change what the exercise/walkthrough actually *does*. After a rewrite, grep both the old (committed) and new versions for the key markers (tasks, tools, artifacts, code identifiers, links) and confirm the substance is unchanged — only presentation and verified currency fixes should differ.

6. **Verify the result.** Run `cd site && npm run build` and confirm it passes. Grep the file to confirm stale strings are gone and new content/sections are present.

7. **Offer to commit** (this project commits per-module directly to `main`). Use a `docs(course-N/mM): …` subject and end the commit message with:
   `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>`
   Only commit/push when the user asks.

## Notes
- All prices, model names, SDK APIs, and URLs must be re-verified against current vendor docs at review time — a prior review's "verified" values may already be stale.
- Keep the module's existing voice; improve clarity, don't rewrite personality.
