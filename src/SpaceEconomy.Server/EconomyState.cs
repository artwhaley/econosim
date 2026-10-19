using SpaceEconomy.Domain;

namespace SpaceEconomy.Server;

internal sealed class EconomyState
{
    private readonly Dictionary<string, Commodity> _commodities = [];
    private readonly Dictionary<string, Actor> _actors = [];
    private readonly Dictionary<string, Station> _stations = [];
    private readonly Dictionary<string, Inventory> _inventories = [];
    private readonly Dictionary<EntityReference, List<Inventory>> _inventoriesByLocation = [];

    private EconomyState()
    {
    }

    public static EconomyState CreateSeeded()
    {
        var state = new EconomyState();

        var food = new Commodity("food", "Food");
        var bob = new Actor("bob", "Bob");
        var ceres = new Station("ceres", "Ceres Station");

        state._commodities.Add(food.Id, food);
        state._actors.Add(bob.Id, bob);
        state._stations.Add(ceres.Id, ceres);

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

        return state;
    }

    public IReadOnlyCollection<Station> Stations => _stations.Values;

    public Station? FindStation(string id) => _stations.GetValueOrDefault(id);

    public Actor? FindActor(string id) => _actors.GetValueOrDefault(id);

    public Commodity? FindCommodity(string id) => _commodities.GetValueOrDefault(id);

    public Inventory? FindInventory(string id) => _inventories.GetValueOrDefault(id);

    public IReadOnlyList<Inventory> InventoriesLocatedAt(string stationId) =>
        _inventoriesByLocation.GetValueOrDefault(new EntityReference("station", stationId)) ?? [];

    private void AddInventory(Inventory inventory)
    {
        _inventories.Add(inventory.Id, inventory);

        if (!_inventoriesByLocation.TryGetValue(inventory.Location, out var located))
        {
            located = [];
            _inventoriesByLocation.Add(inventory.Location, located);
        }

        located.Add(inventory);
    }
}
