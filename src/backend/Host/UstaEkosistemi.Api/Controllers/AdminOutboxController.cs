using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using UstaEkosistemi.Api.Data;
using UstaEkosistemi.Api.Domain;
using UstaEkosistemi.Api.Security;

namespace UstaEkosistemi.Api.Controllers;

[ApiController]
[Route("api/admin/outbox")]
public sealed class AdminOutboxController(UstaEkosistemiDbContext dbContext) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> Get(CancellationToken token)
    {
        var rows = await dbContext.OutboxMessages.AsNoTracking().OrderByDescending(x => x.CreatedAtUtc).Take(200)
            .Select(x => new { x.Id, x.Type, status = x.Status.ToString(), x.AttemptCount, x.CorrelationId, x.CreatedAtUtc, x.NextAttemptAtUtc, x.DeliveredAtUtc, x.LastError }).ToListAsync(token);
        var summary = new
        {
            pending = await dbContext.OutboxMessages.CountAsync(x => x.Status == OutboxMessageStatus.Pending, token),
            delivered = await dbContext.OutboxMessages.CountAsync(x => x.Status == OutboxMessageStatus.Delivered, token),
            failed = await dbContext.OutboxMessages.CountAsync(x => x.Status == OutboxMessageStatus.Failed, token)
        };
        return Ok(new { rows, summary });
    }

    [HttpPost("{id:guid}/retry")]
    public async Task<IActionResult> Retry(Guid id, CancellationToken token)
    {
        var item = await dbContext.OutboxMessages.SingleOrDefaultAsync(x => x.Id == id, token);
        if (item is null) return NotFound();
        if (item.Status == OutboxMessageStatus.Delivered) return Conflict(new { message = "Teslim edilmiş kayıt yeniden gönderilemez." });
        item.Status = OutboxMessageStatus.Pending; item.NextAttemptAtUtc = DateTimeOffset.UtcNow; item.LastError = null;
        dbContext.AddAdminAudit(HttpContext, "Retry", nameof(OutboxMessage), item.Id, $"Başarısız güvenilir teslim kaydı yeniden kuyruğa alındı. Önceki deneme: {item.AttemptCount}");
        await dbContext.SaveChangesAsync(token);
        return NoContent();
    }
}
