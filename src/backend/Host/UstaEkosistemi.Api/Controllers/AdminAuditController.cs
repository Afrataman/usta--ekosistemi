using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using UstaEkosistemi.Api.Data;

namespace UstaEkosistemi.Api.Controllers;

[ApiController]
[Route("api/admin/audit")]
public sealed class AdminAuditController(UstaEkosistemiDbContext dbContext) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> Get(string? entityType, int take = 200, CancellationToken token = default)
    {
        take = Math.Clamp(take, 1, 500); var query = dbContext.AdminAuditEntries.AsNoTracking();
        if (!string.IsNullOrWhiteSpace(entityType)) query = query.Where(x => x.EntityType == entityType);
        var rows = await query.OrderByDescending(x => x.CreatedAtUtc).Take(take).Select(x => new { x.Id, x.Actor, x.Action, x.EntityType, x.EntityId, x.Details, x.CorrelationId, x.CreatedAtUtc }).ToListAsync(token);
        var entityTypes = await dbContext.AdminAuditEntries.AsNoTracking().Select(x => x.EntityType).Distinct().OrderBy(x => x).ToListAsync(token);
        return Ok(new { rows, entityTypes });
    }
}
