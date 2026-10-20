using SpaceEconomy.Domain;
using SpaceEconomy.Server;

const int DefaultPageSize = 20;
const int MaxPageSize = 100;

var builder = WebApplication.CreateBuilder(args);

var port = builder.Configuration.GetValue<int?>("SpaceEconomy:Port") ?? 5180;
builder.WebHost.UseUrls($"http://127.0.0.1:{port}");

var app = builder.Build();
var world = EconomyState.CreateSeeded();

if (!app.Environment.IsDevelopment())
{
    app.Logger.LogWarning(
        "Development inspector and /dev API are disabled outside the Development environment.");
    app.MapGet("/", () => Results.NotFound("Development inspector is disabled."));
}
else
{
    app.UseDefaultFiles();
    app.UseStaticFiles();

    var dev = app.MapGroup("/dev");

    // Independent directories. Each is paged and ordered by name, and none requires
    // a station, actor, or commodity to be selected first.
    dev.MapGet("/stations", (int? skip, int? take) =>
    {
        var (skipValue, takeValue) = ReadPageBounds(skip, take);
        return Results.Ok(BuildPage(world.Stations, skipValue, takeValue, station => station.ToDto()));
    });

    dev.MapGet("/actors", (int? skip, int? take) =>
    {
        var (skipValue, takeValue) = ReadPageBounds(skip, take);
        return Results.Ok(BuildPage(world.Actors, skipValue, takeValue, actor => actor.ToDto()));
    });

    dev.MapGet("/commodities", (int? skip, int? take) =>
    {
        var (skipValue, takeValue) = ReadPageBounds(skip, take);
        return Results.Ok(BuildPage(
            world.Commodities,
            skipValue,
            takeValue,
            commodity => commodity.ToDto()));
    });

    dev.MapGet("/inventories", (int? skip, int? take) =>
    {
        var (skipValue, takeValue) = ReadPageBounds(skip, take);
        return Results.Ok(BuildPage(
            world.Inventories,
            skipValue,
            takeValue,
            inventory => inventory.ToDto(world)));
    });

    // Direct entity lookups.
    dev.MapGet("/stations/{stationId}", (string stationId) =>
    {
        var station = world.FindStation(stationId);
        return station is null
            ? Results.NotFound(new { error = $"Station '{stationId}' was not found." })
            : Results.Ok(station.ToDto());
    });

    dev.MapGet("/actors/{actorId}", (string actorId) =>
    {
        var actor = world.FindActor(actorId);
        return actor is null
            ? Results.NotFound(new { error = $"Actor '{actorId}' was not found." })
            : Results.Ok(actor.ToDto());
    });

    dev.MapGet("/commodities/{commodityId}", (string commodityId) =>
    {
        var commodity = world.FindCommodity(commodityId);
        return commodity is null
            ? Results.NotFound(new { error = $"Commodity '{commodityId}' was not found." })
            : Results.Ok(commodity.ToDto());
    });

    dev.MapGet("/inventories/{inventoryId}", (string inventoryId) =>
    {
        var inventory = world.FindInventory(inventoryId);
        return inventory is null
            ? Results.NotFound(new { error = $"Inventory '{inventoryId}' was not found." })
            : Results.Ok(inventory.ToDto(world));
    });

    // Inventories physically located at a station, regardless of owner.
    dev.MapGet("/stations/{stationId}/inventories", (string stationId, int? skip, int? take) =>
    {
        if (world.FindStation(stationId) is null)
        {
            return Results.NotFound(new { error = $"Station '{stationId}' was not found." });
        }

        var (skipValue, takeValue) = ReadPageBounds(skip, take);
        var located = world.InventoriesLocatedAt(stationId);

        return Results.Ok(BuildPage(
            located,
            skipValue,
            takeValue,
            inventory => inventory.ToDto(world)));
    });

    // Inventories owned by an actor, wherever they are located.
    dev.MapGet("/actors/{actorId}/inventories", (string actorId, int? skip, int? take) =>
    {
        if (world.FindActor(actorId) is null)
        {
            return Results.NotFound(new { error = $"Actor '{actorId}' was not found." });
        }

        var (skipValue, takeValue) = ReadPageBounds(skip, take);
        var owned = world.InventoriesOwnedBy(actorId);

        return Results.Ok(BuildPage(
            owned,
            skipValue,
            takeValue,
            inventory => inventory.ToDto(world)));
    });

    // Inventories holding a positive quantity of a commodity, anywhere in the world.
    // Only the requested commodity's quantity is reported.
    dev.MapGet("/commodities/{commodityId}/inventories", (string commodityId, int? skip, int? take) =>
    {
        if (world.FindCommodity(commodityId) is null)
        {
            return Results.NotFound(new { error = $"Commodity '{commodityId}' was not found." });
        }

        var (skipValue, takeValue) = ReadPageBounds(skip, take);
        var stocked = world.InventoriesContaining(commodityId);

        return Results.Ok(BuildPage(
            stocked,
            skipValue,
            takeValue,
            inventory => new CommodityStockDto(
                inventory.Id,
                inventory.Name,
                inventory.Owner.ToDto(world),
                inventory.Location.ToDto(world),
                inventory.Contents[commodityId])));
    });

    app.Logger.LogInformation(
        "Development inspector running at http://127.0.0.1:{Port} (environment: {Environment})",
        port,
        app.Environment.EnvironmentName);
}

app.Run();

static (int Skip, int Take) ReadPageBounds(int? skip, int? take) =>
    (Math.Max(skip ?? 0, 0), Math.Clamp(take ?? DefaultPageSize, 1, MaxPageSize));

static PageDto<TResult> BuildPage<TSource, TResult>(
    IReadOnlyList<TSource> source,
    int skip,
    int take,
    Func<TSource, TResult> map) =>
    new(skip, take, source.Count, source.Skip(skip).Take(take).Select(map).ToArray());
