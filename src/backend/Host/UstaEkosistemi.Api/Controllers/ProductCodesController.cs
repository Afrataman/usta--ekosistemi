using System.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using UstaEkosistemi.Api.Data;
using UstaEkosistemi.Api.Domain;
using UstaEkosistemi.Api.Loyalty;
using UstaEkosistemi.Api.Security;
using UstaEkosistemi.Api.ReliableDelivery;

namespace UstaEkosistemi.Api.Controllers;

[ApiController]
[Route("api/product-codes")]
public sealed class ProductCodesController(UstaEkosistemiDbContext dbContext, DealerSessionAuthenticator authenticator) : ControllerBase
{
    [HttpPost("redeem")]
    public async Task<IActionResult> Redeem(RedeemProductCodeRequest request, CancellationToken cancellationToken)
    {
        if (request.CraftsmanId == Guid.Empty || request.RequestId == Guid.Empty || string.IsNullOrWhiteSpace(request.Code))
        {
            return ValidationProblem("Usta, işlem anahtarı ve ürün kodu zorunludur.");
        }
        if (!TryGetAuthenticatedCraftsman(out var authenticatedId) || authenticatedId != request.CraftsmanId) return Unauthorized(new { message = "Usta oturumu geçersiz veya hesapla eşleşmiyor." });

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
            if (productCode.Status == ProductCodeStatus.Redeemed && productCode.RedeemedByCraftsmanId == request.CraftsmanId && productCode.RedemptionRequestId == request.RequestId)
            {
                var existingEntry = await dbContext.PointLedgerEntries.AsNoTracking().SingleAsync(x => x.ReferenceType == nameof(ProductCode) && x.ReferenceId == productCode.Id && x.TransactionType == PointTransactionType.ProductCodeEarned, cancellationToken);
                var existingBalance = await dbContext.PointLedgerEntries.Where(x => x.CraftsmanId == request.CraftsmanId).SumAsync(x => x.Amount, cancellationToken);
                return Ok(new { alreadyProcessed = true, earnedPoints = existingEntry.Amount, balance = existingBalance, product = productCode.Product.Name, campaignMultiplier = 1, level = craftsman.Level.ToString(), productCode.RedeemedAtUtc });
            }
            return Conflict(new { message = "Bu ürün kodu daha önce kullanılmış veya iptal edilmiş." });
        }

        if (!productCode.Product.IsActive)
        {
            return Conflict(new { message = "Bu ürün puan kazanmaya uygun değil." });
        }

        productCode.Status = ProductCodeStatus.Redeemed;
        productCode.RedeemedByCraftsmanId = request.CraftsmanId;
        productCode.RedeemedAtUtc = DateTimeOffset.UtcNow;
        productCode.RedemptionRequestId = request.RequestId;

