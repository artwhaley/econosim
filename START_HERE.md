# Space Economy — first two manual Codex executions

This packet is intended to be extracted at the **root of a new project workspace**. It contains persistent Codex rules and **two independent tickets**. It does **not** contain an implementation.

## Execute them separately

**First Codex prompt (Ticket 0):**

> Read `AGENTS.md` and execute **only** `tickets/00-workspace.md` in this workspace. Create the workspace and build/run the smoke check. Explain each file you created or changed and stop. **Do not start Ticket 1.**

Read Codex's report and inspect the tiny solution before continuing.

**Second Codex prompt (Ticket 1), after you've accepted Ticket 0:**

> Read `AGENTS.md` and execute **only** `tickets/01-domain-vocabulary.md`. Implement precisely the three requested concepts and show them in the console sandbox. Build, run, explain every class and public member, and stop. **Do not start inventories or APIs.**

The instructions live in the ticket files rather than in one massive prompt so you can discuss, revise, and approve each increment before the next execution.

## What these two tickets produce

- **Ticket 0:** .NET solution, a framework-independent domain library, an intentionally tiny console sandbox, basic repo hygiene and documentation.
- **Ticket 1:** the concepts `Commodity`, `Actor`, `Station`; concrete examples Food, Bob, Ceres; readable console output.

**Not included:** Food quantities, station inventories, Bob's colocated inventory, transactions, WPF, network services, or NPCs. Those will be designed as later, separately triggered increments.

The long-term direction is a physical economy for a space logistics game, but future plans are **context**, not permission to implement them early.
