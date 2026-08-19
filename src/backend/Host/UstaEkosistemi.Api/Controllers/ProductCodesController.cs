using System.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using UstaEkosistemi.Api.Data;
using UstaEkosistemi.Api.Domain;
using UstaEkosistemi.Api.Loyalty;
using UstaEkosistemi.Api.Security;

namespace UstaEkosistemi.Api.Controllers;

[ApiController]
[Route("api/product-codes")]
public sealed class ProductCodesController(UstaEkosistemiDbContext dbContext) : ControllerBase
{
    [HttpPost("redeem")]
    public async Task<IActionResult> Redeem(RedeemProductCodeRequest request, CancellationToken cancellationToken)
    {
        if (request.CraftsmanId == Guid.Empty || string.IsNullOrWhiteSpace(request.Code))
        {
            return ValidationProblem("Usta ve ürün kodu zorunludur.");
        }

        await using var transaction = await dbContext.Database.BeginTransactionAsync(IsolationLevel.Serializable, cancellationToken);
        var craftsman = await dbContext.Craftsmen.SingleOrDefaultAsync(x => x.Id == request.CraftsmanId && x.IsActive, cancellationToken);
        if (craftsman is null)
        {
            return NotFound(new { message = "Aktif usta bulunamadı." });
        }

        var productCode = await dbContext.ProductCodes
            .Include(x => x.Product)
            .SingleOrDefaultAsync(x => x.CodeHash == ProductCodeHasher.Hash(request.Code), cancellationToken);

        if (productCode is null)
        {
            return NotFound(new { message = "Ürün kodu geçersiz." });
        }

        if (productCode.Status != ProductCodeStatus.Available)
        {
            return Conflict(new { message = "Bu ürün kodu daha önce kullanılmış veya iptal edilmiş." });
        }

        if (!productCode.Product.IsActive)
        {
            return Conflict(new { message = "Bu ürün puan kazanmaya uygun değil." });
        }

        productCode.Status = ProductCodeStatus.Redeemed;
        productCode.RedeemedByCraftsmanId = request.CraftsmanId;
        productCode.RedeemedAtUtc = DateTimeOffset.UtcNow;

        var now = DateTimeOffset.UtcNow;
        var multiplier = await dbContext.Campaigns.Where(x => x.IsActive && x.StartsAtUtc <= now && x.EndsAtUtc >= now).MaxAsync(x => (decimal?)x.PointMultiplier, cancellationToken) ?? 1;
        var earnedPoints = decimal.ToInt32(decimal.Floor(productCode.Product.BasePoints * Math.Max(1, multiplier)));
        var ledgerEntry = new PointLedgerEntry
        {
            CraftsmanId = request.CraftsmanId,
            Amount = earnedPoints,
            TransactionType = PointTransactionType.ProductCodeEarned,
            ReferenceType = nameof(ProductCode),
            ReferenceId = productCode.Id,
            Description = multiplier > 1 ? $"{productCode.Product.Name} · {multiplier:0.##}X kampanya puanı" : $"{productCode.Product.Name} ürün kodu puanı"
        };
        dbContext.PointLedgerEntries.Add(ledgerEntry);
        var qualifyingPoints = await dbContext.PointLedgerEntries.Where(x => x.CraftsmanId == request.CraftsmanId && x.Amount > 0).SumAsync(x => (int?)x.Amount, cancellationToken) ?? 0;
        craftsman.Level = LoyaltyPolicy.GetLevel(qualifyingPoints + earnedPoints);
        await dbContext.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);

        var balance = await dbContext.PointLedgerEntries
            .Where(x => x.CraftsmanId == request.CraftsmanId)
            .SumAsync(x => x.Amount, cancellationToken);

        return Ok(new { earnedPoints = ledgerEntry.Amount, balance, product = productCode.Product.Name, campaignMultiplier = multiplier, level = craftsman.Level.ToString(), productCode.RedeemedAtUtc });
    }

    [HttpPost("return")]
    public async Task<IActionResult> Return(ReturnProductCodeRequest request, CancellationToken cancellationToken)
    {
        if (request.DealerEmployeeId == Guid.Empty || string.IsNullOrWhiteSpace(request.Code) || string.IsNullOrWhiteSpace(request.Reason)) return ValidationProblem("Bayi çalışanı, ürün kodu ve iade nedeni zorunludur.");
        if (request.Reason.Trim().Length is < 3 or > 200) return ValidationProblem("İade nedeni 3 ile 200 karakter arasında olmalıdır.");

        await using var transaction = await dbContext.Database.BeginTransactionAsync(IsolationLevel.Serializable, cancellationToken);
        if (!await dbContext.DealerEmployees.AnyAsync(x => x.Id == request.DealerEmployeeId && x.IsActive && x.Dealer.IsActive, cancellationToken)) return Unauthorized(new { message = "Yetkili bayi çalışanı bulunamadı." });
        var productCode = await dbContext.ProductCodes.Include(x => x.Product).SingleOrDefaultAsync(x => x.CodeHash == ProductCodeHasher.Hash(request.Code), cancellationToken);
        if (productCode is null) return NotFound(new { message = "Ürün kodu bulunamadı." });
        if (productCode.Status == ProductCodeStatus.Returned)
        {
            var existingReversal = await dbContext.PointLedgerEntries.AsNoTracking().SingleAsync(x => x.ReferenceType == nameof(ProductCode) && x.ReferenceId == productCode.Id && x.TransactionType == PointTransactionType.ReturnReversal, cancellationToken);
            return Ok(new { alreadyProcessed = true, reversedPoints = -existingReversal.Amount, productCode.ReturnedAtUtc, productCode.ReturnReason });
        }
        if (productCode.Status != ProductCodeStatus.Redeemed || !productCode.RedeemedByCraftsmanId.HasValue) return Conflict(new { message = "Yalnızca kullanılmış ürün kodları iade edilebilir." });

        var originalEntry = await dbContext.PointLedgerEntries.SingleAsync(x => x.ReferenceType == nameof(ProductCode) && x.ReferenceId == productCode.Id && x.TransactionType == PointTransactionType.ProductCodeEarned, cancellationToken);
        var reason = request.Reason.Trim();
        productCode.Status = ProductCodeStatus.Returned;
        productCode.ReturnedAtUtc = DateTimeOffset.UtcNow;
        productCode.ReturnReason = reason;
        productCode.ReturnedByDealerEmployeeId = request.DealerEmployeeId;
        dbContext.PointLedgerEntries.Add(new PointLedgerEntry
        {
            CraftsmanId = productCode.RedeemedByCraftsmanId.Value,
            Amount = -originalEntry.Amount,
            TransactionType = PointTransactionType.ReturnReversal,
            ReferenceType = nameof(ProductCode),
            ReferenceId = productCode.Id,
            Description = $"Ürün iadesi · {reason}"
        });
        await dbContext.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);
        var balance = await dbContext.PointLedgerEntries.Where(x => x.CraftsmanId == productCode.RedeemedByCraftsmanId.Value).SumAsync(x => x.Amount, cancellationToken);
        return Ok(new { alreadyProcessed = false, reversedPoints = originalEntry.Amount, balance, product = productCode.Product.Name, productCode.ReturnedAtUtc });
    }
}

public sealed record RedeemProductCodeRequest(Guid CraftsmanId, string Code);
public sealed record ReturnProductCodeRequest(Guid DealerEmployeeId, string Code, string Reason);
