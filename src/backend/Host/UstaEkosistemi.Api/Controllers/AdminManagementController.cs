using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using UstaEkosistemi.Api.Data;

namespace UstaEkosistemi.Api.Controllers;

[ApiController]
[Route("api/admin")]
public sealed class AdminManagementController(UstaEkosistemiDbContext dbContext) : ControllerBase
{
    [HttpGet("craftsmen")]
    public async Task<IActionResult> GetCraftsmen(CancellationToken token)
    {
        var items = await dbContext.Craftsmen.AsNoTracking().OrderByDescending(x => x.CreatedAtUtc).Select(x => new
        {
            x.Id, x.FullName, x.PhoneNumber, x.City, level = x.Level.ToString(), x.IsActive, x.CreatedAtUtc,
            balance = x.PointLedgerEntries.Sum(p => (int?)p.Amount) ?? 0
        }).ToListAsync(token);
        return Ok(items);
    }

    [HttpPatch("craftsmen/{id:guid}/active")]
    public async Task<IActionResult> SetCraftsmanActive(Guid id, SetActiveRequest request, CancellationToken token)
    {
        var item = await dbContext.Craftsmen.SingleOrDefaultAsync(x => x.Id == id, token);
        if (item is null) return NotFound(new { message = "Usta bulunamadı." });
        item.IsActive = request.IsActive; await dbContext.SaveChangesAsync(token);
        return Ok(new { item.Id, item.IsActive });
    }

    [HttpGet("dealers")]
    public async Task<IActionResult> GetDealers(CancellationToken token)
    {
        var items = await dbContext.Dealers.AsNoTracking().OrderBy(x => x.Name).Select(x => new
        {
            x.Id, x.Code, x.Name, x.IsActive,
            activeEmployees = x.Employees.Count(e => e.IsActive),
            totalEmployees = x.Employees.Count
        }).ToListAsync(token);
        return Ok(items);
    }

    [HttpPatch("dealers/{id:guid}/active")]
    public async Task<IActionResult> SetDealerActive(Guid id, SetActiveRequest request, CancellationToken token)
    {
        var item = await dbContext.Dealers.SingleOrDefaultAsync(x => x.Id == id, token);
        if (item is null) return NotFound(new { message = "Bayi bulunamadı." });
        item.IsActive = request.IsActive; await dbContext.SaveChangesAsync(token);
        return Ok(new { item.Id, item.IsActive });
    }
}

public sealed record SetActiveRequest(bool IsActive);
