using Microsoft.EntityFrameworkCore;
using UstaEkosistemi.Api.Data;
using UstaEkosistemi.Api.Security;
using UstaEkosistemi.Api.ReliableDelivery;
using UstaEkosistemi.Api.Observability;
using UstaEkosistemi.Api.Sms;
using System.Threading.RateLimiting;

var builder = WebApplication.CreateBuilder(args);
builder.Logging.ClearProviders();
builder.Logging.AddSimpleConsole(options => options.IncludeScopes = true);

// Add services to the container.

builder.Services.AddControllers();
builder.Services.AddMemoryCache();
builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    options.AddPolicy("api", httpContext => RateLimitPartition.GetFixedWindowLimiter(
        httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown",
        _ => new FixedWindowRateLimiterOptions
        {
            PermitLimit = 120,
            Window = TimeSpan.FromMinutes(1),
            QueueLimit = 0,
            AutoReplenishment = true,
        }));
});
builder.Services.AddCors(options => options.AddPolicy("DevelopmentPwa", policy =>
    policy.WithOrigins("http://localhost:5173", "http://127.0.0.1:5173")
        .AllowAnyHeader()
        .AllowAnyMethod()
        .WithExposedHeaders(RequestCorrelationMiddleware.HeaderName)));
builder.Services.AddDbContext<UstaEkosistemiDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("UstaEkosistemi")));
builder.Services.AddScoped<DealerSessionAuthenticator>();
builder.Services.Configure<NetGsmOptions>(builder.Configuration.GetSection("Sms:NetGsm"));
if (builder.Environment.IsDevelopment()) builder.Services.AddSingleton<ISmsDelivery, DevelopmentSmsDelivery>();
else if (builder.Configuration.GetSection("Sms:NetGsm").Get<NetGsmOptions>()?.IsConfigured == true) builder.Services.AddHttpClient<ISmsDelivery, NetGsmSmsDelivery>();
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

app.Use(async (context, next) =>
{
    context.Response.Headers["X-Content-Type-Options"] = "nosniff";
    context.Response.Headers["Referrer-Policy"] = "strict-origin-when-cross-origin";
    context.Response.Headers["Permissions-Policy"] = "camera=(self), microphone=(), geolocation=()";
    await next();
});

app.UseMiddleware<RequestCorrelationMiddleware>();
app.UseRateLimiter();
app.UseAuthorization();
app.UseMiddleware<AdminAuthenticationMiddleware>();
app.UseMiddleware<CraftsmanAuthenticationMiddleware>();

app.MapControllers().RequireRateLimiting("api");
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
