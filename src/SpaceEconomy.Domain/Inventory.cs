using System.Collections.ObjectModel;

namespace SpaceEconomy.Domain;

public sealed class Inventory
{
    private readonly ReadOnlyDictionary<string, int> _contents;

    public Inventory(
        string id,
        string name,
        EntityReference owner,
        EntityReference location,
        int? maxItemCount = null,
        IReadOnlyDictionary<string, int>? contents = null)
    {
        Id = id;
        Name = name;
        Owner = owner;
        Location = location;
        MaxItemCount = maxItemCount;

        var seededContents = contents is null
            ? new Dictionary<string, int>()
            : new Dictionary<string, int>(contents);

        _contents = new ReadOnlyDictionary<string, int>(seededContents);
    }

    public string Id { get; }
    public string Name { get; }
    public EntityReference Owner { get; }
    public EntityReference Location { get; }
    public int? MaxItemCount { get; }
    public IReadOnlyDictionary<string, int> Contents => _contents;
}
