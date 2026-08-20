using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using UstaEkosistemi.Api.Data;
using UstaEkosistemi.Api.Domain;

namespace UstaEkosistemi.Api.Controllers;

[ApiController]
[Route("api/admin/notifications")]
public sealed class AdminNotificationsController(UstaEkosistemiDbContext dbContext) : ControllerBase
{
    [HttpGet("audience")]
    public async Task<IActionResult> GetAudience(string? level, string? city, CancellationToken token)
    {
        var query = EligibleCraftsmen(level, city);
        var cities = await dbContext.Craftsmen.AsNoTracking().Where(x => x.IsActive && x.City != null).Select(x => x.City!).Distinct().OrderBy(x => x).ToListAsync(token);
        return Ok(new { recipientCount = await query.CountAsync(token), cities });
    }

    [HttpGet("history")]
    public async Task<IActionResult> GetHistory(CancellationToken token)
    {
        var items = await dbContext.CraftsmanNotifications.AsNoTracking().Where(x => x.ReferenceType == "AdminBroadcast" && x.ReferenceId != null)
            .GroupBy(x => x.ReferenceId!.Value).Select(group => new
            {
                id = group.Key,
                title = group.Select(x => x.Title).First(),
                message = group.Select(x => x.Message).First(),
                recipientCount = group.Count(),
                readCount = group.Count(x => x.ReadAtUtc != null),
                createdAtUtc = group.Max(x => x.CreatedAtUtc)
            }).OrderByDescending(x => x.createdAtUtc).Take(30).ToListAsync(token);
        return Ok(items);
    }

    [HttpPost]
    public async Task<IActionResult> Send(SendTargetedNotificationRequest request, CancellationToken token)
    {
        var title = request.Title.Trim(); var message = request.Message.Trim(); var city = string.IsNullOrWhiteSpace(request.City) ? null : request.City.Trim();
        if (title.Length is < 3 or > 140 || message.Length is < 10 or > 500) return ValidationProblem("Başlık 3-140, mesaj 10-500 karakter arasında olmalıdır.");
        if (!string.IsNullOrWhiteSpace(request.Level) && !Enum.TryParse<CraftsmanLevel>(request.Level, true, out _)) return ValidationProblem("Geçersiz usta seviyesi.");
        var recipientIds = await EligibleCraftsmen(request.Level, city).Select(x => x.Id).ToListAsync(token);
        if (recipientIds.Count == 0) return Conflict(new { message = "Seçilen hedefte bildirim almayı kabul etmiş aktif usta bulunamadı." });
        var broadcastId = Guid.NewGuid(); var now = DateTimeOffset.UtcNow;
        dbContext.CraftsmanNotifications.AddRange(recipientIds.Select(id => new CraftsmanNotification { CraftsmanId = id, Type = "Campaign", Title = title, Message = message, ReferenceType = "AdminBroadcast", ReferenceId = broadcastId, CreatedAtUtc = now }));
        await dbContext.SaveChangesAsync(token);
        return Ok(new { id = broadcastId, recipientCount = recipientIds.Count, title, level = request.Level, city, createdAtUtc = now });
    }

    private IQueryable<Craftsman> EligibleCraftsmen(string? level, string? city)
    {
        var query = dbContext.Craftsmen.Where(x => x.IsActive && x.CampaignNotificationsEnabled);
        if (!string.IsNullOrWhiteSpace(level) && Enum.TryParse<CraftsmanLevel>(level, true, out var parsedLevel)) query = query.Where(x => x.Level == parsedLevel);
        if (!string.IsNullOrWhiteSpace(city)) { var normalizedCity = city.Trim(); query = query.Where(x => x.City == normalizedCity); }
        return query;
    }
}

public sealed record SendTargetedNotificationRequest(string Title, string Message, string? Level, string? City);
