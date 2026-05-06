using WebAPI.Models;

namespace WebAPI;

// Opens a SQL connection during app startup so the first user request doesn't pay
// the cold-path cost (Managed Identity token fetch + TLS handshake + TDS login),
// which on Azure App Service B1 can take 30+ seconds and sometimes throws a transient
// "Connection reset by peer" the very first time.
//
// How it's wired up:
//   Program.cs registers this with builder.Services.AddHostedService<DbWarmupService>().
//   ASP.NET Core's generic host calls StartAsync() automatically as part of app boot,
//   BEFORE Kestrel begins accepting HTTP requests. We never call StartAsync ourselves.
//
// Failure behavior:
//   We swallow any exception so a flaky warmup never blocks app startup. If warmup
//   fails, the first real request will still benefit from EF Core's EnableRetryOnFailure
//   (configured in Program.cs) — it'll just be slower.
internal class DbWarmupService : IHostedService
{
    private readonly IServiceProvider _services;
    private readonly ILogger<DbWarmupService> _logger;

    public DbWarmupService(IServiceProvider services, ILogger<DbWarmupService> logger)
    {
        _services = services;
        _logger = logger;
    }

    public async Task StartAsync(CancellationToken cancellationToken)
    {
        try
        {
            // DbContext is scoped, so we need a scope to resolve it from the root provider.
            using var scope = _services.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<HistoryProjectDbContext>();

            // SELECT 1 forces the driver to open a real connection (MI token + handshake)
            // without touching any tables.
            await db.Database.ExecuteSqlRawAsync("SELECT 1", cancellationToken);
            _logger.LogInformation("DB warmup completed");
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "DB warmup failed; first request will retry via EnableRetryOnFailure");
        }
    }

    public Task StopAsync(CancellationToken cancellationToken) => Task.CompletedTask;
}
