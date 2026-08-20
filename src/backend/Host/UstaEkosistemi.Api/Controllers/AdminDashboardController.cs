using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using UstaEkosistemi.Api.Data;
using UstaEkosistemi.Api.Domain;

namespace UstaEkosistemi.Api.Controllers;

[ApiController]
[Route("api/admin")]
public sealed class AdminDashboardController(UstaEkosistemiDbContext dbContext) : ControllerBase
{
    [HttpGet("overview")]
    public async Task<IActionResult> GetOverview(CancellationToken cancellationToken) => Ok(new
    {
        craftsmen = await dbContext.Craftsmen.CountAsync(x => x.IsActive, cancellationToken),
        dealers = await dbContext.Dealers.CountAsync(x => x.IsActive, cancellationToken),
        activeCoupons = await dbContext.RewardRedemptions.CountAsync(x => x.Status == RewardRedemptionStatus.Created, cancellationToken),
        openRiskCases = await dbContext.RiskCases.CountAsync(x => x.Status == RiskCaseStatus.Open || x.Status == RiskCaseStatus.InReview, cancellationToken)
    });

    [HttpGet("risk-cases")]
    public async Task<IActionResult> GetRiskCases(CancellationToken cancellationToken)
    {
        var items = await dbContext.RiskCases.AsNoTracking().OrderByDescending(x => x.CreatedAtUtc).Take(100).Select(x => new
        {
            x.Id, x.ReferenceType, x.ReferenceValue, x.Reason, x.Description, status = x.Status.ToString(), x.CreatedAtUtc, x.ReviewedAtUtc,
            dealerEmployee = x.ReportedByDealerEmployee.FullName,
            dealer = x.ReportedByDealerEmployee.Dealer.Name,
            actions = x.Actions.OrderBy(a => a.CreatedAtUtc).Select(a => new { a.Id, status = a.Status.ToString(), a.DecisionNote, reviewer = a.AdminUser.FullName, a.CreatedAtUtc })
        }).ToListAsync(cancellationToken);
        return Ok(items);
    }

    [HttpPatch("risk-cases/{id:guid}/status")]
    public async Task<IActionResult> UpdateRiskStatus(Guid id, UpdateRiskStatusRequest request, CancellationToken cancellationToken)
    {
        if (!Enum.TryParse<RiskCaseStatus>(request.Status, true, out var status) || status == RiskCaseStatus.Open) return ValidationProblem("Durum InReview, Resolved veya Rejected olmalıdır.");
        var note = request.DecisionNote.Trim();
        if (note.Length is < 5 or > 1000) return ValidationProblem("İnceleme veya karar notu 5–1000 karakter olmalıdır.");
        if (HttpContext.Items["AdminUserId"] is not Guid adminUserId) return Unauthorized(new { message = "Yönetici oturumu bulunamadı." });
        var item = await dbContext.RiskCases.SingleOrDefaultAsync(x => x.Id == id, cancellationToken);
        if (item is null) return NotFound(new { message = "Şüpheli işlem kaydı bulunamadı." });
        item.Status = status; item.ReviewedAtUtc = status == RiskCaseStatus.InReview ? null : DateTimeOffset.UtcNow;
        dbContext.RiskCaseActions.Add(new RiskCaseAction { RiskCaseId = item.Id, AdminUserId = adminUserId, Status = status, DecisionNote = note });
        await dbContext.SaveChangesAsync(cancellationToken);
        return Ok(new { item.Id, status = item.Status.ToString(), item.ReviewedAtUtc });
    }
}

public sealed record UpdateRiskStatusRequest(string Status, string DecisionNote);
