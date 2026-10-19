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
