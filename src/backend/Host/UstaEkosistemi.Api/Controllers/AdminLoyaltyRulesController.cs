using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using UstaEkosistemi.Api.Data;
using UstaEkosistemi.Api.Domain;

namespace UstaEkosistemi.Api.Controllers;

[ApiController]
[Route("api/admin/loyalty-rules")]
public sealed class AdminLoyaltyRulesController(UstaEkosistemiDbContext dbContext) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> Get(CancellationToken token)
    {
        var config = await dbContext.LoyaltyConfigurations.AsNoTracking().SingleAsync(x => x.Id == LoyaltyConfiguration.DefaultId, token);
        var history = await dbContext.LoyaltyConfigurationAudits.AsNoTracking().OrderByDescending(x => x.CreatedAtUtc).Take(20).ToListAsync(token);
        return Ok(new { config.SilverThreshold, config.GoldThreshold, config.PointsPerRewardTry, config.UpdatedAtUtc, history });
    }

    [HttpPut]
    public async Task<IActionResult> Update(UpdateLoyaltyRulesRequest request, CancellationToken token)
    {
        if (request.SilverThreshold <= 0 || request.GoldThreshold <= request.SilverThreshold || request.PointsPerRewardTry <= 0) return ValidationProblem("Seviye eşikleri ve ödül değer oranı geçersiz.");
        var note = request.ChangeNote.Trim(); if (note.Length is < 5 or > 300) return ValidationProblem("Değişiklik gerekçesi 5 ile 300 karakter arasında olmalıdır.");
        var config = await dbContext.LoyaltyConfigurations.SingleAsync(x => x.Id == LoyaltyConfiguration.DefaultId, token);
        config.SilverThreshold = request.SilverThreshold; config.GoldThreshold = request.GoldThreshold; config.PointsPerRewardTry = request.PointsPerRewardTry; config.UpdatedAtUtc = DateTimeOffset.UtcNow;
        dbContext.LoyaltyConfigurationAudits.Add(new LoyaltyConfigurationAudit { SilverThreshold = request.SilverThreshold, GoldThreshold = request.GoldThreshold, PointsPerRewardTry = request.PointsPerRewardTry, ChangeNote = note });
        await dbContext.SaveChangesAsync(token);
        return Ok(new { config.UpdatedAtUtc });
    }
}

public sealed record UpdateLoyaltyRulesRequest(int SilverThreshold, int GoldThreshold, int PointsPerRewardTry, string ChangeNote);
