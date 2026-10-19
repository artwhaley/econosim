# Space Economy

A small, standalone C# economic simulation being grown one concept at a time. The long-term goal is a physically meaningful economy for a space logistics game: stations, local inventories, actors (players or NPCs), and transfers that happen only because an actor or physical system actually moved something.

That goal is context, not a backlog. Only the work described in the current ticket exists in code.

## Projects

- `src/SpaceEconomy.Domain` — a plain .NET class library holding the model. It stays independent of UI, networking, persistence, and game engines.
- `src/SpaceEconomy.Sandbox` — a tiny console application that constructs the model objects and prints them. It is an inspection harness, not an economy server.
- `src/SpaceEconomy.Server` — an ASP.NET Core host for the authoritative in-memory development world, a read-only `/dev` API, and the static browser inspector.

## Current model

- **Commodity** — the definition of a tradable thing, such as Food. It is not a quantity of that thing.
- **Actor** — a participant such as Bob, with no assumption yet about whether a player or an NPC controls it.
- **Station** — a physical place such as Ceres Station.
- **Inventory** — where physically stored commodities live. An inventory has a stable `Id`, a `Name`, an `Owner`, a `Location`, an optional `MaxItemCount`, and commodity contents.

### Owner and location are independent

`Owner` and `Location` are both `EntityReference` values (`Kind` + `Id`). Ceres Station owns its own inventory at Ceres, while Bob owns a separate inventory that is also physically located at Ceres. Ownership says whose goods these are; location says where the goods physically are.

An actor may own inventories at several stations without those inventories following the actor. This is also why a future portable cargo container will simply be another `Inventory`: moving the container changes its `Location`, not automatically its owner or contents. Moving an inventory and transferring commodities between inventories remain distinct operations.

`MaxItemCount` is provisional metadata for an aggregate item-unit count. It is not volume or mass, and it is not enforced yet. `null` means unlimited.

The seeded development world contains:

| Inventory | Owner | Location | Contents |
|---|---|---|---|
| Ceres Station Inventory | `station / ceres` | `station / ceres` | Food × 1 |
| Bob's Ceres Inventory | `actor / bob` | `station / ceres` | empty |

## Build and run the sandbox

```powershell
dotnet build SpaceEconomy.sln
dotnet run --project src/SpaceEconomy.Sandbox
```

The sandbox prints the Food, Bob, and Ceres Station vocabulary.

## Run the development server and inspector

```powershell
dotnet run --project src/SpaceEconomy.Server
```

Then open <http://127.0.0.1:5180/>. The server binds to `127.0.0.1` and defaults to port `5180`. To use another port:

```powershell
dotnet run --project src/SpaceEconomy.Server -- --SpaceEconomy:Port 5190
```

The inspector is plain HTML/CSS/JavaScript served by the same server. It fetches economic state through the `/dev` API; no seed data is embedded in the browser files.

## Development inspection API

Only available in the `Development` environment:

```http
GET /dev/stations
GET /dev/stations/{stationId}
GET /dev/stations/{stationId}/inventories?skip=0&take=20
GET /dev/inventories/{inventoryId}
GET /dev/actors/{actorId}
GET /dev/commodities/{commodityId}
```

The station inventory listing is by physical location, so Ceres returns both the station-owned and Bob-owned inventories. It is bounded (`take` defaults to 20, maximum 100). Inventory detail returns only that inventory and its contents. Unknown IDs return `404`.

### These are not production player endpoints

`/dev` and the inspector are privileged local development tools for a single seeded world. They run only in Development and are disabled in other environments. They have no authentication because they are never intended to be exposed publicly. Future player-facing APIs must enforce authorization server-side; do not treat these endpoints as a template for player access.

## Status

Development is intentionally ticket-by-ticket. Tickets 0–2 are implemented: the workspace, domain vocabulary, and the inventory/web-inspector slice. Transfers, buying/selling, pricing, NPC behavior, persistence, and real player APIs require a separate, manually issued ticket.
