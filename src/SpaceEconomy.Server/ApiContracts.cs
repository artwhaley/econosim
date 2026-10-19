using SpaceEconomy.Domain;

namespace SpaceEconomy.Server;

public sealed record EntityReferenceDto(string Kind, string Id);

public sealed record StationDto(string Id, string Name);

public sealed record ActorDto(string Id, string Name);

public sealed record CommodityDto(string Id, string Name);

public sealed record InventoryLineDto(string CommodityId, string CommodityName, int Quantity);

public sealed record InventoryDto(
    string Id,
    string Name,
    EntityReferenceDto Owner,
    EntityReferenceDto Location,
    int? MaxItemCount,
    IReadOnlyList<InventoryLineDto> Contents);

public sealed record InventoryPageDto(
    int Skip,
    int Take,
    int Total,
    IReadOnlyList<InventoryDto> Inventories);

internal static class ReadModels
{
    public static StationDto ToDto(this Station station) => new(station.Id, station.Name);

    public static ActorDto ToDto(this Actor actor) => new(actor.Id, actor.Name);

    public static CommodityDto ToDto(this Commodity commodity) => new(commodity.Id, commodity.Name);

    public static EntityReferenceDto ToDto(this EntityReference reference) =>
        new(reference.Kind, reference.Id);

    public static InventoryDto ToDto(this Inventory inventory, EconomyState state)
    {
        var contents = inventory.Contents
            .OrderBy(entry => entry.Key, StringComparer.Ordinal)
            .Select(entry => new InventoryLineDto(
                entry.Key,
                state.FindCommodity(entry.Key)?.Name ?? entry.Key,
                entry.Value))
            .ToArray();

        return new InventoryDto(
            inventory.Id,
            inventory.Name,
            inventory.Owner.ToDto(),
            inventory.Location.ToDto(),
            inventory.MaxItemCount,
            contents);
    }
}
