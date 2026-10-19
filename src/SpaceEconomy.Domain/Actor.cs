namespace SpaceEconomy.Domain;

public sealed class Actor
{
    public Actor(string id, string name)
    {
        Id = id;
        Name = name;
    }

    public string Id { get; }
    public string Name { get; }
}
