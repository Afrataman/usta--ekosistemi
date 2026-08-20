using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using UstaEkosistemi.Api.Data;
using UstaEkosistemi.Api.Domain;

namespace UstaEkosistemi.Api.Controllers;

[ApiController]
[Route("api/admin/support-requests")]
public sealed class AdminSupportController(UstaEkosistemiDbContext dbContext) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll(string? status, CancellationToken token)
    {
        var query = dbContext.SupportRequests.AsNoTracking();
        if (!string.IsNullOrWhiteSpace(status) && Enum.TryParse<SupportRequestStatus>(status, true, out var parsed)) query = query.Where(x => x.Status == parsed);
        return Ok(await query.OrderByDescending(x => x.Priority).ThenByDescending(x => x.UpdatedAtUtc).Take(200).Select(x => new
        {
            x.Id, x.Category, x.Subject, x.Description, x.ReferenceValue, status = x.Status.ToString(), priority = x.Priority.ToString(), x.AssignedTo, x.CreatedAtUtc, x.UpdatedAtUtc, x.ResolvedAtUtc,
            craftsman = x.Craftsman.FullName, phoneNumber = MaskPhone(x.Craftsman.PhoneNumber),
            responses = x.Responses.OrderBy(r => r.CreatedAtUtc).Select(r => new { r.Id, r.Author, r.Message, r.CreatedAtUtc })
        }).ToListAsync(token));
    }

    [HttpPatch("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, UpdateSupportRequest request, CancellationToken token)
    {
        if (!Enum.TryParse<SupportRequestStatus>(request.Status, true, out var status) || !Enum.TryParse<SupportPriority>(request.Priority, true, out var priority)) return ValidationProblem("Durum veya öncelik geçersiz.");
        var item = await dbContext.SupportRequests.SingleOrDefaultAsync(x => x.Id == id, token);
        if (item is null) return NotFound(new { message = "Destek talebi bulunamadı." });
        item.Status = status; item.Priority = priority; item.AssignedTo = string.IsNullOrWhiteSpace(request.AssignedTo) ? null : request.AssignedTo.Trim(); item.UpdatedAtUtc = DateTimeOffset.UtcNow;
        item.ResolvedAtUtc = status is SupportRequestStatus.Resolved or SupportRequestStatus.Closed ? item.ResolvedAtUtc ?? item.UpdatedAtUtc : null;
        await dbContext.SaveChangesAsync(token); return NoContent();
    }

    [HttpPost("{id:guid}/responses")]
    public async Task<IActionResult> Reply(Guid id, AddSupportResponse request, CancellationToken token)
    {
        if (string.IsNullOrWhiteSpace(request.Message) || request.Message.Trim().Length is < 3 or > 1500) return ValidationProblem("Yanıt 3–1500 karakter olmalıdır.");
        var item = await dbContext.SupportRequests.SingleOrDefaultAsync(x => x.Id == id, token);
        if (item is null) return NotFound(new { message = "Destek talebi bulunamadı." });
        var response = new SupportResponse { SupportRequestId = id, Author = "Demo Destek", Message = request.Message.Trim() };
        item.Status = SupportRequestStatus.InProgress; item.AssignedTo ??= response.Author; item.UpdatedAtUtc = response.CreatedAtUtc;
        dbContext.SupportResponses.Add(response);
        dbContext.CraftsmanNotifications.Add(new CraftsmanNotification { CraftsmanId = item.CraftsmanId, Type = "Support", Title = "Destek talebiniz yanıtlandı", Message = $"{item.Subject} başlıklı talebinize yeni yanıt geldi.", ReferenceType = nameof(SupportRequest), ReferenceId = item.Id });
        await dbContext.SaveChangesAsync(token);
        return Created($"/api/admin/support-requests/{id}/responses/{response.Id}", new { response.Id, response.Author, response.Message, response.CreatedAtUtc });
    }

    private static string MaskPhone(string value) => value.Length < 7 ? "***" : $"{value[..3]} *** ** {value[^2..]}";
}

public sealed record UpdateSupportRequest(string Status, string Priority, string? AssignedTo);
public sealed record AddSupportResponse(string Message);
