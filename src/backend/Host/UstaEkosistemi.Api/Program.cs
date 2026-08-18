var builder = WebApplication.CreateBuilder(args);

// Add services to the container.

builder.Services.AddControllers();

var app = builder.Build();

app.UseHttpsRedirection();

app.UseAuthorization();

app.MapControllers();
app.MapGet("/api/health", () => Results.Ok(new
{
    status = "healthy",
    service = "usta-ekosistemi-api"
}));

app.Run();
