# ADR 0001: Static site with a pure logic engine

**Status:** Accepted, 2026-11-14

## Context

The demo must run in a three-minute pitch without network risk, be reviewable by judges, and be testable. The governance logic (tiers, routing, escalation, review) is the differentiator, not the model.

## Decision

- Plain HTML, CSS and ES modules, served by GitHub Pages. No build, no dependencies.
- All decision logic lives in `src/engine.js` as pure functions over JSON data, shared by the page and the tests.
- Tests use Node's built-in test runner.

## Consequences

- Runs offline and on any laptop; nothing to install for judges.
- The engine can be lifted into a server or agent framework later unchanged.
- Keyword retrieval is deliberately simple; it is good enough to show tier enforcement but not a production search (see ADR 0002).
