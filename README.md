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

These are independent entities. An inventory owned by Bob and located at Ceres does not make Bob a child of Ceres, and Food sitting in a Ceres inventory is not a child of Ceres either. Relationships are navigation context, not containment.

### Owner and location are independent

`Owner` and `Location` are both `EntityReference` values (`Kind` + `Id`). Ownership says whose goods these are; location says where the goods physically are.

An actor may own inventories at several stations without those inventories following the actor. This is also why a future portable cargo container will simply be another `Inventory`: moving the container changes its `Location`, not automatically its owner or contents. Moving an inventory and transferring commodities between inventories remain distinct operations.

`MaxItemCount` is provisional metadata for an aggregate item-unit count. It is not volume or mass, and it is not enforced yet. `null` means unlimited.

The seeded development world contains two stations (Ceres and Vesta), one actor (Bob), one commodity (Food), and three inventories:

| Inventory | Owner | Location | Contents |
|---|---|---|---|
| Ceres Station Inventory | `station / ceres` | `station / ceres` | Food × 1 |
| Bob's Ceres Inventory | `actor / bob` | `station / ceres` | empty |
| Bob's Vesta Inventory | `actor / bob` | `station / vesta` | empty |

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

The inspector is plain HTML/CSS/JavaScript served by the same server. It fetches everything from the `/dev` API; no seed data is embedded in the browser files.

### Using the inspector

The sidebar lists four independent directories — stations, actors, commodities, and inventories — each fetched from its own endpoint. Selecting any entry makes it the primary view; nothing else stays selected, and no station remains an implicit parent.

Each entity view shows the entity itself plus its relationships:

- **Station** — inventories physically located there, with owner and contents.
- **Actor** — inventories owned by that actor, wherever they are located.
- **Commodity** — inventories holding a positive quantity of that commodity, anywhere in the world.
- **Inventory** — clickable owner and location references, plus contents.

Owner, location, and commodity references are clickable. Selection is stored in the URL hash, so Back/Forward work and refreshing keeps the current entity:

```text
#/stations/ceres
#/actors/bob
#/commodities/food
#/inventories/inventory%3Abob%3Avesta
```

`All entities` opens the neutral overview at `#/`.

## Development inspection API

Only available in the `Development` environment:

```http
GET /dev/stations?skip=0&take=20
GET /dev/actors?skip=0&take=20
GET /dev/commodities?skip=0&take=20
GET /dev/inventories?skip=0&take=20

GET /dev/stations/{stationId}
GET /dev/actors/{actorId}
GET /dev/commodities/{commodityId}
GET /dev/inventories/{inventoryId}

GET /dev/stations/{stationId}/inventories?skip=0&take=20
GET /dev/actors/{actorId}/inventories?skip=0&take=20
GET /dev/commodities/{commodityId}/inventories?skip=0&take=20
```

Every collection endpoint returns `{ skip, take, total, items }`, ordered by name. `take` defaults to 20 and is capped at 100; `total` is the full match count. Unknown IDs return `404`.

The three relationship queries are deliberately separate:

- Station inventories are filtered by physical location, regardless of owner, so Ceres returns two inventories and Vesta returns Bob's Vesta inventory.
- Actor inventories are filtered by ownership, regardless of location, so Bob returns both of his inventories with their distinct locations.
- Commodity inventories are filtered by a positive quantity of that commodity and report only that commodity's quantity, so Food returns the Ceres Station Inventory and neither of Bob's empty inventories.

### These are not production player endpoints

`/dev` and the inspector are privileged local development tools for a single seeded world. They run only in Development and are disabled in other environments. They have no authentication because they are never intended to be exposed publicly. Global enumeration of inventories and ownership is administrative inspection, not a precedent for future player-facing queries. Future player APIs must enforce authorization server-side.

## Status

Development is intentionally ticket-by-ticket. Tickets 0–2.5 are implemented: the workspace, domain vocabulary, the inventory/web-inspector slice, and the entity-centric inspector with a second station. Transfers, buying/selling, pricing, NPC behavior, persistence, and real player APIs require a separate, manually issued ticket.
