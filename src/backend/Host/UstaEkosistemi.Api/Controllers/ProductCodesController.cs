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
}

public sealed record RedeemProductCodeRequest(Guid CraftsmanId, string Code);
