using Microsoft.EntityFrameworkCore;
using PhraseLearner.Api.Data;
using PhraseLearner.Api.Services;

var builder = WebApplication.CreateBuilder(args);

// Database configuration - PostgreSQL (Render/Neon) or SQLite (local)
var databaseUrl = Environment.GetEnvironmentVariable("DATABASE_URL");
if (!string.IsNullOrEmpty(databaseUrl))
{
    // Convert postgres:// URL format to Npgsql connection string format
    var connectionString = ConvertPostgresUrl(databaseUrl);
    builder.Services.AddDbContext<AppDbContext>(options =>
        options.UseNpgsql(connectionString));
}
else
{
    // SQLite for local development
    var dataPath = Environment.GetEnvironmentVariable("DATA_PATH") ?? "/data";
    Directory.CreateDirectory(dataPath);
    var dbPath = Path.Combine(dataPath, "app.db");
    builder.Services.AddDbContext<AppDbContext>(options =>
        options.UseSqlite($"Data Source={dbPath}"));
}

static string ConvertPostgresUrl(string url)
{
    // Handle both postgresql:// and postgres:// schemes
    if (url.StartsWith("postgresql://") || url.StartsWith("postgres://"))
    {
        var uri = new Uri(url);
        var userInfo = uri.UserInfo.Split(':');
        var host = uri.Host;
        var port = uri.Port > 0 ? uri.Port : 5432;
        var database = uri.AbsolutePath.TrimStart('/');
        var query = System.Web.HttpUtility.ParseQueryString(uri.Query);
        var sslMode = query["sslmode"] ?? "Require";
        
        return $"Host={host};Port={port};Database={database};Username={userInfo[0]};Password={userInfo[1]};SSL Mode={sslMode}";
    }
    // Already in Npgsql format
    return url;
}

// CORS - allow cross-origin requests
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

builder.Services.AddScoped<ReviewService>();
builder.Services.AddSingleton<IAiService, GroqAiService>();
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    try
    {
        Console.WriteLine("Applying migrations...");
        db.Database.Migrate();
        Console.WriteLine("Migrations applied successfully.");
    }
    catch (Exception ex)
    {
        Console.WriteLine($"Migration failed: {ex.Message}");
        Console.WriteLine("Attempting EnsureCreated...");
        db.Database.EnsureCreated();
        Console.WriteLine("EnsureCreated completed.");
    }
}

// Enable CORS
app.UseCors();

app.UseDefaultFiles();
app.UseStaticFiles();

app.MapControllers();

app.MapFallbackToFile("index.html");

app.Run();
