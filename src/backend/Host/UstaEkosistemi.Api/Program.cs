using Microsoft.EntityFrameworkCore;
using UstaEkosistemi.Api.Data;

var builder = WebApplication.CreateBuilder(args);
builder.Logging.ClearProviders();
builder.Logging.AddConsole();

// Add services to the container.

builder.Services.AddControllers();
builder.Services.AddCors(options => options.AddPolicy("DevelopmentPwa", policy =>
    policy.WithOrigins("http://localhost:5173", "http://127.0.0.1:5173")
        .AllowAnyHeader()
        .AllowAnyMethod()));
builder.Services.AddDbContext<UstaEkosistemiDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("UstaEkosistemi")));

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseCors("DevelopmentPwa");
}

if (!app.Environment.IsDevelopment())
{
    app.UseHttpsRedirection();
}

app.UseAuthorization();

app.MapControllers();
app.MapGet("/api/health", async (UstaEkosistemiDbContext dbContext, CancellationToken cancellationToken) => Results.Ok(new
{
    status = "healthy",
    service = "usta-ekosistemi-api",
    database = await dbContext.Database.CanConnectAsync(cancellationToken) ? "connected" : "unavailable"
}));

app.Run();
