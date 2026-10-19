# Ticket 1 — Introduce Food, Bob, and Ceres (vocabulary only)

**Prerequisite:** Ticket 0 was executed and reviewed. **Run this ticket by itself.**

## Goal

Give the domain model just three concepts:

1. A `Commodity` — a definition of a tradable thing, such as Food.
2. An `Actor` — a person/participant such as Bob, who might later be controlled by a player or an NPC.
3. A `Station` — a physical place such as Ceres Station.

Create one example of each in the console sandbox and show their identities. **No inventories yet.**

## Code to add

Inside `SpaceEconomy.Domain`, create exactly these three new files:

```text
Commodity.cs
Actor.cs
Station.cs
```

Namespace: `SpaceEconomy.Domain`.

Each type should be a simple **sealed class** with:

- a constructor receiving `string id, string name`;
- a public get-only `string Id` property;
- a public get-only `string Name` property.

Example shape for `Commodity` (use the same simple pattern for `Actor` and `Station`):

```csharp
namespace SpaceEconomy.Domain;

public sealed class Commodity
{
    public Commodity(string id, string name)
    {
        Id = id;
        Name = name;
    }

    public string Id { get; }
    public string Name { get; }
}
```

**Why both fields?** `Id` is the stable reference other objects can eventually use; `Name` is what people see. That's enough identity for now. We are not building registries or uniqueness enforcement yet.

`Actor` must **not** have `IsNpc`, `IsPlayer`, behavior, an inventory, money, or a ship.

`Station` must **not** have an inventory yet, or a list of actors.

`Commodity` is the **definition** of Food, not one particular unit of Food. Quantities and storage belong to a later inventory ticket.

No interfaces, base classes, repositories, factories, enums, managers, events, persistence attributes, guard-validation frameworks, or extra methods.

## Console sandbox change

Replace the Ticket 0 ready message with code that constructs:

```text
Commodity: id = food, name = Food
Actor:     id = bob,  name = Bob
Station:   id = ceres, name = Ceres Station
```

Print all three to the terminal using their **properties**, not hard-coded final display strings, so the demonstration genuinely exercises the three classes. Format is flexible; output must be legible.

Do not create a central `World`, `Simulation`, list manager, or inventory here.

Update `README.md` briefly to describe these three concepts and the run command. Keep the README short.

## Acceptance check

Run:

```powershell
dotnet build SpaceEconomy.sln
dotnet run --project src/SpaceEconomy.Sandbox/SpaceEconomy.Sandbox.csproj
```

The build must succeed. The console must show Food, Bob, and Ceres Station with their IDs, created via the new domain classes.

The domain project must still have **no** UI, networking, or game-engine dependencies.

## What to explain to the user

Show the complete code of `Commodity`, `Actor`, and `Station` in your handoff (these should be tiny). Explain why each file exists, why `Id` and `Name` are separate, and what the console sandbox proved.

List the actual changed files and commands/results. Explicitly state what was deliberately **not** implemented.

## Stop

**Do not proceed to inventories.** The user will review this model before authorizing the next manually executed ticket.
