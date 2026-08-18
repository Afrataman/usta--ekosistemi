using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using UstaEkosistemi.Api.Data;
using UstaEkosistemi.Api.Domain;

namespace UstaEkosistemi.Api.Controllers;

[ApiController]
[Route("api/craftsmen/{craftsmanId:guid}/support-requests")]
public sealed class SupportRequestsController(UstaEkosistemiDbContext dbContext) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetMine(Guid craftsmanId, CancellationToken cancellationToken) => Ok(
        await dbContext.SupportRequests.AsNoTracking().Where(x => x.CraftsmanId == craftsmanId)
            .OrderByDescending(x => x.CreatedAtUtc)
            .Select(x => new { x.Id, x.Category, x.Subject, x.Description, status = x.Status.ToString(), x.CreatedAtUtc, x.ResolvedAtUtc })
            .ToListAsync(cancellationToken));

    [HttpPost]
    public async Task<IActionResult> Create(Guid craftsmanId, CreateSupportRequest request, CancellationToken cancellationToken)
    {
        if (!await dbContext.Craftsmen.AnyAsync(x => x.Id == craftsmanId && x.IsActive, cancellationToken)) return NotFound(new { message = "Aktif usta bulunamadı." });
        if (string.IsNullOrWhiteSpace(request.Subject) || request.Subject.Trim().Length is < 5 or > 140 || string.IsNullOrWhiteSpace(request.Description) || request.Description.Trim().Length is < 10 or > 1500)
            return ValidationProblem("Konu en az 5, açıklama en az 10 karakter olmalıdır.");
        var item = new SupportRequest { CraftsmanId = craftsmanId, Category = request.Category.Trim(), Subject = request.Subject.Trim(), Description = request.Description.Trim() };
        dbContext.SupportRequests.Add(item); await dbContext.SaveChangesAsync(cancellationToken);
        return Created($"/api/craftsmen/{craftsmanId}/support-requests/{item.Id}", new { item.Id, status = item.Status.ToString(), item.CreatedAtUtc });
    }
}

public sealed record CreateSupportRequest(string Category, string Subject, string Description);
