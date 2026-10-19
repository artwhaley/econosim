# Space Economy

A small, standalone C# economic simulation being grown one concept at a time. The long-term goal is a physically meaningful economy for a space logistics game: stations, local inventories, actors (players or NPCs), and transfers that happen only because an actor or physical system actually moved something.

That goal is context, not a backlog. Only the work described in the current ticket exists in code.

## Why a Domain library and a Sandbox?

- `src/SpaceEconomy.Domain` is a plain .NET class library. It holds the model and stays independent of UI, networking, persistence, and game engines.
- `src/SpaceEconomy.Sandbox` is a tiny console application that references the domain. It exists only to construct model objects and print them so their behavior is observable.

The sandbox is an inspection harness, not an economy server.

## Build and run

```powershell
dotnet build SpaceEconomy.sln
dotnet run --project src/SpaceEconomy.Sandbox/SpaceEconomy.Sandbox.csproj
```

Requires the .NET 10 SDK.

## Current model

The domain now has three tiny identity concepts:

- **Commodity** — the definition of a tradable thing, such as Food. It is not a quantity of that thing.
- **Actor** — a participant such as Bob, with no assumption yet about whether a player or an NPC controls it.
- **Station** — a physical place such as Ceres Station.

Each type stores a stable `Id` and a human-readable `Name`. The sandbox constructs one of each and prints them. There are no inventories, transfers, prices, or simulation ticks yet.

## Status

Development is intentionally ticket-by-ticket. Tickets 0 (workspace) and 1 (domain vocabulary) are implemented. Later concepts require a separate, manually issued ticket.
