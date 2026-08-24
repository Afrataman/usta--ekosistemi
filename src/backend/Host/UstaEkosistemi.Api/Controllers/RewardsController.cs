using System.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using UstaEkosistemi.Api.Data;
using UstaEkosistemi.Api.Domain;
using UstaEkosistemi.Api.Security;
using UstaEkosistemi.Api.ReliableDelivery;

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
        if (request.RequestId == Guid.Empty) return ValidationProblem("Ödül işlem anahtarı zorunludur.");
        var authorization = Request.Headers.Authorization.ToString();
        if (!authorization.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase)) return Unauthorized(new { message = "Usta oturumu zorunludur." });
        var hash = CraftsmanSessionSecurity.HashToken(authorization[7..].Trim()); var now = DateTimeOffset.UtcNow;
        var authenticatedId = await dbContext.CraftsmanSessions.Where(x => x.TokenHash == hash && x.RevokedAtUtc == null && x.ExpiresAtUtc > now && x.Craftsman.IsActive).Select(x => (Guid?)x.CraftsmanId).SingleOrDefaultAsync(cancellationToken);
        if (authenticatedId != request.CraftsmanId) return Unauthorized(new { message = "Usta oturumu hesapla eşleşmiyor." });
        await using var transaction = await dbContext.Database.BeginTransactionAsync(IsolationLevel.Serializable, cancellationToken);
        var existing = await dbContext.RewardRedemptions.Include(x => x.Reward).SingleOrDefaultAsync(x => x.RedemptionRequestId == request.RequestId, cancellationToken);
        if (existing is not null)
        {
            if (existing.CraftsmanId != request.CraftsmanId || existing.RewardId != rewardId) return Conflict(new { message = "İşlem anahtarı başka bir ödül işleminde kullanılmış." });
            var existingBalance = await dbContext.PointLedgerEntries.Where(x => x.CraftsmanId == request.CraftsmanId).SumAsync(x => (int?)x.Amount, cancellationToken) ?? 0;
            return Ok(ToResult(existing, existing.Reward, existingBalance, true));
        }
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
        if (balance < 0)
        {
            return Conflict(new
            {
                message = $"İade sonrası {-balance:N0} puan açığınız bulunuyor. Açık kapanana kadar yeni ödül alınamaz.",
                pointDebt = -balance,
                canRedeemRewards = false
            });
        }
        if (balance < reward.PointCost)
        {
            return Conflict(new { message = "Bu ödül için yeterli puanınız yok." });
        }

        var redemption = new RewardRedemption
        {
            CraftsmanId = request.CraftsmanId,
            RewardId = reward.Id,
            RedemptionRequestId = request.RequestId,
            PointsSpent = reward.PointCost,
            FulfillmentCode = $"UK-{Guid.NewGuid():N}"[..15].ToUpperInvariant(),
            Status = reward.DeliveryType == RewardDeliveryType.Digital ? RewardRedemptionStatus.Fulfilled : RewardRedemptionStatus.Created,
            ExpiresAtUtc = reward.DeliveryType == RewardDeliveryType.Digital ? null : DateTimeOffset.UtcNow.AddDays(30),
            FulfilledAtUtc = reward.DeliveryType == RewardDeliveryType.Digital ? DateTimeOffset.UtcNow : null
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
        var deliveryMessage = reward.DeliveryType == RewardDeliveryType.Digital ? "Dijital ödül kodunuz anında teslim edildi ve Kuponlar ekranına kaydedildi." : "Bayiden teslim kodunuz Kuponlar ekranında hazır.";
        dbContext.QueueCraftsmanNotification(request.CraftsmanId, "Reward", "Ödülünüz hazır", $"{reward.Name} için {reward.PointCost:N0} puan kullanıldı. {deliveryMessage}", nameof(RewardRedemption), redemption.Id);
        if (reward.StockQuantity.HasValue)
        {
            reward.StockQuantity--;
        }

        await dbContext.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);

        return Ok(ToResult(redemption, reward, balance - reward.PointCost, false));
    }

    private static object ToResult(RewardRedemption redemption, Reward reward, int balance, bool alreadyProcessed) => new
    {
        redemption.Id, reward = reward.Name, redemption.PointsSpent, redemption.FulfillmentCode,
        deliveryType = reward.DeliveryType.ToString(), status = redemption.Status.ToString(),
        redemption.FulfilledAtUtc, balance, alreadyProcessed
    };
}

public sealed record RedeemRewardRequest(Guid CraftsmanId, Guid RequestId);
