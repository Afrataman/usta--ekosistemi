using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using UstaEkosistemi.Api.Data;
using UstaEkosistemi.Api.Domain;
using UstaEkosistemi.Api.ReliableDelivery;
using UstaEkosistemi.Api.Security;

namespace UstaEkosistemi.Api.Controllers;

[ApiController]
[Route("api/admin/campaigns")]
public sealed class AdminCampaignsController(UstaEkosistemiDbContext dbContext) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll(CancellationToken token) => Ok(await dbContext.Campaigns.AsNoTracking().OrderByDescending(x => x.StartsAtUtc).Select(x => new { x.Id, x.Title, x.Summary, x.PointMultiplier, x.StartsAtUtc, x.EndsAtUtc, x.IsActive, x.DisplayOrder, x.ProductId, productName = x.Product == null ? null : x.Product.Name, approvalStatus = dbContext.CampaignApprovals.Where(a => a.CampaignId == x.Id).Select(a => a.Status.ToString()).SingleOrDefault() }).ToListAsync(token));

    [HttpPost]
    public async Task<IActionResult> Create(CreateCampaignRequest request, CancellationToken token)
    {
        var title = request.Title.Trim(); var summary = request.Summary.Trim();
        if (title.Length is < 3 or > 140 || summary.Length is < 10 or > 500) return ValidationProblem("Kampanya başlığı veya açıklaması uygun uzunlukta değil.");
        if (request.PointMultiplier is < 1 or > 10) return ValidationProblem("Puan çarpanı 1 ile 10 arasında olmalıdır.");
        if (request.EndsAtUtc <= request.StartsAtUtc) return ValidationProblem("Bitiş tarihi başlangıç tarihinden sonra olmalıdır.");
        if (request.ProductId.HasValue && !await dbContext.Products.AnyAsync(x => x.Id == request.ProductId && x.IsActive, token)) return ValidationProblem("Seçilen aktif ürün bulunamadı.");
        if (HttpContext.Items["AdminUserId"] is not Guid requesterId) return Unauthorized();
        var needsApproval = request.IsActive && request.PointMultiplier >= 2;
        var campaign = new Campaign { Title = title, Summary = summary, PointMultiplier = request.PointMultiplier, StartsAtUtc = request.StartsAtUtc, EndsAtUtc = request.EndsAtUtc, IsActive = request.IsActive && !needsApproval, DisplayOrder = request.DisplayOrder, ProductId = request.ProductId };
        dbContext.Campaigns.Add(campaign);
        if (needsApproval) dbContext.CampaignApprovals.Add(new CampaignApproval { CampaignId = campaign.Id, RequestedByAdminUserId = requesterId });
        if (campaign.IsActive) await AddCampaignNotifications(campaign, token);
        dbContext.AddAdminAudit(HttpContext, needsApproval ? "CampaignApprovalRequested" : "CampaignCreated", nameof(Campaign), campaign.Id, $"Kampanya={title}; çarpan={request.PointMultiplier:0.##}X; ikinci onay={needsApproval}");
        await dbContext.SaveChangesAsync(token);
        return Created($"/api/admin/campaigns/{campaign.Id}", new { campaign.Id, requiresApproval = needsApproval, isActive = campaign.IsActive });
    }

    [HttpPatch("{id:guid}/active")]
    public async Task<IActionResult> SetActive(Guid id, SetActiveRequest request, CancellationToken token)
    {
        var campaign = await dbContext.Campaigns.SingleOrDefaultAsync(x => x.Id == id, token);
        if (campaign is null) return NotFound(new { message = "Kampanya bulunamadı." });
        var approvalStatus = await dbContext.CampaignApprovals.Where(x => x.CampaignId == id).Select(x => (CampaignApprovalStatus?)x.Status).SingleOrDefaultAsync(token);
        if (request.IsActive && approvalStatus is CampaignApprovalStatus.Pending or CampaignApprovalStatus.Rejected) return Conflict(new { message = "Bu yüksek etkili kampanya ikinci yönetici onayı olmadan etkinleştirilemez." });
        var newlyActivated = request.IsActive && !campaign.IsActive;
        campaign.IsActive = request.IsActive;
        if (newlyActivated) await AddCampaignNotifications(campaign, token);
        await dbContext.SaveChangesAsync(token);
        return Ok(new { campaign.Id, campaign.IsActive });
    }

    [HttpGet("approvals")]
    public async Task<IActionResult> GetApprovals(CancellationToken token) => Ok(await dbContext.CampaignApprovals.AsNoTracking().OrderBy(x => x.Status).ThenByDescending(x => x.RequestedAtUtc).Select(x => new { x.Id, x.CampaignId, campaign = x.Campaign.Title, x.Campaign.PointMultiplier, status = x.Status.ToString(), requestedBy = x.RequestedByAdminUser.FullName, x.RequestedAtUtc, decidedBy = x.DecidedByAdminUser == null ? null : x.DecidedByAdminUser.FullName, x.DecidedAtUtc, x.DecisionNote }).ToListAsync(token));

    [HttpPost("approvals/{id:guid}/approve")]
    public async Task<IActionResult> Approve(Guid id, CampaignApprovalDecisionRequest request, CancellationToken token)
    {
        if (HttpContext.Items["AdminUserId"] is not Guid approverId) return Unauthorized();
        var approval = await dbContext.CampaignApprovals.Include(x => x.Campaign).SingleOrDefaultAsync(x => x.Id == id, token);
        if (approval is null) return NotFound();
        if (approval.Status != CampaignApprovalStatus.Pending) return Conflict(new { message = "Bu onay talebi daha önce sonuçlandırılmış." });
        if (approval.RequestedByAdminUserId == approverId) return Conflict(new { message = "Kampanyayı oluşturan yönetici ikinci onayı veremez." });
        var note = request.Note.Trim(); if (note.Length is < 5 or > 400) return ValidationProblem("Onay gerekçesi 5 ile 400 karakter arasında olmalıdır.");
        approval.Status = CampaignApprovalStatus.Approved; approval.DecidedByAdminUserId = approverId; approval.DecidedAtUtc = DateTimeOffset.UtcNow; approval.DecisionNote = note; approval.Campaign.IsActive = true;
        await AddCampaignNotifications(approval.Campaign, token); dbContext.AddAdminAudit(HttpContext, "CampaignApproved", nameof(Campaign), approval.CampaignId, $"Kampanya ikinci yönetici tarafından onaylandı. Gerekçe={note}");
        await dbContext.SaveChangesAsync(token); return Ok(new { approval.CampaignId, status = approval.Status.ToString(), approval.Campaign.IsActive });
    }

    [HttpPost("approvals/{id:guid}/reject")]
    public async Task<IActionResult> Reject(Guid id, CampaignApprovalDecisionRequest request, CancellationToken token)
    {
        if (HttpContext.Items["AdminUserId"] is not Guid approverId) return Unauthorized();
        var approval = await dbContext.CampaignApprovals.Include(x => x.Campaign).SingleOrDefaultAsync(x => x.Id == id, token);
        if (approval is null) return NotFound();
        if (approval.Status != CampaignApprovalStatus.Pending) return Conflict(new { message = "Bu onay talebi daha önce sonuçlandırılmış." });
        if (approval.RequestedByAdminUserId == approverId) return Conflict(new { message = "Kampanyayı oluşturan yönetici ret kararı veremez." });
        var note = request.Note.Trim(); if (note.Length is < 5 or > 400) return ValidationProblem("Ret gerekçesi 5 ile 400 karakter arasında olmalıdır.");
        approval.Status = CampaignApprovalStatus.Rejected; approval.DecidedByAdminUserId = approverId; approval.DecidedAtUtc = DateTimeOffset.UtcNow; approval.DecisionNote = note; approval.Campaign.IsActive = false;
        dbContext.AddAdminAudit(HttpContext, "CampaignRejected", nameof(Campaign), approval.CampaignId, $"Kampanya ikinci yönetici tarafından reddedildi. Gerekçe={note}");
        await dbContext.SaveChangesAsync(token); return Ok(new { approval.CampaignId, status = approval.Status.ToString() });
    }

    private async Task AddCampaignNotifications(Campaign campaign, CancellationToken token)
    {
        var craftsmanIds = await dbContext.Craftsmen.Where(x => x.IsActive && x.CampaignNotificationsEnabled).Select(x => x.Id).ToListAsync(token);
        foreach (var id in craftsmanIds) dbContext.QueueCraftsmanNotification(id, "Campaign", campaign.Title, campaign.Summary, nameof(Campaign), campaign.Id);
    }
}

public sealed record CreateCampaignRequest(string Title, string Summary, decimal PointMultiplier, DateTimeOffset StartsAtUtc, DateTimeOffset EndsAtUtc, bool IsActive, int DisplayOrder, Guid? ProductId);
public sealed record CampaignApprovalDecisionRequest(string Note);
