using System.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using UstaEkosistemi.Api.Data;
using UstaEkosistemi.Api.Domain;

namespace UstaEkosistemi.Api.Controllers;

[ApiController]
[Route("api/dealer/coupons")]
public sealed class DealerCouponsController(UstaEkosistemiDbContext dbContext) : ControllerBase
{
    [HttpGet("{code}")]
    public async Task<IActionResult> Verify(string code, Guid dealerEmployeeId, CancellationToken cancellationToken)
    {
        if (!await IsAuthorizedEmployee(dealerEmployeeId, cancellationToken)) return Unauthorized(new { message = "Yetkili bayi çalışanı bulunamadı." });
        var coupon = await FindCoupon(code, cancellationToken);
        if (coupon is null) return NotFound(new { message = "Kupon bulunamadı." });
        return Ok(ToResult(coupon, false));
    }

    [HttpPost("{code}/fulfill")]
    public async Task<IActionResult> Fulfill(string code, FulfillCouponRequest request, CancellationToken cancellationToken)
    {
        await using var transaction = await dbContext.Database.BeginTransactionAsync(IsolationLevel.Serializable, cancellationToken);
        if (!await IsAuthorizedEmployee(request.DealerEmployeeId, cancellationToken)) return Unauthorized(new { message = "Yetkili bayi çalışanı bulunamadı." });
        var coupon = await dbContext.RewardRedemptions.Include(x => x.Reward).Include(x => x.Craftsman).SingleOrDefaultAsync(x => x.FulfillmentCode == code.Trim().ToUpper(), cancellationToken);
        if (coupon is null) return NotFound(new { message = "Kupon bulunamadı." });
        if (coupon.Status == RewardRedemptionStatus.Fulfilled) return Ok(ToResult(coupon, true));
        if (coupon.Status != RewardRedemptionStatus.Created) return Conflict(new { message = "Kupon kullanıma uygun değil." });
        if (coupon.Reward.DeliveryType != RewardDeliveryType.DealerPickup) return Conflict(new { message = "Bu ödül bayiden teslim edilemez." });
        if (coupon.ExpiresAtUtc.HasValue && coupon.ExpiresAtUtc <= DateTimeOffset.UtcNow) return Conflict(new { message = "Kuponun süresi dolmuş." });
        coupon.Status = RewardRedemptionStatus.Fulfilled; coupon.FulfilledAtUtc = DateTimeOffset.UtcNow; coupon.FulfilledByDealerEmployeeId = request.DealerEmployeeId;
        await dbContext.SaveChangesAsync(cancellationToken); await transaction.CommitAsync(cancellationToken);
        return Ok(ToResult(coupon, false));
    }

    private Task<bool> IsAuthorizedEmployee(Guid id, CancellationToken token) => dbContext.DealerEmployees.AnyAsync(x => x.Id == id && x.IsActive && x.Dealer.IsActive, token);
    private Task<RewardRedemption?> FindCoupon(string code, CancellationToken token) => dbContext.RewardRedemptions.AsNoTracking().Include(x => x.Reward).Include(x => x.Craftsman).SingleOrDefaultAsync(x => x.FulfillmentCode == code.Trim().ToUpper(), token);
    private static object ToResult(RewardRedemption coupon, bool alreadyProcessed) => new { coupon.Id, coupon.FulfillmentCode, reward = coupon.Reward.Name, craftsman = coupon.Craftsman.FullName, status = coupon.Status.ToString(), coupon.ExpiresAtUtc, coupon.FulfilledAtUtc, coupon.FulfilledByDealerEmployeeId, alreadyProcessed };
}

public sealed record FulfillCouponRequest(Guid DealerEmployeeId);
