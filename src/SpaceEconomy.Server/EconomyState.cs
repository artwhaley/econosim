using SpaceEconomy.Domain;

namespace SpaceEconomy.Server;

/// <summary>
/// The in-memory development world and its direct indexes.
/// </summary>
/// <remarks>
/// The location, owner, and commodity indexes are built by <see cref="AddInventory"/>
/// while the world is seeded. Inventory contents and ownership are immutable today, so
/// no index needs updating at runtime. When inventory mutation is introduced, every change
/// to an inventory's owner, location, or commodity quantities must update the matching
/// index here; otherwise the relationship queries will return stale results.
///
/// The sorted directory lists (<see cref="Stations"/>, <see cref="Actors"/>,
/// <see cref="Commodities"/>, <see cref="Inventories"/>) are snapshotted once after
/// seeding. Creating an entity at runtime must refresh them.
/// </remarks>
internal sealed class EconomyState
{
    private readonly Dictionary<string, Commodity> _commodities = [];
    private readonly Dictionary<string, Actor> _actors = [];
    private readonly Dictionary<string, Station> _stations = [];
    private readonly Dictionary<string, Inventory> _inventories = [];
    private readonly Dictionary<EntityReference, List<Inventory>> _inventoriesByLocation = [];
    private readonly Dictionary<EntityReference, List<Inventory>> _inventoriesByOwner = [];
    private readonly Dictionary<string, List<Inventory>> _inventoriesByCommodity = [];

    private EconomyState()
    {
    }

    public static EconomyState CreateSeeded()
    {
        var state = new EconomyState();

        var food = new Commodity("food", "Food");
        var bob = new Actor("bob", "Bob");
        var ceres = new Station("ceres", "Ceres Station");
        var vesta = new Station("vesta", "Vesta Station");

        state._commodities.Add(food.Id, food);
        state._actors.Add(bob.Id, bob);
        state._stations.Add(ceres.Id, ceres);
        state._stations.Add(vesta.Id, vesta);

        state.AddInventory(new Inventory(
            "inventory:ceres:station",
            "Ceres Station Inventory",
            owner: new EntityReference("station", ceres.Id),
            location: new EntityReference("station", ceres.Id),
            contents: new Dictionary<string, int> { [food.Id] = 1 }));

        state.AddInventory(new Inventory(
            "inventory:bob:ceres",
            "Bob's Ceres Inventory",
            owner: new EntityReference("actor", bob.Id),
            location: new EntityReference("station", ceres.Id)));

        state.AddInventory(new Inventory(
            "inventory:bob:vesta",
            "Bob's Vesta Inventory",
            owner: new EntityReference("actor", bob.Id),
            location: new EntityReference("station", vesta.Id)));

        state.SnapshotDirectories();

        return state;
    }

    public IReadOnlyList<Station> Stations { get; private set; } = [];

    public IReadOnlyList<Actor> Actors { get; private set; } = [];

    public IReadOnlyList<Commodity> Commodities { get; private set; } = [];

    public IReadOnlyList<Inventory> Inventories { get; private set; } = [];

    public Station? FindStation(string id) => _stations.GetValueOrDefault(id);

    public Actor? FindActor(string id) => _actors.GetValueOrDefault(id);

    public Commodity? FindCommodity(string id) => _commodities.GetValueOrDefault(id);

    public Inventory? FindInventory(string id) => _inventories.GetValueOrDefault(id);

    /// <summary>Resolves a reference to a display name, falling back to its id.</summary>
    public string ResolveName(EntityReference reference) => reference.Kind switch
    {
        "station" => FindStation(reference.Id)?.Name,
        "actor" => FindActor(reference.Id)?.Name,
        "commodity" => FindCommodity(reference.Id)?.Name,
        "inventory" => FindInventory(reference.Id)?.Name,
        _ => null,
    } ?? reference.Id;

    public IReadOnlyList<Inventory> InventoriesLocatedAt(string stationId) =>
        _inventoriesByLocation.GetValueOrDefault(new EntityReference("station", stationId)) ?? [];

    public IReadOnlyList<Inventory> InventoriesOwnedBy(string actorId) =>
        _inventoriesByOwner.GetValueOrDefault(new EntityReference("actor", actorId)) ?? [];

    public IReadOnlyList<Inventory> InventoriesContaining(string commodityId) =>
        _inventoriesByCommodity.GetValueOrDefault(commodityId) ?? [];

    private void AddInventory(Inventory inventory)
    {
        _inventories.Add(inventory.Id, inventory);

        AddToIndex(_inventoriesByLocation, inventory.Location, inventory);
        AddToIndex(_inventoriesByOwner, inventory.Owner, inventory);

        foreach (var line in inventory.Contents)
        {
            if (line.Value > 0)
            {
                AddToIndex(_inventoriesByCommodity, line.Key, inventory);
            }
        }
    }

    private static void AddToIndex<TKey>(Dictionary<TKey, List<Inventory>> index, TKey key, Inventory inventory)
        where TKey : notnull
    {
        if (!index.TryGetValue(key, out var entries))
        {
            entries = [];
            index.Add(key, entries);
        }

        entries.Add(inventory);
    }

    private void SnapshotDirectories()
    {
        Stations = _stations.Values
            .OrderBy(station => station.Name, StringComparer.Ordinal)
            .ThenBy(station => station.Id, StringComparer.Ordinal)
            .ToArray();

        Actors = _actors.Values
            .OrderBy(actor => actor.Name, StringComparer.Ordinal)
            .ThenBy(actor => actor.Id, StringComparer.Ordinal)
            .ToArray();

        Commodities = _commodities.Values
            .OrderBy(commodity => commodity.Name, StringComparer.Ordinal)
            .ThenBy(commodity => commodity.Id, StringComparer.Ordinal)
            .ToArray();

        Inventories = _inventories.Values
            .OrderBy(inventory => inventory.Name, StringComparer.Ordinal)
            .ThenBy(inventory => inventory.Id, StringComparer.Ordinal)
            .ToArray();
    }
}
