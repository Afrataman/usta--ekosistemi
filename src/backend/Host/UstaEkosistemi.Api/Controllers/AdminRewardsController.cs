using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using UstaEkosistemi.Api.Data;
using UstaEkosistemi.Api.Domain;

namespace UstaEkosistemi.Api.Controllers;

[ApiController]
[Route("api/admin/rewards")]
public sealed class AdminRewardsController(UstaEkosistemiDbContext dbContext) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll(CancellationToken token) => Ok(await dbContext.Rewards.AsNoTracking().OrderBy(x => x.DisplayOrder).Select(x => new { x.Id, x.Name, x.Description, x.PointCost, deliveryType = x.DeliveryType.ToString(), x.ImageKey, x.StockQuantity, x.IsActive, x.DisplayOrder, x.CreatedAtUtc }).ToListAsync(token));

    [HttpPost]
    public async Task<IActionResult> Create(UpsertRewardRequest request, CancellationToken token)
    {
        var error = Validate(request); if (error is not null) return ValidationProblem(error);
        var reward = new Reward { Name = request.Name.Trim(), Description = request.Description.Trim(), PointCost = request.PointCost, DeliveryType = request.DeliveryType, ImageKey = request.ImageKey.Trim(), StockQuantity = request.StockQuantity, IsActive = true, DisplayOrder = request.DisplayOrder };
        dbContext.Rewards.Add(reward); dbContext.RewardAuditEntries.Add(new RewardAuditEntry { RewardId = reward.Id, Action = "Created", Details = $"{reward.PointCost} puan, stok: {reward.StockQuantity?.ToString() ?? "sınırsız"}" }); await dbContext.SaveChangesAsync(token);
        return Created($"/api/admin/rewards/{reward.Id}", new { reward.Id });
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, UpsertRewardRequest request, CancellationToken token)
    {
        var error = Validate(request); if (error is not null) return ValidationProblem(error);
        var reward = await dbContext.Rewards.SingleOrDefaultAsync(x => x.Id == id, token); if (reward is null) return NotFound(new { message = "Ödül bulunamadı." });
        var before = $"Ad={reward.Name}; Puan={reward.PointCost}; Stok={reward.StockQuantity?.ToString() ?? "sınırsız"}; Aktif={reward.IsActive}";
        reward.Name = request.Name.Trim(); reward.Description = request.Description.Trim(); reward.PointCost = request.PointCost; reward.DeliveryType = request.DeliveryType; reward.ImageKey = request.ImageKey.Trim(); reward.StockQuantity = request.StockQuantity; reward.IsActive = request.IsActive; reward.DisplayOrder = request.DisplayOrder;
        dbContext.RewardAuditEntries.Add(new RewardAuditEntry { RewardId = reward.Id, Action = "Updated", Details = $"{before} → Ad={reward.Name}; Puan={reward.PointCost}; Stok={reward.StockQuantity?.ToString() ?? "sınırsız"}; Aktif={reward.IsActive}" }); await dbContext.SaveChangesAsync(token);
        return Ok(new { reward.Id });
    }

    private static string? Validate(UpsertRewardRequest request)
    {
        if (request.Name.Trim().Length is < 3 or > 120 || request.Description.Trim().Length is < 5 or > 400) return "Ödül adı veya açıklaması uygun uzunlukta değil.";
        if (request.PointCost <= 0 || request.StockQuantity < 0) return "Puan bedeli pozitif, stok sıfır veya daha büyük olmalıdır.";
        if (request.ImageKey.Trim().Length is < 2 or > 50) return "Görsel anahtarı geçersiz.";
        return null;
    }
}

public sealed record UpsertRewardRequest(string Name, string Description, int PointCost, RewardDeliveryType DeliveryType, string ImageKey, int? StockQuantity, bool IsActive, int DisplayOrder);
