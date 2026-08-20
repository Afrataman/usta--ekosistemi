using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using UstaEkosistemi.Api.Data;
using UstaEkosistemi.Api.Domain;
using UstaEkosistemi.Api.Security;

namespace UstaEkosistemi.Api.Controllers;

[ApiController]
[Route("api/admin/transactions")]
public sealed class AdminTransactionsController(UstaEkosistemiDbContext dbContext) : ControllerBase
{
    [HttpPost("adjustments")]
    public async Task<IActionResult> CreateAdjustment(CreatePointAdjustmentRequest request, CancellationToken token)
    {
        if (request.Amount is 0 or < -100000 or > 100000)
            return ValidationProblem("Düzeltme miktarı sıfır olamaz ve ±100.000 puan sınırında olmalıdır.");
        var reason = request.Reason.Trim();
        if (reason.Length is < 10 or > 240)
            return ValidationProblem("Düzeltme nedeni 10 ile 240 karakter arasında olmalıdır.");
        if (!HttpContext.Items.TryGetValue("AdminUserId", out var actorValue) || actorValue is not Guid actorId)
            return Unauthorized(new { message = "Yönetici kimliği doğrulanamadı." });

        var craftsman = await dbContext.Craftsmen.SingleOrDefaultAsync(x => x.Id == request.CraftsmanId && x.IsActive, token);
        if (craftsman is null) return NotFound(new { message = "Aktif usta bulunamadı." });

        var adjustmentId = Guid.NewGuid();
        var actor = HttpContext.Items["AdminName"]?.ToString() ?? "Yetkili yönetici";
        dbContext.PointLedgerEntries.Add(new PointLedgerEntry
        {
            Id = adjustmentId,
            CraftsmanId = craftsman.Id,
            Amount = request.Amount,
            TransactionType = PointTransactionType.ManualAdjustment,
            ReferenceType = "AdminAdjustment",
            ReferenceId = adjustmentId,
            Description = $"Yetkili düzeltme · {reason} · {actor}"
        });
        dbContext.CraftsmanNotifications.Add(new CraftsmanNotification
        {
            CraftsmanId = craftsman.Id,
            Type = "PointsEarned",
            Title = "Puan düzeltmesi yapıldı",
            Message = $"Hesabınıza {(request.Amount > 0 ? "+" : string.Empty)}{request.Amount:N0} puan düzeltmesi uygulandı. Neden: {reason}",
            ReferenceType = "AdminAdjustment",
            ReferenceId = adjustmentId
        });
        dbContext.AddAdminAudit(HttpContext, "PointAdjustment", nameof(Craftsman), craftsman.Id, $"Usta={craftsman.FullName}; miktar={request.Amount}; gerekçe={reason}");
        await dbContext.SaveChangesAsync(token);
        var balance = await dbContext.PointLedgerEntries.Where(x => x.CraftsmanId == craftsman.Id).SumAsync(x => (int?)x.Amount, token) ?? 0;
        return Ok(new { id = adjustmentId, craftsman = craftsman.FullName, request.Amount, reason, actorId, actor, balance, pointDebt = Math.Max(0, -balance), createdAtUtc = DateTimeOffset.UtcNow });
    }

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
public sealed record CreatePointAdjustmentRequest(Guid CraftsmanId, int Amount, string Reason);
