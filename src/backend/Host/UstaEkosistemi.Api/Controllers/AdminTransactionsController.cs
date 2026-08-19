using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using UstaEkosistemi.Api.Data;
using UstaEkosistemi.Api.Domain;

namespace UstaEkosistemi.Api.Controllers;

[ApiController]
[Route("api/admin/transactions")]
public sealed class AdminTransactionsController(UstaEkosistemiDbContext dbContext) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll(string? type, int take = 100, CancellationToken token = default)
    {
        take = Math.Clamp(take, 1, 500);
        var pointQuery = dbContext.PointLedgerEntries.AsNoTracking();
        var couponOnly = type?.Equals("CouponFulfilled", StringComparison.OrdinalIgnoreCase) == true;
        if (couponOnly) pointQuery = pointQuery.Where(_ => false);
        else if (!string.IsNullOrWhiteSpace(type) && Enum.TryParse<PointTransactionType>(type, true, out var pointType)) pointQuery = pointQuery.Where(x => x.TransactionType == pointType);
        var points = await pointQuery.OrderByDescending(x => x.CreatedAtUtc).Take(take).Select(x => new AdminTransactionRow(x.Id, "Points", x.TransactionType.ToString(), x.Description, x.Amount, x.Craftsman.FullName, x.Craftsman.PhoneNumber, x.ReferenceType, x.ReferenceId.ToString(), x.CreatedAtUtc, null)).ToListAsync(token);

        var deliveries = string.IsNullOrWhiteSpace(type) || type.Equals("CouponFulfilled", StringComparison.OrdinalIgnoreCase)
            ? await dbContext.RewardRedemptions.AsNoTracking().Where(x => x.Status == RewardRedemptionStatus.Fulfilled).OrderByDescending(x => x.FulfilledAtUtc).Take(take)
                .Select(x => new AdminTransactionRow(x.Id, "Coupon", "CouponFulfilled", $"{x.Reward.Name} teslim edildi", -x.PointsSpent, x.Craftsman.FullName, x.Craftsman.PhoneNumber, "RewardRedemption", x.Id.ToString(), x.FulfilledAtUtc!.Value, x.FulfilledByDealerEmployee == null ? null : x.FulfilledByDealerEmployee.FullName)).ToListAsync(token)
            : [];

        var rows = points.Concat(deliveries).OrderByDescending(x => x.OccurredAtUtc).Take(take).ToList();
        return Ok(new
        {
            rows,
            summary = new
            {
                earnedPoints = await dbContext.PointLedgerEntries.Where(x => x.Amount > 0).SumAsync(x => (long?)x.Amount, token) ?? 0,
                spentPoints = -(await dbContext.PointLedgerEntries.Where(x => x.TransactionType == PointTransactionType.RewardRedeemed).SumAsync(x => (long?)x.Amount, token) ?? 0),
                reversedPoints = -(await dbContext.PointLedgerEntries.Where(x => x.TransactionType == PointTransactionType.ReturnReversal).SumAsync(x => (long?)x.Amount, token) ?? 0),
                fulfilledCoupons = await dbContext.RewardRedemptions.CountAsync(x => x.Status == RewardRedemptionStatus.Fulfilled, token)
            }
        });
    }
}

public sealed record AdminTransactionRow(Guid Id, string Category, string Type, string Description, int Amount, string Craftsman, string PhoneNumber, string ReferenceType, string ReferenceValue, DateTimeOffset OccurredAtUtc, string? DealerEmployee);
