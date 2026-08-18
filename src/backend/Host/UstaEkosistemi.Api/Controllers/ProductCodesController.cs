using System.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using UstaEkosistemi.Api.Data;
using UstaEkosistemi.Api.Domain;
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
        var craftsmanExists = await dbContext.Craftsmen.AnyAsync(x => x.Id == request.CraftsmanId && x.IsActive, cancellationToken);
        if (!craftsmanExists)
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

        var ledgerEntry = new PointLedgerEntry
        {
            CraftsmanId = request.CraftsmanId,
            Amount = productCode.Product.BasePoints,
            TransactionType = PointTransactionType.ProductCodeEarned,
            ReferenceType = nameof(ProductCode),
            ReferenceId = productCode.Id,
            Description = $"{productCode.Product.Name} ürün kodu puanı"
        };
        dbContext.PointLedgerEntries.Add(ledgerEntry);
        await dbContext.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);

        var balance = await dbContext.PointLedgerEntries
            .Where(x => x.CraftsmanId == request.CraftsmanId)
            .SumAsync(x => x.Amount, cancellationToken);

        return Ok(new { earnedPoints = ledgerEntry.Amount, balance, product = productCode.Product.Name, productCode.RedeemedAtUtc });
    }
}

public sealed record RedeemProductCodeRequest(Guid CraftsmanId, string Code);
