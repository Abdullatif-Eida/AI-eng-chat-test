# AI Tooling Decisions

This case study asked for three candidate options per major activity, one selected option, and the trade-offs behind that choice.

## 1. Requirements gathering and user story identification

### Options considered

1. GPT-4.1
2. Claude 3.7 Sonnet
3. Gemini 2.0 Flash

### Selected

- Claude 3.7 Sonnet

### Why selected

- Strong at turning ambiguous briefs into product-facing requirements and edge-case questions
- Good balance of long-context reasoning and concise writing for 1-2 page docs
- Useful for surfacing missing assumptions and stakeholder questions quickly

### Why not the others

- GPT-4.1: very strong overall, but I optimized for fast exploratory reasoning and requirements shaping in this workflow
- Gemini 2.0 Flash: cost-effective and fast, but weaker fit for nuanced product framing than the selected option

## 2. Test case development

### Options considered

1. GPT-4.1 mini
2. Claude 3.5 Sonnet
3. DeepSeek Chat

### Selected

- GPT-4.1 mini

### Why selected

- Fast iteration speed for generating structured happy-path and edge-case tests
- Good price/performance for repeated refinement during development
- Pairs well with deterministic backend logic and unit-test generation

### Why not the others

- Claude 3.5 Sonnet: solid quality, but I preferred the faster low-cost iteration loop here
- DeepSeek Chat: attractive cost profile, but less predictable output quality for test formatting and refinement

## 3. Code development IDE or environment

### Options considered

1. Codex
2. VS Code with Copilot
3. Cursor

### Selected

- Codex

### Why selected

- Strong agentic workflow for moving across product framing, architecture, implementation, and review
- Useful for editing multiple files consistently while keeping the overall case-study narrative aligned
- Worked well for shipping a full MVP from an ambiguous prompt under time pressure

### Why not the others

- VS Code with Copilot: dependable, but less structured for end-to-end agentic execution across docs, code, and review
- Cursor: strong environment, but I preferred Codex for this specific workflow and pacing

## 4. Code review

### Options considered

1. GPT-4.1
2. Claude 3.7 Sonnet
3. Gemini 2.0 Flash

### Selected

- GPT-4.1

### Why selected

- Strong at spotting regressions, unclear logic, and missing edge cases
- Good fit for reviewing API contracts, conversation flows, and trust/safety behavior together
- Reliable for concise review summaries under time pressure

### Why not the others

- Claude 3.7 Sonnet: very capable, but I prioritized sharper code-review style feedback here
- Gemini 2.0 Flash: fast, but I wanted stronger depth for implementation review

## 5. Manual tests, automated tests, and unit tests

### Options considered

1. Playwright
2. Node built-in test runner
3. Cypress

### Selected

- Node built-in test runner

### Why selected

- Zero dependency overhead for a portable case-study submission
- Fastest path to ship deterministic coverage for core intents and multi-turn flows
- Keeps setup simple for reviewers

### Why not the others

- Playwright: ideal for full browser automation, but heavier than needed for this MVP
- Cypress: strong UI testing option, but setup cost was harder to justify for a small prototype

## Fit with the overall solution

The selected stack optimizes for:

- Fast prototyping under ambiguity
- Clear communication of assumptions and trade-offs
- Easy reviewability by the Lean Scale team
- Low setup friction for a working demo
- A pragmatic balance between AI assistance and deterministic product behavior
