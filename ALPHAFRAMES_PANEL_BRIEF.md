# AlphaFrames Panel Brief

## Project Summary

AlphaFrames is a production-oriented web application for generating short-form vertical finance videos from live market data. It allows a user to select crypto, stocks, or ETFs, apply a reusable storytelling template, preview the video instantly, and export an MP4 using Remotion.

The product goal is not only to visualize price history, but to turn market data into repeatable, creator-friendly content that can be generated daily at scale.

## Core Problem

Financial content creators often have three separate problems:

1. Getting reliable market data from multiple sources.
2. Turning that data into a repeatable narrative.
3. Rendering short-form videos quickly enough to support daily output.

AlphaFrames solves this by separating:

- data fetching
- template logic
- UI/dashboard controls
- video composition/rendering

This keeps the system maintainable and makes it easier to add new templates or asset classes over time.

## What The Application Does

The current application supports:

- crypto, stock, and ETF data input
- single-asset videos and mixed-asset comparison videos
- investment amount input
- reusable storytelling templates
- batch generation
- structured JSON generation
- live Remotion preview inside the dashboard
- local MP4 export
- saved local history
- content idea suggestions

Supported templates:

- `LAST_30_DAYS`
- `LAST_1_YEAR`
- `BEST_DAY_TO_BUY`
- `DCA_STRATEGY`
- `THEN_VS_NOW`
- `COMPARE_ASSETS`

## Product Positioning

This project is designed more like a content engine than a one-off demo.

The intent is to support a workflow where a creator or operator can:

1. choose a market story
2. generate a consistent video
3. review the preview
4. render the final asset
5. repeat the process across multiple tickers

## Technical Stack

- Next.js App Router
- React 19
- Tailwind CSS
- Remotion
- TypeScript
- Zod

External data providers:

- CoinGecko for crypto
- Yahoo Finance chart data for stocks and ETFs

## Architecture Overview

Top-level structure:

```text
app/
components/
data/
lib/
remotion/
templates/
types/
video/
```

### 1. Data Layer

Located in:

- [/Users/viniciusscorsatto/Desktop/AI Projects/Crypto/data/coingecko.ts](/Users/viniciusscorsatto/Desktop/AI Projects/Crypto/data/coingecko.ts)
- [/Users/viniciusscorsatto/Desktop/AI Projects/Crypto/data/yahoo.ts](/Users/viniciusscorsatto/Desktop/AI Projects/Crypto/data/yahoo.ts)
- [/Users/viniciusscorsatto/Desktop/AI Projects/Crypto/data/index.ts](/Users/viniciusscorsatto/Desktop/AI Projects/Crypto/data/index.ts)

Responsibility:

- fetch current and historical data
- normalize different providers into one internal shape
- keep UI and video logic independent from raw API response formats

This was an intentional design choice so the application can switch providers later without rewriting templates or scene logic.

### 2. Template Engine

Located in:

- [/Users/viniciusscorsatto/Desktop/AI Projects/Crypto/templates](/Users/viniciusscorsatto/Desktop/AI Projects/Crypto/templates)

Responsibility:

- convert normalized asset data into standardized video JSON
- keep storytelling rules outside the UI
- ensure each template is independently testable and maintainable

Each template returns structured output such as:

- date window
- start and end prices
- return percentage
- investment outcome
- hook label
- context label
- result label
- timeline for chart rendering
- insight strings for closing scenes

This modularity is important because it allows content strategies to evolve without creating dashboard complexity.

### 3. Dashboard Layer

Main UI lives in:

- [/Users/viniciusscorsatto/Desktop/AI Projects/Crypto/components/dashboard-shell.tsx](/Users/viniciusscorsatto/Desktop/AI Projects/Crypto/components/dashboard-shell.tsx)

Responsibility:

- collect user inputs
- trigger generation and rendering
- show live preview
- manage local history
- support batch workflows

The dashboard acts as an operator console rather than a consumer-facing app.

### 4. API Layer

Routes:

- [/Users/viniciusscorsatto/Desktop/AI Projects/Crypto/app/api/generate/route.ts](/Users/viniciusscorsatto/Desktop/AI Projects/Crypto/app/api/generate/route.ts)
- [/Users/viniciusscorsatto/Desktop/AI Projects/Crypto/app/api/render/route.ts](/Users/viniciusscorsatto/Desktop/AI Projects/Crypto/app/api/render/route.ts)
- [/Users/viniciusscorsatto/Desktop/AI Projects/Crypto/app/api/suggest/route.ts](/Users/viniciusscorsatto/Desktop/AI Projects/Crypto/app/api/suggest/route.ts)

Responsibility:

- generate structured video payloads
- render MP4 outputs
- support content idea suggestions

This keeps rendering and generation server-side rather than mixing it into client state logic.

### 5. Video Composition Layer

Located in:

