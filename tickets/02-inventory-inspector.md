# Ticket 02 — Inventories and Web Inspector

**Repository:** `https://github.com/artwhaley/econosim`
**Prerequisite:** Tickets 0 and 1 complete
**Scope:** One executable vertical slice
**Execution:** Run only this ticket, then stop for review.

## 1. Objective

Extend the existing economic vocabulary with a first-class `Inventory` and replace console-only inspection with a running ASP.NET Core economy server and a read-only browser inspector.

At completion, I must be able to launch the server, open a browser, select Ceres Station, and inspect:

- Ceres Station's own inventory, containing one unit of Food.
- Bob's separately owned inventory, also physically located at Ceres Station, initially empty.
- The identities, owners, locations, contents, and optional capacity of those inventories.

Everything displayed must come from the live server, not hardcoded browser sample data.

**Do not implement transfers, buying, selling, NPCs, or any other economic behavior.**

## 2. Permanent project rules

The two permanent architectural principles were added to `AGENTS.md` before implementation:

- **Principle A — Physical inventory:** every physically stored commodity exists in an inventory, with independent owner and location.
- **Principle B — Inspectable simulation:** every new concept is inspectable through a narrowly scoped authoritative server query, using deliberate read models.

## 3. Inventory domain model

An inventory has:

| Member | Meaning |
|---|---|
| `Id` | Stable inventory identity |
| `Name` | Human-readable description |
| `Owner` | Reference to the owning entity |
| `Location` | Reference to the immediate physical location |
| `MaxItemCount` | Optional maximum quantity of item units; null means no defined limit |
| `Contents` | Commodity IDs and quantities |

Quantities are nonnegative whole units. `MaxItemCount` is provisional aggregate item-unit metadata, not volume or mass, and is not enforced.

Ownership and location use a small `EntityReference` value type containing `Kind` and `Id`.

Contents are encapsulated behind a read-only view.

No `CargoContainer` class was introduced; a future portable container will itself be an `Inventory`.

## 4. Seeded inventories

Retained Ticket 1 objects: `Commodity: food — Food`, `Actor: bob — Bob`, `Station: ceres — Ceres Station`.

Created:

### Ceres Station Inventory

```text
Id: inventory:ceres:station
Name: Ceres Station Inventory
Owner: station / ceres
Location: station / ceres
MaxItemCount: null
Contents: food: 1
```

### Bob's Ceres Inventory

```text
Id: inventory:bob:ceres
Name: Bob's Ceres Inventory
Owner: actor / bob
Location: station / ceres
MaxItemCount: null
Contents: empty
```

The inventories are physically colocated but separately owned and have their own stable identities.

## 5. Minimal economy server

Added `src/SpaceEconomy.Server/`, referencing `SpaceEconomy.Domain`. It hosts the authoritative in-memory development world, the read-only API, and the static inspector. `EconomyState` owns the seeded objects and provides dictionary lookups plus a small explicit index by location. No database, ORM, repository framework, background loop, or extra DI framework.

The console sandbox remains.

## 6. Read-only inspection API

Development-only routes under `/dev`:

```http
GET /dev/stations
GET /dev/stations/{stationId}
GET /dev/stations/{stationId}/inventories
GET /dev/inventories/{inventoryId}
GET /dev/actors/{actorId}
GET /dev/commodities/{commodityId}
```

The inventory listing is by physical location. It is bounded with `skip`/`take` (default 20, maximum 100). Inventory detail reads only that inventory. Responses use explicit read models with owner/location references, capacity, commodity IDs, display names, and quantities. Missing IDs return 404. No whole-world dump endpoint exists.

## 7. Development-only access

- Binds to `127.0.0.1` by default.
- Port configurable through `SpaceEconomy:Port`, default `5180`.
- `/dev` and the inspector are mapped only in the Development environment; other environments disable them.
- No login, passwords, JWT, OAuth, roles, or permissions database.
- Documented as privileged local development tools, not production player APIs.

## 8. Browser inspector

Plain HTML, CSS, and JavaScript served from `wwwroot`. Dark, restrained simulation-inspector styling. It supports selecting Ceres Station, listing both inventories with owner/location/contents, opening inventory details, navigating to Bob and Food, and manual Refresh. Actors and commodities in the sidebar are discovered from server responses; no seed data is embedded in the browser files. No automatic polling, WebSockets, or mutation controls.

## 9. Performance expectations

Direct lookup by ID; bounded inventory collections; targeted inventory detail; no whole-economy reconstruction per request; no background snapshot generation; no caching or indexing framework added.

## 10. Understandable implementation

One obvious responsibility per class: `Inventory` and `EntityReference` in the domain, `EconomyState` for the seeded world, explicit DTOs/read models, and a small `Program.cs` with endpoints.

## 11. Validation

- `dotnet build SpaceEconomy.sln` — succeeds with 0 warnings and 0 errors.
- `dotnet run --project src/SpaceEconomy.Sandbox` — still prints Food, Bob, and Ceres Station.
- `dotnet run --project src/SpaceEconomy.Server` — starts on `http://127.0.0.1:5180` in Development.
- API checks: station, actor, and commodity lookups return 200; the Ceres inventory listing returns two distinct inventories at `station / ceres` with different owners; the station inventory contains Food × 1; Bob's inventory is empty; direct inventory lookup works; a missing inventory returns 404; pagination returns `total: 2`.
- Production environment probe: `/dev/stations` and `/` return 404.
- Browser checks: both inventories render, inventory details show the correct owner/location/capacity/contents, the empty state is explicit, Bob and Food navigation works, and Refresh re-fetches the current targeted data. A headless Chrome screenshot was captured for the main view.

## 12. Documentation and handoff

Updated `README.md`. This file retains the supplied ticket.

## 13. Explicitly out of scope

Inventory-to-inventory transfers, buying/selling, pricing or demand, player/NPC distinctions, ships or cargo containers, moving inventory locations, nested inventories, economic transactions, station production/consumption, automated NPC activity, authentication or production permissions, database persistence, separate frontend deployment, global world snapshots, live streaming or polling, WPF, and Unity integration.

## 14. Definition of done

Start the server, open the inspector, select Ceres Station, see two inventories with different owners, inspect the station inventory showing Food × 1, inspect Bob's empty inventory, and inspect the underlying identities and locations. All data comes from the live server through targeted HTTP queries. The two permanent architectural principles are present in `AGENTS.md`.

**Stop after Ticket 02. Do not implement Ticket 3.**
