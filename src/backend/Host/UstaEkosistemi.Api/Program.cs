using Microsoft.EntityFrameworkCore;
using UstaEkosistemi.Api.Data;
using UstaEkosistemi.Api.Security;
using UstaEkosistemi.Api.ReliableDelivery;
using UstaEkosistemi.Api.Observability;
using UstaEkosistemi.Api.Sms;

var builder = WebApplication.CreateBuilder(args);
builder.Logging.ClearProviders();
builder.Logging.AddSimpleConsole(options => options.IncludeScopes = true);

// Add services to the container.

builder.Services.AddControllers();
builder.Services.AddMemoryCache();
builder.Services.AddCors(options => options.AddPolicy("DevelopmentPwa", policy =>
    policy.WithOrigins("http://localhost:5173", "http://127.0.0.1:5173")
        .AllowAnyHeader()
        .AllowAnyMethod()));
builder.Services.AddDbContext<UstaEkosistemiDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("UstaEkosistemi")));
builder.Services.AddScoped<DealerSessionAuthenticator>();
if (builder.Environment.IsDevelopment()) builder.Services.AddSingleton<ISmsDelivery, DevelopmentSmsDelivery>();
else builder.Services.AddSingleton<ISmsDelivery, UnconfiguredSmsDelivery>();
builder.Services.AddHostedService<OutboxDispatcher>();

var app = builder.Build();

await using (var scope = app.Services.CreateAsyncScope())
{
    var dbContext = scope.ServiceProvider.GetRequiredService<UstaEkosistemiDbContext>();
    if (app.Environment.IsDevelopment()) await dbContext.Database.MigrateAsync();
    else
    {
        var pendingMigrations = await dbContext.Database.GetPendingMigrationsAsync();
        if (pendingMigrations.Any()) throw new InvalidOperationException("Bekleyen veritabanı migration'ları var. Canlıya çıkmadan önce kontrollü migration adımını çalıştırın.");
    }
}

if (app.Environment.IsDevelopment())
{
    app.UseCors("DevelopmentPwa");
    await using var scope = app.Services.CreateAsyncScope();
    await DevelopmentDataSeeder.EnsureCreatedAsync(scope.ServiceProvider.GetRequiredService<UstaEkosistemiDbContext>(), CancellationToken.None);
}

if (!app.Environment.IsDevelopment())
{
    app.UseHsts();
    app.UseHttpsRedirection();
}

app.UseMiddleware<RequestCorrelationMiddleware>();
app.UseAuthorization();
app.UseMiddleware<AdminAuthenticationMiddleware>();
app.UseMiddleware<CraftsmanAuthenticationMiddleware>();

app.MapControllers();
app.MapGet("/api/health", async (UstaEkosistemiDbContext dbContext, CancellationToken cancellationToken) =>
{
    try
    {
        if (!await dbContext.Database.CanConnectAsync(cancellationToken))
        {
            return Results.Problem(statusCode: StatusCodes.Status503ServiceUnavailable, title: "Veritabanı bağlantısı kullanılamıyor.");
        }
        return Results.Ok(new { status = "healthy", service = "usta-ekosistemi-api", database = "connected" });
    }
    catch (Exception)
    {
        return Results.Problem(statusCode: StatusCodes.Status503ServiceUnavailable, title: "Veritabanı bağlantısı kullanılamıyor.");
    }
});

app.Run();
