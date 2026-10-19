# Codex working rules — Space Economy

## Why this project exists

We are growing a standalone, C# economic simulation for a space logistics game. Eventually it should support stations, local inventories, actors (players or NPCs), and physically meaningful transfers. **Nothing should move between locations just because an economic tick decides it should.** Actors and physical systems will eventually be responsible for movement.

That vision is context only. **Do not implement future systems unless an explicitly requested ticket requires them.**

## Execution discipline

1. **Execute only the ticket explicitly requested in the current user prompt.** Having access to the next ticket is not authorization to do it. Stop after the ticket's acceptance criteria are checked.
2. Before editing, inspect the workspace and briefly state what already exists and what you are changing. Preserve unrelated work; never delete/overwrite user files casually.
3. Prefer **the fewest files and concepts that satisfy the current ticket**. Use ordinary C# over abstractions, factories, base classes, frameworks, helpers, and generalized architectures not yet needed.
4. Keep **domain code independent** of UI, networking, persistence, Unity, and game engines. The first console app is an inspection/smoke-test harness, not the economy server.
5. No speculative features. In particular, do not introduce inventories, transfers, prices, simulation ticks, NPC managers, WPF, APIs, databases, DI containers, or test infrastructure before a ticket requests them.
6. Favor explicit readable names and constructors. Do not invent interfaces or inheritance trees for anticipated variations. `Actor` must be neutral with respect to player/NPC control until we actually need that distinction.
7. Keep behavior observable. Build and run the smallest meaningful demonstration for each ticket. If an environment prerequisite is missing, state precisely what couldn't be validated; do not falsely claim a successful run.
8. Do not upgrade frameworks, install unrelated packages, create remote repositories, push, or commit changes unless the user explicitly requests it. If the repository already has conventions, reconcile rather than overwrite them.
9. Use minimal tests **when they prove behavior actually introduced**; do not erect a testing framework for hypothetical edge cases. Ticket 1 requires a runnable console smoke demonstration, not a unit-test project.
10. Do not treat a roadmap, design discussion, or this `AGENTS.md` as a backlog to execute. A manually issued ticket is the only scope of work.

## Mandatory handoff after each ticket

Provide a concise report with:

- **Changed files:** exact relative paths and one sentence explaining why each exists.
- **New types/public members:** what each does and why it is needed *today*.
- **Validation:** exact commands run and actual result (or reason they could not run).
- **Decisions or deviations:** anything chosen that was not explicitly specified.
- **Explicit stopping point:** confirm that no later ticket was implemented.

If a ticket is unclear, make the smallest reversible choice, document it, and do not expand scope to compensate.