        var now = DateTimeOffset.UtcNow;
        var multiplier = await dbContext.Campaigns.Where(x => x.IsActive && x.StartsAtUtc <= now && x.EndsAtUtc >= now && (x.ProductId == null || x.ProductId == productCode.ProductId)).MaxAsync(x => (decimal?)x.PointMultiplier, cancellationToken) ?? 1;
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
        dbContext.QueueCraftsmanNotification(request.CraftsmanId, "PointsEarned", $"{earnedPoints:N0} puan kazandınız", $"{productCode.Product.Name} ürün kodu başarıyla kullanıldı.", nameof(ProductCode), productCode.Id);
        var qualifyingPoints = await dbContext.PointLedgerEntries.Where(x => x.CraftsmanId == request.CraftsmanId && x.Amount > 0).SumAsync(x => (int?)x.Amount, cancellationToken) ?? 0;
        var loyaltyConfig = await dbContext.LoyaltyConfigurations.AsNoTracking().SingleAsync(x => x.Id == LoyaltyConfiguration.DefaultId, cancellationToken);
        craftsman.Level = LoyaltyPolicy.GetLevel(qualifyingPoints + earnedPoints, loyaltyConfig.SilverThreshold, loyaltyConfig.GoldThreshold);
        await dbContext.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);

        var balance = await dbContext.PointLedgerEntries
            .Where(x => x.CraftsmanId == request.CraftsmanId)
            .SumAsync(x => x.Amount, cancellationToken);

        return Ok(new { alreadyProcessed = false, earnedPoints = ledgerEntry.Amount, balance, product = productCode.Product.Name, campaignMultiplier = multiplier, level = craftsman.Level.ToString(), productCode.RedeemedAtUtc });
    }

    private bool TryGetAuthenticatedCraftsman(out Guid craftsmanId)
    {
        craftsmanId = Guid.Empty;
        var authorization = Request.Headers.Authorization.ToString();
        if (!authorization.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase)) return false;
        var hash = CraftsmanSessionSecurity.HashToken(authorization[7..].Trim()); var now = DateTimeOffset.UtcNow;
        var id = dbContext.CraftsmanSessions.Where(x => x.TokenHash == hash && x.RevokedAtUtc == null && x.ExpiresAtUtc > now && x.Craftsman.IsActive).Select(x => (Guid?)x.CraftsmanId).SingleOrDefault();
        if (!id.HasValue) return false; craftsmanId = id.Value; return true;
    }

    [HttpPost("return")]
    public async Task<IActionResult> Return(ReturnProductCodeRequest request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Code) || string.IsNullOrWhiteSpace(request.Reason)) return ValidationProblem("Ürün kodu ve iade nedeni zorunludur.");
        if (request.Reason.Trim().Length is < 3 or > 200) return ValidationProblem("İade nedeni 3 ile 200 karakter arasında olmalıdır.");

        await using var transaction = await dbContext.Database.BeginTransactionAsync(IsolationLevel.Serializable, cancellationToken);
        var employee = await authenticator.AuthenticateAsync(Request.Headers.Authorization, cancellationToken); if (employee is null) return Unauthorized(new { message = "Bayi oturumu geçersiz veya süresi dolmuş." });
        var productCode = await dbContext.ProductCodes.Include(x => x.Product).SingleOrDefaultAsync(x => x.CodeHash == ProductCodeHasher.Hash(request.Code), cancellationToken);
        if (productCode is null) return NotFound(new { message = "Ürün kodu bulunamadı." });
        if (productCode.Status == ProductCodeStatus.Returned)
        {
            var existingReversal = await dbContext.PointLedgerEntries.AsNoTracking().SingleAsync(x => x.ReferenceType == nameof(ProductCode) && x.ReferenceId == productCode.Id && x.TransactionType == PointTransactionType.ReturnReversal, cancellationToken);
            var existingBalance = await dbContext.PointLedgerEntries.Where(x => x.CraftsmanId == existingReversal.CraftsmanId).SumAsync(x => (int?)x.Amount, cancellationToken) ?? 0;
            return Ok(new { alreadyProcessed = true, reversedPoints = -existingReversal.Amount, balance = existingBalance, pointDebt = Math.Max(0, -existingBalance), rewardRedemptionRestricted = existingBalance < 0, product = productCode.Product.Name, productCode.ReturnedAtUtc, productCode.ReturnReason });
        }
        if (productCode.Status != ProductCodeStatus.Redeemed || !productCode.RedeemedByCraftsmanId.HasValue) return Conflict(new { message = "Yalnızca kullanılmış ürün kodları iade edilebilir." });

        var originalEntry = await dbContext.PointLedgerEntries.SingleAsync(x => x.ReferenceType == nameof(ProductCode) && x.ReferenceId == productCode.Id && x.TransactionType == PointTransactionType.ProductCodeEarned, cancellationToken);
        var currentBalance = await dbContext.PointLedgerEntries.Where(x => x.CraftsmanId == productCode.RedeemedByCraftsmanId.Value).SumAsync(x => (int?)x.Amount, cancellationToken) ?? 0;
        var balance = currentBalance - originalEntry.Amount;
        var pointDebt = Math.Max(0, -balance);
        var reason = request.Reason.Trim();
        productCode.Status = ProductCodeStatus.Returned;
        productCode.ReturnedAtUtc = DateTimeOffset.UtcNow;
        productCode.ReturnReason = reason;
        productCode.ReturnedByDealerEmployeeId = employee.Id;
        dbContext.PointLedgerEntries.Add(new PointLedgerEntry
        {
            CraftsmanId = productCode.RedeemedByCraftsmanId.Value,
            Amount = -originalEntry.Amount,
            TransactionType = PointTransactionType.ReturnReversal,
            ReferenceType = nameof(ProductCode),
            ReferenceId = productCode.Id,
            Description = $"Ürün iadesi · {reason}"
        });
        var debtMessage = pointDebt > 0 ? $" Hesabınızda {pointDebt:N0} puan açığı oluştu; açık kapanana kadar yeni ödül alınamaz." : string.Empty;
        dbContext.QueueCraftsmanNotification(productCode.RedeemedByCraftsmanId.Value, "Return", "Ürün iadesi işlendi", $"{productCode.Product.Name} iadesi nedeniyle {originalEntry.Amount:N0} puan geri alındı. Neden: {reason}.{debtMessage}", nameof(ProductCode), productCode.Id);
        await dbContext.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);
        return Ok(new { alreadyProcessed = false, reversedPoints = originalEntry.Amount, balance, pointDebt, rewardRedemptionRestricted = pointDebt > 0, product = productCode.Product.Name, productCode.ReturnedAtUtc });
    }
}

public sealed record RedeemProductCodeRequest(Guid CraftsmanId, string Code, Guid RequestId);
public sealed record ReturnProductCodeRequest(string Code, string Reason);
