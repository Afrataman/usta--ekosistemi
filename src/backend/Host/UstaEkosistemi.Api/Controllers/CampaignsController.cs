using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using UstaEkosistemi.Api.Data;

namespace UstaEkosistemi.Api.Controllers;

[ApiController]
[Route("api/campaigns")]
public sealed class CampaignsController(UstaEkosistemiDbContext dbContext) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetActive(CancellationToken cancellationToken)
    {
        var now = DateTimeOffset.UtcNow;
        return Ok(await dbContext.Campaigns.AsNoTracking()
            .Where(x => x.IsActive && x.StartsAtUtc <= now && x.EndsAtUtc > now)
            .OrderBy(x => x.DisplayOrder)
            .Select(x => new { x.Id, x.Title, x.Summary, x.PointMultiplier, x.StartsAtUtc, x.EndsAtUtc })
            .ToListAsync(cancellationToken));
    }
}