- [/Users/viniciusscorsatto/Desktop/AI Projects/Crypto/video](/Users/viniciusscorsatto/Desktop/AI Projects/Crypto/video)

Responsibility:

- render reusable video scenes
- separate single-asset and comparison compositions
- keep visual storytelling modular

Important scenes include:

- intro/hook scene
- context scene
- timeline graph scene
- growth/value scene
- result scene
- comparison chart scene
- comparison stats scene
- CTA end scene
- disclaimer scene

## Key Product Decisions

### Decision 1: Template Logic Is Separate From UI

Why:

- avoids hardcoded business logic in the dashboard
- makes it easier to add new content formats
- allows one input flow to support many narratives

Impact:

- better scalability
- cleaner maintenance
- easier evaluation of content ideas independently from interface work

### Decision 2: Data Providers Are Normalized Before Use

Why:

- CoinGecko and Yahoo Finance return different shapes
- video scenes should not care which provider was used
- templates should operate on business meaning, not raw transport format

Impact:

- reduced coupling
- easier provider replacement later
- simpler template implementation

### Decision 3: Remotion Is Used As The Rendering Backbone

Why:

- React-based video composition fits the project’s component architecture
- allows preview and export to stay conceptually aligned
- supports motion, sequencing, and reusable scenes well

Impact:

- faster iteration on storytelling and design
- code reuse between preview and final render
- production-friendly MP4 export path

### Decision 4: Comparison Videos Were Treated As A Distinct Story Type

Why:

- head-to-head content has different visual priorities from single-asset stories
- comparisons need winner/loser hierarchy
- user testing showed this flow benefits from a stronger “showdown” opener

Impact:

- clearer storytelling
- better contrast between asset roles
- more engaging hook for comparison content

### Decision 5: Hook-First Storytelling Replaced Brand-First Storytelling

Original direction:

- branded logo intro first

Revised direction:

- question / payoff tease first
- chart acts as proof later
- branding becomes secondary

Why:

- better aligned with short-form content behavior
- stronger retention at frame zero
- more effective for TikTok, Reels, and Shorts-style pacing

### Decision 6: End CTA Became A Full-Screen Scene

Why:

- footer-style CTAs were too weak
- end-card CTA creates a cleaner loop
- stronger final action improves content utility and evaluation quality

Impact:

- more intentional ending
- clearer call to action
- stronger separation between result and conversion moment

## Visual / UX Design Decisions

### Dark Data World + Bright Conversion Beats

Most of the video experience uses a dark data-driven visual language:

- black background
- neon green / red outcome colors
- chart-led proof scenes

However, the intro and CTA evolved toward brighter, high-contrast screens to improve:

- initial attention capture
- readability
- loop friendliness

This split was intentional:

- dark = analysis / proof
- bright = hook / conversion

### Motion Strategy

Motion is used to support storytelling rather than decorate the UI:

- chart reveal for proof
- delayed payoff scene after the graph
- branded end card for the CTA

The pacing was iterated based on readability and visual retention, especially in the first seconds of the video.

## Current Strengths

- modular architecture
- reusable template engine
- mixed asset support
- local render/export workflow
- live preview in the dashboard
- short-form-focused storytelling refinements
- scalable foundation for more templates and automation

## Current Constraints

- persistence is local-first rather than database-backed
- rendering is local rather than queued/background-job based
- API provider strategy is sufficient for current scope but could be upgraded for Phase 2
- social publishing is not yet implemented
- content analytics and performance feedback loops are not yet implemented

## Why This Project Is Evaluation-Ready

This project is suitable for panel evaluation because it demonstrates:

- product thinking, not just coding
- clear separation of concerns
- iterative UX and storytelling refinement
- practical use of live APIs
- reusable video system design
- awareness of scalability and next-phase architecture

It is not only a functional generator, but a system designed around repeatable daily content production.

## Suggested Evaluation Criteria

A panel reviewing AlphaFrames could reasonably evaluate it across:

- architecture quality
- modularity
- scalability
- clarity of product decisions
- UX/storytelling quality
- feasibility for real-world creator workflows
- implementation quality of preview and render flow

## Local Run Instructions

Install and run:

```bash
npm install
npm run dev
```

Or use:

```bash
./start.sh
```

Build and verify:

```bash
npm run typecheck
npm run build
```

Render:

```bash
npm run render
```

## Download / Share

This brief itself can be downloaded directly from:

- [/Users/viniciusscorsatto/Desktop/AI Projects/Crypto/ALPHAFRAMES_PANEL_BRIEF.md](/Users/viniciusscorsatto/Desktop/AI Projects/Crypto/ALPHAFRAMES_PANEL_BRIEF.md)

## Conclusion

AlphaFrames is a modular content-generation platform for finance-focused short-form video. Its strongest qualities are the separation of data, template, and rendering concerns, plus the iterative design decisions that moved it closer to a real creator workflow rather than a static technical demo.
