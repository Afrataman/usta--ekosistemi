using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using UstaEkosistemi.Api.Data;
using UstaEkosistemi.Api.Domain;

namespace UstaEkosistemi.Api.Controllers;

[ApiController]
[Route("api/admin/campaigns")]
public sealed class AdminCampaignsController(UstaEkosistemiDbContext dbContext) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll(CancellationToken token) => Ok(await dbContext.Campaigns.AsNoTracking().OrderByDescending(x => x.StartsAtUtc).Select(x => new { x.Id, x.Title, x.Summary, x.PointMultiplier, x.StartsAtUtc, x.EndsAtUtc, x.IsActive, x.DisplayOrder }).ToListAsync(token));

    [HttpPost]
    public async Task<IActionResult> Create(CreateCampaignRequest request, CancellationToken token)
    {
        var title = request.Title.Trim(); var summary = request.Summary.Trim();
        if (title.Length is < 3 or > 140 || summary.Length is < 10 or > 500) return ValidationProblem("Kampanya başlığı veya açıklaması uygun uzunlukta değil.");
        if (request.PointMultiplier is < 1 or > 10) return ValidationProblem("Puan çarpanı 1 ile 10 arasında olmalıdır.");
        if (request.EndsAtUtc <= request.StartsAtUtc) return ValidationProblem("Bitiş tarihi başlangıç tarihinden sonra olmalıdır.");
        var campaign = new Campaign { Title = title, Summary = summary, PointMultiplier = request.PointMultiplier, StartsAtUtc = request.StartsAtUtc, EndsAtUtc = request.EndsAtUtc, IsActive = request.IsActive, DisplayOrder = request.DisplayOrder };
        dbContext.Campaigns.Add(campaign);
        if (campaign.IsActive) await AddCampaignNotifications(campaign, token);
        await dbContext.SaveChangesAsync(token);
        return Created($"/api/admin/campaigns/{campaign.Id}", new { campaign.Id });
    }

    [HttpPatch("{id:guid}/active")]
    public async Task<IActionResult> SetActive(Guid id, SetActiveRequest request, CancellationToken token)
    {
        var campaign = await dbContext.Campaigns.SingleOrDefaultAsync(x => x.Id == id, token);
        if (campaign is null) return NotFound(new { message = "Kampanya bulunamadı." });
        var newlyActivated = request.IsActive && !campaign.IsActive;
        campaign.IsActive = request.IsActive;
        if (newlyActivated) await AddCampaignNotifications(campaign, token);
        await dbContext.SaveChangesAsync(token);
        return Ok(new { campaign.Id, campaign.IsActive });
    }

    private async Task AddCampaignNotifications(Campaign campaign, CancellationToken token)
    {
        var craftsmanIds = await dbContext.Craftsmen.Where(x => x.IsActive && x.CampaignNotificationsEnabled).Select(x => x.Id).ToListAsync(token);
        dbContext.CraftsmanNotifications.AddRange(craftsmanIds.Select(id => new CraftsmanNotification { CraftsmanId = id, Type = "Campaign", Title = campaign.Title, Message = campaign.Summary, ReferenceType = nameof(Campaign), ReferenceId = campaign.Id }));
    }
}

public sealed record CreateCampaignRequest(string Title, string Summary, decimal PointMultiplier, DateTimeOffset StartsAtUtc, DateTimeOffset EndsAtUtc, bool IsActive, int DisplayOrder);
