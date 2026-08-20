using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using UstaEkosistemi.Api.Data;

namespace UstaEkosistemi.Api.Controllers;

[ApiController]
[Route("api/demo")]
public sealed class DemoController(
    UstaEkosistemiDbContext dbContext,
    IWebHostEnvironment environment) : ControllerBase
{
    [HttpGet("dashboard")]
    public async Task<IActionResult> GetDashboard(CancellationToken cancellationToken)
    {
        if (!environment.IsDevelopment())
        {
            return NotFound();
        }

        await DevelopmentDataSeeder.EnsureCreatedAsync(dbContext, cancellationToken);
        var craftsman = await dbContext.Craftsmen.AsNoTracking()
            .SingleAsync(x => x.Id == DevelopmentDataSeeder.DemoCraftsmanId, cancellationToken);
        var balance = await dbContext.PointLedgerEntries
            .Where(x => x.CraftsmanId == craftsman.Id)
            .SumAsync(x => x.Amount, cancellationToken);
        var movements = await dbContext.PointLedgerEntries.AsNoTracking()
            .Where(x => x.CraftsmanId == craftsman.Id)
            .OrderByDescending(x => x.CreatedAtUtc)
            .Take(3)
            .Select(x => new DashboardMovement(x.Description, x.CreatedAtUtc, x.Amount))
            .ToListAsync(cancellationToken);

        return Ok(new DashboardResponse(
            craftsman.Id,
            craftsman.FullName,
            craftsman.Level.ToString(),
            balance,
            balance / 20,
            Math.Max(0, 12_500 - balance),
            movements,
            DateTimeOffset.UtcNow));
    }
}

public sealed record DashboardResponse(
    Guid CraftsmanId,
    string FullName,
    string Level,
    int Balance,
    int RewardValueTry,
    int PointsToNextLevel,
    IReadOnlyList<DashboardMovement> Movements,
    DateTimeOffset UpdatedAtUtc);

public sealed record DashboardMovement(string Description, DateTimeOffset CreatedAtUtc, int Amount);
