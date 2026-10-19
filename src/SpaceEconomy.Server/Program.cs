using SpaceEconomy.Server;

const int DefaultInventoryPageSize = 20;
const int MaxInventoryPageSize = 100;

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

    dev.MapGet("/stations", () =>
        world.Stations
            .OrderBy(station => station.Name, StringComparer.Ordinal)
            .Select(station => station.ToDto())
            .ToArray());

    dev.MapGet("/stations/{stationId}", (string stationId) =>
    {
        var station = world.FindStation(stationId);
        return station is null
            ? Results.NotFound(new { error = $"Station '{stationId}' was not found." })
            : Results.Ok(station.ToDto());
    });

    dev.MapGet("/stations/{stationId}/inventories", (string stationId, int? skip, int? take) =>
    {
        if (world.FindStation(stationId) is null)
        {
            return Results.NotFound(new { error = $"Station '{stationId}' was not found." });
        }

        var skipValue = Math.Max(skip ?? 0, 0);
        var takeValue = Math.Clamp(take ?? DefaultInventoryPageSize, 1, MaxInventoryPageSize);
        var located = world.InventoriesLocatedAt(stationId);
        var page = located
            .Skip(skipValue)
            .Take(takeValue)
            .Select(inventory => inventory.ToDto(world))
            .ToArray();

        return Results.Ok(new InventoryPageDto(skipValue, takeValue, located.Count, page));
    });

    dev.MapGet("/inventories/{inventoryId}", (string inventoryId) =>
    {
        var inventory = world.FindInventory(inventoryId);
        return inventory is null
            ? Results.NotFound(new { error = $"Inventory '{inventoryId}' was not found." })
            : Results.Ok(inventory.ToDto(world));
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

    app.Logger.LogInformation(
        "Development inspector running at http://127.0.0.1:{Port} (environment: {Environment})",
        port,
        app.Environment.EnvironmentName);
}

app.Run();
