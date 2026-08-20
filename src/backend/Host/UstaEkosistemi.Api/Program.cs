using Microsoft.EntityFrameworkCore;
using UstaEkosistemi.Api.Data;
using UstaEkosistemi.Api.Security;

var builder = WebApplication.CreateBuilder(args);
builder.Logging.ClearProviders();
builder.Logging.AddConsole();

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

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseCors("DevelopmentPwa");
    await using var scope = app.Services.CreateAsyncScope();
    await DevelopmentDataSeeder.EnsureCreatedAsync(scope.ServiceProvider.GetRequiredService<UstaEkosistemiDbContext>(), CancellationToken.None);
}

if (!app.Environment.IsDevelopment())
{
    app.UseHttpsRedirection();
}

app.UseAuthorization();
app.UseMiddleware<AdminAuthenticationMiddleware>();
app.UseMiddleware<CraftsmanAuthenticationMiddleware>();

app.MapControllers();
app.MapGet("/api/health", async (UstaEkosistemiDbContext dbContext, CancellationToken cancellationToken) => Results.Ok(new
{
    status = "healthy",
    service = "usta-ekosistemi-api",
    database = await dbContext.Database.CanConnectAsync(cancellationToken) ? "connected" : "unavailable"
}));

app.Run();
