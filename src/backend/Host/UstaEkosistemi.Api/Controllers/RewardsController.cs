using System.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using UstaEkosistemi.Api.Data;
using UstaEkosistemi.Api.Domain;

namespace UstaEkosistemi.Api.Controllers;

[ApiController]
[Route("api/rewards")]
public sealed class RewardsController(UstaEkosistemiDbContext dbContext) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetCatalog(RewardDeliveryType? deliveryType, CancellationToken cancellationToken)
    {
        var query = dbContext.Rewards.AsNoTracking().Where(x => x.IsActive);
        if (deliveryType.HasValue)
        {
            query = query.Where(x => x.DeliveryType == deliveryType.Value);
        }

        var rewards = await query.OrderBy(x => x.DisplayOrder).ThenBy(x => x.Name)
            .Select(x => new
            {
                x.Id,
                x.Name,
                x.Description,
                x.PointCost,
                deliveryType = x.DeliveryType.ToString(),
                x.ImageKey,
                x.StockQuantity,
                isAvailable = x.StockQuantity == null || x.StockQuantity > 0
            })
            .ToListAsync(cancellationToken);

        return Ok(rewards);
    }

    [HttpPost("{rewardId:guid}/redeem")]
    public async Task<IActionResult> Redeem(Guid rewardId, RedeemRewardRequest request, CancellationToken cancellationToken)
    {
        await using var transaction = await dbContext.Database.BeginTransactionAsync(IsolationLevel.Serializable, cancellationToken);
        var craftsmanExists = await dbContext.Craftsmen.AnyAsync(x => x.Id == request.CraftsmanId && x.IsActive, cancellationToken);
        if (!craftsmanExists)
        {
            return NotFound(new { message = "Aktif usta bulunamadı." });
        }

        var reward = await dbContext.Rewards.SingleOrDefaultAsync(x => x.Id == rewardId && x.IsActive, cancellationToken);
        if (reward is null)
        {
            return NotFound(new { message = "Ödül bulunamadı." });
        }

        if (reward.StockQuantity.HasValue && reward.StockQuantity.Value <= 0)
        {
            return Conflict(new { message = "Bu ödülün stoğu tükendi." });
        }

        var balance = await dbContext.PointLedgerEntries
            .Where(x => x.CraftsmanId == request.CraftsmanId)
            .SumAsync(x => (int?)x.Amount, cancellationToken) ?? 0;
        if (balance < reward.PointCost)
        {
            return Conflict(new { message = "Bu ödül için yeterli puanınız yok." });
        }

        var redemption = new RewardRedemption
        {
            CraftsmanId = request.CraftsmanId,
            RewardId = reward.Id,
            PointsSpent = reward.PointCost,
            FulfillmentCode = $"UK-{Guid.NewGuid():N}"[..15].ToUpperInvariant(),
            ExpiresAtUtc = DateTimeOffset.UtcNow.AddDays(30)
        };
        dbContext.RewardRedemptions.Add(redemption);
        dbContext.PointLedgerEntries.Add(new PointLedgerEntry
        {
            CraftsmanId = request.CraftsmanId,
            Amount = -reward.PointCost,
            TransactionType = PointTransactionType.RewardRedeemed,
            ReferenceType = nameof(RewardRedemption),
            ReferenceId = redemption.Id,
            Description = $"{reward.Name} ödülü"
        });
        dbContext.CraftsmanNotifications.Add(new CraftsmanNotification { CraftsmanId = request.CraftsmanId, Type = "Reward", Title = "Ödülünüz hazır", Message = $"{reward.Name} için {reward.PointCost:N0} puan kullanıldı. Teslim kodunuz Kuponlar ekranında.", ReferenceType = nameof(RewardRedemption), ReferenceId = redemption.Id });
        if (reward.StockQuantity.HasValue)
        {
            reward.StockQuantity--;
        }

        await dbContext.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);

        return Ok(new
        {
            redemption.Id,
            reward = reward.Name,
            redemption.PointsSpent,
            redemption.FulfillmentCode,
            deliveryType = reward.DeliveryType.ToString(),
            balance = balance - reward.PointCost
        });
    }
}

public sealed record RedeemRewardRequest(Guid CraftsmanId);
