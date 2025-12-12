# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Static site for an AI bootcamp curriculum, built with Astro and deployed to GitHub Pages at `https://propel-ventures.github.io/ai-bootcamp-pages/`.

## Commands

All commands run from the `site/` directory:

```bash
cd site
npm install          # Install dependencies
npm run dev          # Start dev server (localhost:4321)
npm run build        # Build for production (outputs to site/dist/)
npm run preview      # Preview production build locally
```

## Architecture

### Content System
- **Content collections** defined in `site/src/content/config.ts` using Zod schemas
- **Module content** lives in `site/src/content/modules/course-{N}/` as markdown files with frontmatter
- Each module has: title, course number, module number, description, objectives, optional resources, optional quiz

### Routing
- Dynamic routes via `[...slug].astro` files in `site/src/pages/course-{N}/`
- `getStaticPaths()` generates routes from content collections at build time
- Base path is `/ai-bootcamp-pages` - all internal links must include this prefix

### Components
- **Astro components** (`.astro`) for static content: CourseCard, ModuleCard, ObjectivesList, ResourceLink
- **React component** (`Quiz.tsx`) for interactive quiz with localStorage persistence - uses `client:load` directive

### Deployment
- GitHub Actions workflow (`.github/workflows/deploy-pages.yml`) deploys on push to `main` when `site/**` changes
- Uses `trailingSlash: 'always'` in Astro config for GitHub Pages compatibility

## Module Frontmatter Schema

```yaml
title: "Module Title"
course: 1                    # Course number (1 or 2)
module: 1                    # Module order within course
description: "Description"
objectives:
  - "Objective 1"
resources:                   # Optional
  - title: "Resource"
    url: "https://..."
    type: "docs"             # docs | video | repo | article
quiz:                        # Optional
  - question: "Question?"
    options: ["A", "B", "C", "D"]
    answer: 0                # Zero-indexed correct answer
```
# Context Priming
Read the claude.md and other files in doc/* to prime your understanding