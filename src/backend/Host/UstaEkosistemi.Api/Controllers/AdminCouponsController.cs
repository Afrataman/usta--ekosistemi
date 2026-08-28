using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using UstaEkosistemi.Api.Data;
using UstaEkosistemi.Api.Domain;

namespace UstaEkosistemi.Api.Controllers;

[ApiController]
[Route("api/admin/coupons")]
public sealed class AdminCouponsController(UstaEkosistemiDbContext dbContext) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> Get(string? status, string? search, int take = 200, CancellationToken token = default)
    {
        var now = DateTimeOffset.UtcNow; var soon = now.AddDays(7); take = Math.Clamp(take, 1, 500);
        var all = dbContext.RewardRedemptions.AsNoTracking();
        var query = all.AsQueryable();
        if (!string.IsNullOrWhiteSpace(search)) { var term = search.Trim(); query = query.Where(x => x.FulfillmentCode.Contains(term) || x.Craftsman.FullName.Contains(term) || x.Reward.Name.Contains(term)); }
        query = status?.ToLowerInvariant() switch
        {
            "active" => query.Where(x => x.Status == RewardRedemptionStatus.Created && (!x.ExpiresAtUtc.HasValue || x.ExpiresAtUtc > now)),
            "expiring" => query.Where(x => x.Status == RewardRedemptionStatus.Created && x.ExpiresAtUtc > now && x.ExpiresAtUtc <= soon),
            "expired" => query.Where(x => x.Status == RewardRedemptionStatus.Created && x.ExpiresAtUtc <= now),
            "fulfilled" => query.Where(x => x.Status == RewardRedemptionStatus.Fulfilled),
            "cancelled" => query.Where(x => x.Status == RewardRedemptionStatus.Cancelled),
            _ => query
        };
        var rows = await query.OrderByDescending(x => x.CreatedAtUtc).Take(take).Select(x => new
        {
            x.Id, x.FulfillmentCode, reward = x.Reward.Name, deliveryType = x.Reward.DeliveryType.ToString(), craftsman = x.Craftsman.FullName,
            phoneNumber = x.Craftsman.PhoneNumber.Length > 4 ? "*******" + x.Craftsman.PhoneNumber.Substring(x.Craftsman.PhoneNumber.Length - 4) : "****",
            storedStatus = x.Status.ToString(), displayStatus = x.Status == RewardRedemptionStatus.Created && x.ExpiresAtUtc <= now ? "Expired" : x.Status.ToString(),
            x.PointsSpent, x.CreatedAtUtc, x.ExpiresAtUtc, x.FulfilledAtUtc,
            dealer = x.FulfilledByDealerEmployee == null ? null : x.FulfilledByDealerEmployee.Dealer.Name,
            dealerEmployee = x.FulfilledByDealerEmployee == null ? null : x.FulfilledByDealerEmployee.FullName
        }).ToListAsync(token);
        return Ok(new
        {
            rows,
            summary = new
            {
                active = await all.CountAsync(x => x.Status == RewardRedemptionStatus.Created && (!x.ExpiresAtUtc.HasValue || x.ExpiresAtUtc > now), token),
                expiring = await all.CountAsync(x => x.Status == RewardRedemptionStatus.Created && x.ExpiresAtUtc > now && x.ExpiresAtUtc <= soon, token),
                expired = await all.CountAsync(x => x.Status == RewardRedemptionStatus.Created && x.ExpiresAtUtc <= now, token),
                fulfilled = await all.CountAsync(x => x.Status == RewardRedemptionStatus.Fulfilled, token),
                cancelled = await all.CountAsync(x => x.Status == RewardRedemptionStatus.Cancelled, token)
            }
        });
    }
}
