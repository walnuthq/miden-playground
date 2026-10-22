---
name: tutorials-qa
description: QA the Miden Playground tutorials end to end (local dev or playground.miden.xyz) with agent-browser, Bread Wallet and Para. Use when asked to QA, test or validate tutorials, or to reproduce a tutorial bug in the browser.
---

Read `docs/qa/README.md` (repo root) before doing anything: it has the setup, the pitfalls table, per-tutorial notes and the reporting format. Then read the latest `docs/qa/YYYY-MM-DD-tutorials.md` for the known issues.

Source `docs/qa/scripts/qa.sh` for the helpers (`BASE`, `QA_SESSION` and `QA_LOG` env vars) and load the `agent-browser` skill for its CLI.
