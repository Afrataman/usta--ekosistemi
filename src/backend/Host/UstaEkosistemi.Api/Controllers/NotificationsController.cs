using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using UstaEkosistemi.Api.Data;

namespace UstaEkosistemi.Api.Controllers;

[ApiController]
[Route("api/craftsmen/{craftsmanId:guid}/notifications")]
public sealed class NotificationsController(UstaEkosistemiDbContext dbContext) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll(Guid craftsmanId, CancellationToken token)
    {
        if (!await dbContext.Craftsmen.AnyAsync(x => x.Id == craftsmanId && x.IsActive, token)) return NotFound(new { message = "Aktif usta bulunamadı." });
        var items = await dbContext.CraftsmanNotifications.AsNoTracking().Where(x => x.CraftsmanId == craftsmanId).OrderByDescending(x => x.CreatedAtUtc).Take(100)
            .Select(x => new { x.Id, x.Type, x.Title, x.Message, x.ReferenceType, x.ReferenceId, x.CreatedAtUtc, x.ReadAtUtc }).ToListAsync(token);
        return Ok(new { unreadCount = items.Count(x => x.ReadAtUtc == null), items });
    }

    [HttpPost("{notificationId:guid}/read")]
    public async Task<IActionResult> MarkRead(Guid craftsmanId, Guid notificationId, CancellationToken token)
    {
        var item = await dbContext.CraftsmanNotifications.SingleOrDefaultAsync(x => x.Id == notificationId && x.CraftsmanId == craftsmanId, token);
        if (item is null) return NotFound(new { message = "Bildirim bulunamadı." });
        item.ReadAtUtc ??= DateTimeOffset.UtcNow;
        await dbContext.SaveChangesAsync(token);
        return NoContent();
    }

    [HttpPost("read-all")]
    public async Task<IActionResult> MarkAllRead(Guid craftsmanId, CancellationToken token)
    {
        var now = DateTimeOffset.UtcNow;
        await dbContext.CraftsmanNotifications.Where(x => x.CraftsmanId == craftsmanId && x.ReadAtUtc == null).ExecuteUpdateAsync(x => x.SetProperty(n => n.ReadAtUtc, now), token);
        return NoContent();
    }
}
