namespace SpaceEconomy.Domain;

public sealed class Station
{
    public Station(string id, string name)
    {
        Id = id;
        Name = name;
    }

    public string Id { get; }
    public string Name { get; }
}
