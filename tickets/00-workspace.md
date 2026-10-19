# Ticket 0 — Create the workspace, rules, and smallest runnable solution

**Run this ticket by itself. Stop before Ticket 1.**

## Goal

Establish a clean workspace for learning and growing the economic model **one concept at a time**. Nothing resembling an economy needs to be implemented yet.

## Read first

- `AGENTS.md` (permanent project rules)
- `START_HERE.md` (manual execution order)

Inspect the current folder and any existing Git state. Do not assume the folder is empty. If there is already a solution or equivalent structure, keep it and adapt this ticket minimally rather than creating duplicates.

## Build only this

Use the installed **.NET 10 SDK**, C#, and conventional SDK-style projects. Do not install packages. If the SDK is unavailable, report that prerequisite instead of quietly substituting another framework.

Expected layout (plus normal generated `obj/` and `bin/` on disk, ignored by Git):

```text
AGENTS.md                      existing rules from packet
START_HERE.md                  existing operator guide from packet
tickets/
  00-workspace.md
  01-domain-vocabulary.md
README.md                      created by this ticket
.gitignore                     created by this ticket
SpaceEconomy.sln               created by this ticket
src/
  SpaceEconomy.Domain/
    SpaceEconomy.Domain.csproj
  SpaceEconomy.Sandbox/
    SpaceEconomy.Sandbox.csproj
    Program.cs
```

`SpaceEconomy.Domain` is a plain .NET class library. No business concepts in it yet; remove the generated `Class1.cs` placeholder.

`SpaceEconomy.Sandbox` is a tiny console application that **references** `SpaceEconomy.Domain`. It exists solely for hands-on inspection as new domain concepts appear.

The console application for Ticket 0 should print exactly one simple line:

```text
Space Economy workspace ready.
```

Create a normal `.gitignore` for .NET build artifacts and local IDE files. If the folder is not already a Git repository, initialize one locally. **Do not commit or push.**

Create a short `README.md` explaining:

- what the project is trying to explore, in a few sentences;
- why there is a Domain library and a Sandbox;
- how to build and run the sandbox;
- that development is intentionally ticket-by-ticket and only Ticket 0 exists in code so far.

No future architecture diagram is necessary.

## Suggested CLI steps (adapt if necessary)

```powershell
dotnet --version
dotnet new sln --name SpaceEconomy --format sln
dotnet new classlib --name SpaceEconomy.Domain --framework net10.0 --output src/SpaceEconomy.Domain
dotnet new console --name SpaceEconomy.Sandbox --framework net10.0 --output src/SpaceEconomy.Sandbox
dotnet sln SpaceEconomy.sln add src/SpaceEconomy.Domain/SpaceEconomy.Domain.csproj
dotnet sln SpaceEconomy.sln add src/SpaceEconomy.Sandbox/SpaceEconomy.Sandbox.csproj
dotnet add src/SpaceEconomy.Sandbox/SpaceEconomy.Sandbox.csproj reference src/SpaceEconomy.Domain/SpaceEconomy.Domain.csproj
```

Remove the template `Class1.cs`. Replace the default Hello World text in the sandbox with the required output. Create `.gitignore` and README.

## Checks required before stopping

```powershell
dotnet build SpaceEconomy.sln
dotnet run --project src/SpaceEconomy.Sandbox/SpaceEconomy.Sandbox.csproj
```

The build must succeed and the console output must say `Space Economy workspace ready.`

## Out of scope, explicitly

Do **not** create Commodity, Actor, Station, Inventory, APIs, server processes, GUI projects, tests, packages, or dependency injection. Those are not Ticket 0.

## Handoff

Report all created/changed files, purpose of each, build/run results, and any environmental limitations. **Stop. Wait for the user to manually request Ticket 1.**
