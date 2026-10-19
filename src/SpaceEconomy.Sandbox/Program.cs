using SpaceEconomy.Domain;

var food = new Commodity("food", "Food");
var bob = new Actor("bob", "Bob");
var ceres = new Station("ceres", "Ceres Station");

Console.WriteLine($"{"Commodity:",-11} id = {food.Id}, name = {food.Name}");
Console.WriteLine($"{"Actor:",-11} id = {bob.Id}, name = {bob.Name}");
Console.WriteLine($"{"Station:",-11} id = {ceres.Id}, name = {ceres.Name}");
